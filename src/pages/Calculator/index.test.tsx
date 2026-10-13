import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CalculatorPage from './index';

function renderPage(url = '/calculator') {
  render(<MemoryRouter initialEntries={[url]}><CalculatorPage /></MemoryRouter>);
}

const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const status = () => screen.getByRole('status').textContent ?? '';
/** 결과 목록(dl)에서 라벨(dt)에 해당하는 값(dd)을 읽는다. 탭 이름·설명 문구와 글자가 겹쳐도 헷갈리지 않는다 */
const dd = (label: string) => {
  const dl = document.querySelector('dl') as HTMLElement;
  const dt = within(dl).queryByText(label, { selector: 'dt' });
  return dt?.parentElement?.querySelector('dd')?.textContent;
};

describe('CalculatorPage tabs', () => {
  it('opens the brokerage fee tab by default and switches tabs, also with arrow keys', () => {
    renderPage();
    expect(screen.getByRole('tab', { name: '중개보수' })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getByRole('tab', { name: '전월세 전환' }));
    expect(screen.getByRole('tab', { name: '전월세 전환' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('무엇을 계산할까요?')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('tab', { name: '전월세 전환' }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: '전세 vs 월세' })).toHaveAttribute('aria-selected', 'true');
  });

  it('honors the tab in the URL and falls back for unknown values', () => {
    renderPage('/calculator?tab=compare');
    expect(screen.getByRole('tab', { name: '전세 vs 월세' })).toHaveAttribute('aria-selected', 'true');
  });

  it('falls back to the brokerage fee tab for an unknown tab', () => {
    renderPage('/calculator?tab=nope');
    expect(screen.getByRole('tab', { name: '중개보수' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('brokerage fee tab', () => {
  it('shows the statutory cap, fee and VAT for a house sale', () => {
    renderPage();
    type('매매가', '30000');

    // 3억 × 0.4% = 120만원, 부가세 12만원
    expect(dd('상한요율')).toBe('0.4%');
    expect(dd('중개보수')).toBe('1,200,000원');
    expect(dd('부가세 (10%)')).toBe('120,000원');
    expect(dd('합계')).toBe('1,320,000원');
  });

  it('explains when the cap limits the fee', () => {
    renderPage();
    type('매매가', '19000');

    expect(dd('중개보수')).toBe('800,000원');
    expect(screen.getByText(/한도액\(80만원\)을 넘어서 한도액으로 계산했어요/)).toBeInTheDocument();
  });

  it('converts monthly rent and prefills from a listing', () => {
    renderPage('/calculator?tab=commission&trade=monthly&price=1000&rent=50');

    expect(screen.getByLabelText('보증금')).toHaveValue(1000);
    expect(dd('환산 거래금액')).toBe('6,000만원');
    expect(dd('중개보수')).toBe('240,000원');
  });

  it('locks the deal type to sale for a presale right and adds the premium', () => {
    renderPage();
    fireEvent.click(screen.getByRole('radio', { name: '분양권' }));

    expect(screen.getByRole('radio', { name: '전세' })).toBeDisabled();
    type('프리미엄', '5000');
    type('거래 당시까지 불입한 금액 (융자 포함)', '15000');
    expect(dd('거래금액 (불입금 + 프리미엄)')).toBe('2억');
    expect(dd('중개보수')).toBe('800,000원');
  });

  it('uses a custom rate without the cap and a custom VAT rate', () => {
    renderPage();
    type('매매가', '19000');
    fireEvent.click(screen.getByLabelText('요율 직접 입력'));
    type('지정 요율', '0.3');
    fireEvent.click(screen.getByLabelText('부가세율 직접 입력'));
    type('부가세율', '0');

    expect(dd('지정 요율')).toBe('0.3%');
    expect(dd('중개보수')).toBe('570,000원');
    expect(dd('합계')).toBe('570,000원');
    expect(dd('한도액')).toBeUndefined();
  });

  it('lists the Seoul rate table', () => {
    renderPage();
    const details = screen.getByText('서울 기준 중개보수 요율표 보기').closest('details') as HTMLElement;
    expect(within(details).getByText('주택 · 매매 / 교환')).toBeInTheDocument();
    expect(within(details).getAllByText('0.4%').length).toBeGreaterThan(0);
  });
});

describe('rent conversion tab', () => {
  const open = () => { renderPage('/calculator?tab=conversion'); };

  it('converts jeonse to monthly rent', () => {
    open();
    // (30000 - 3000) × 4.5% ÷ 12 = 101.25
    expect(status()).toContain('월세 101.3만원');
  });

  it('converts monthly rent back to jeonse', () => {
    open();
    fireEvent.click(screen.getByRole('radio', { name: '월세 → 전세' }));
    // 3000 + 90 × 12 ÷ 4.5% = 27000
    expect(status()).toContain('전세 보증금 2억 7,000만원');
  });

  it('derives the conversion rate and warns above the legal cap', () => {
    open();
    fireEvent.click(screen.getByRole('radio', { name: '전환율 계산' }));
    type('월세', '150');
    // 150 × 12 ÷ 27000 = 6.67%
    expect(status()).toContain('연 6.67%');
    expect(status()).toContain('주택 상한(4.5%)보다 높아요');
  });

  it('reports when there is nothing to convert', () => {
    open();
    type('월세 보증금', '30000');
    expect(status()).toContain('전세금이 월세 보증금보다 커야');
  });
});

describe('rent vs jeonse tab', () => {
  const open = (url = '/calculator?tab=compare') => renderPage(url);

  it('compares with the default assumptions', () => {
    open();
    expect(status()).toContain('전세(대출)가 월 5만원 더 유리해요');
    expect(status()).toContain('24개월 동안 약 120만원 차이예요');
  });

  it('flips the verdict when the loan rate rises', () => {
    open();
    type('대출 이율 (연)', '6');
    expect(status()).toContain('월세가');
  });

  it('prefills a jeonse listing as 70% loan and 30% own funds', () => {
    open('/calculator?tab=compare&jeonse=40000');
    expect(screen.getByLabelText('대출금')).toHaveValue(28000);
    expect(screen.getByLabelText('내 자금')).toHaveValue(12000);
  });

  it('prefills a monthly-rent listing', () => {
    open('/calculator?tab=compare&deposit=1000&rent=75');
    expect(screen.getByLabelText('보증금 내 자금')).toHaveValue(1000);
    expect(screen.getByLabelText('월세')).toHaveValue(75);
  });

  it('adds one-time costs from the advanced section', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: /고급 계산/ }));
    expect(screen.getAllByLabelText('일회성 비용')).toHaveLength(2);

    fireEvent.change(screen.getAllByLabelText('일회성 비용')[0], { target: { value: '240' } });
    // 전세 월비용 92.5 + 240/24 = 102.5 → 월세(97.5)가 5만원 유리
    expect(status()).toContain('월세가 월 5만원 더 유리해요');
  });
});
