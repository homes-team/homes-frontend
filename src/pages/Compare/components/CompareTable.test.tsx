import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PropertyDetail } from '../../../types/property';
import CompareTable, { CompareColumn } from './CompareTable';

function detail(id: number, overrides: Partial<PropertyDetail>): PropertyDetail {
  return {
    propertyId: id, imageUrls: [], title: `매물 ${id}`, description: '', address: '', detailAddress: '',
    tradeType: 'JEONSE', propertyType: 'APARTMENT', deposit: 40000, monthlyRent: 0, maintenanceFee: 10,
    totalFloors: 5, currentFloor: 2, direction: 'SOUTH', remodelingYear: null, area: 30, aiScore: 70,
    desiredBrokerageFee: null, options: [], nearestStation: null, walkingTime: null, latitude: 37, longitude: 127,
    favoriteCount: 0, isSuspicious: false, status: 'AVAILABLE', ...overrides,
  };
}

const column = (id: number, overrides: Partial<PropertyDetail> | null): CompareColumn => ({
  propertyId: id,
  title: `매물 ${id}`,
  detail: overrides === null ? null : detail(id, overrides),
});

function renderTable(columns: CompareColumn[]) {
  render(<MemoryRouter><CompareTable columns={columns} onRemove={vi.fn()} /></MemoryRouter>);
}

/** 라벨이 일치하는 행의 칸들을 [텍스트, 강조 여부]로 읽는다 */
function row(label: string): Array<[string, boolean]> {
  const tr = screen.getByRole('rowheader', { name: label }).closest('tr') as HTMLElement;
  return within(tr).getAllByRole('cell').map((cell) => [cell.textContent ?? '', cell.className.includes('bg-primary-50')]);
}

describe('CompareTable', () => {
  it('highlights the cheapest deposit, lowest fee and largest area among same-type properties', () => {
    renderTable([
      column(1, { deposit: 55555, maintenanceFee: 12, area: 33 }),
      column(2, { deposit: 42000, maintenanceFee: 8, area: 26.5 }),
      column(3, { deposit: 48000, maintenanceFee: 15, area: 41.2 }),
    ]);

    expect(row('전세금')).toEqual([['5억 5,555만원', false], ['4.2억', true], ['4.8억', false]]);
    expect(row('관리비')).toEqual([['12만원', false], ['8만원', true], ['15만원', false]]);
    expect(row('면적')[2]).toEqual(['41.2㎡ (12평)', true]);
  });

  it('does not rank prices of different trade types', () => {
    renderTable([
      column(1, { tradeType: 'MONTHLY_RENT', deposit: 1000, monthlyRent: 80 }),
      column(2, { tradeType: 'SALE', deposit: 90000 }),
    ]);

    expect(row('보증금 / 전세금 / 매매가').every(([, best]) => !best)).toBe(true);
    expect(row('월세')).toEqual([['80만원', false], ['-', false]]);
  });

  it('shows "-" for a property that failed to load and keeps comparing the rest', () => {
    renderTable([column(1, { area: 20 }), column(2, null), column(3, { area: 30 })]);

    expect(row('면적')).toEqual([['20㎡ (6평)', false], ['-', false], ['30㎡ (9평)', true]]);
    expect(screen.getByText('불러오지 못했어요')).toBeInTheDocument();
  });

  it('builds an option matrix from the union of options', () => {
    renderTable([
      column(1, { options: ['PARKING'] }),
      column(2, { options: ['PARKING', 'ELEVATOR'] }),
    ]);

    expect(row('주차 가능').map(([text]) => text)).toEqual(['✓', '✓']);
    expect(row('엘리베이터').map(([text]) => text)).toEqual(['—', '✓']);
    expect(screen.queryByRole('rowheader', { name: '에어컨' })).not.toBeInTheDocument();
  });
});
