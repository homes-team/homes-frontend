import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DepositCalculatorPage from './index';

function renderPage(url = '/calculator') {
  render(<MemoryRouter initialEntries={[url]}><DepositCalculatorPage /></MemoryRouter>);
}

const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const verdict = () => screen.getByRole('status').textContent;

describe('DepositCalculatorPage', () => {
  it('compares jeonse loan interest with monthly rent using the default assumptions', () => {
    renderPage();

    // 전세 92.5만원 vs 월세 97.5만원 → 전세가 월 5만원 유리
    expect(verdict()).toContain('전세(대출)가 월 5만원 더 유리해요');
    expect(verdict()).toContain('2년 거주하면 약 120만원 차이예요');
    expect(screen.getAllByText('92.5만원').length).toBeGreaterThan(0);
    expect(screen.getAllByText('97.5만원').length).toBeGreaterThan(0);
  });

  it('flips the verdict when the loan rate rises', () => {
    renderPage();
    type('대출 금리 (연)', '6');

    expect(verdict()).toContain('월세가');
    expect(verdict()).toContain('더 유리해요');
  });

  it('recalculates live as the rent changes', () => {
    renderPage();
    type('월세', '60');

    // 월세 합계 7.5 + 60 = 67.5, 전세 92.5 → 25만원 차이, 2년이면 600만원
    expect(verdict()).toContain('월세가 월 25만원 더 유리해요');
    expect(verdict()).toContain('약 600만원 차이');
  });

  it('prefills the jeonse side from a jeonse listing', () => {
    renderPage('/calculator?jeonse=45000');
    expect(screen.getByLabelText('전세 보증금')).toHaveValue(45000);
  });

  it('prefills the monthly side from a monthly-rent listing', () => {
    renderPage('/calculator?deposit=1000&rent=75');
    expect(screen.getByLabelText('월세 보증금')).toHaveValue(1000);
    expect(screen.getByLabelText('월세')).toHaveValue(75);
  });

  it('keeps working with blank or out-of-range inputs', () => {
    renderPage();
    type('대출 비율', '');
    type('거주 기간', '0');

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('1년 비용 합계')).toBeInTheDocument();
  });
});
