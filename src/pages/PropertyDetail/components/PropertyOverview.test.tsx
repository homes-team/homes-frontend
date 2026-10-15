import { render, screen, within } from '@testing-library/react';
import PropertyOverview from './PropertyOverview';

const base = {
  tradeType: 'JEONSE' as const,
  propertyType: 'APARTMENT' as const,
  area: 33,
  currentFloor: 5,
  totalFloors: 7,
  direction: 'SOUTH' as const,
  maintenanceFee: 12,
  remodelingYear: 2021,
  nearestStation: '상일동역',
  walkingTime: 5,
  desiredBrokerageFee: 0.4,
};

/** 라벨(dt)에 대응하는 값(dd) */
const valueOf = (label: string) => {
  const term = screen.getByText(label, { selector: 'dt' });
  return within(term.parentElement as HTMLElement).getByText((_, el) => el?.tagName === 'DD');
};

describe('PropertyOverview', () => {
  it('lays out the property facts as label/value pairs', () => {
    render(<PropertyOverview property={base} />);

    expect(valueOf('거래 유형')).toHaveTextContent('전세');
    expect(valueOf('매물 종류')).toHaveTextContent('아파트');
    expect(valueOf('전용 면적')).toHaveTextContent('33m²');
    expect(valueOf('층')).toHaveTextContent('5/7층');
    expect(valueOf('관리비')).toHaveTextContent('12만원');
    expect(valueOf('리모델링')).toHaveTextContent('2021년');
    expect(valueOf('가까운 역')).toHaveTextContent('상일동역 도보 5분');
    expect(valueOf('희망 중개수수료율')).toHaveTextContent('0.4%');
  });

  it('shows a dash for facts that were never entered and says so when there is no maintenance fee', () => {
    render(
      <PropertyOverview
        property={{ ...base, maintenanceFee: 0, remodelingYear: null, nearestStation: null, walkingTime: null, desiredBrokerageFee: null }}
      />,
    );

    expect(valueOf('관리비')).toHaveTextContent('없음');
    expect(valueOf('리모델링')).toHaveTextContent('-');
    expect(valueOf('가까운 역')).toHaveTextContent('-');
    expect(valueOf('희망 중개수수료율')).toHaveTextContent('-');
  });

  it('treats an unknown maintenance fee differently from none', () => {
    render(<PropertyOverview property={{ ...base, maintenanceFee: null }} />);

    expect(valueOf('관리비')).toHaveTextContent('-');
  });
});
