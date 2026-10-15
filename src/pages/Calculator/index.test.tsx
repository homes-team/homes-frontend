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

describe('acquisition tax tab', () => {
  const open = (url = '/calculator?tab=acquisition') => renderPage(url);

  it('calculates a 1-house purchase under 600 million won', () => {
    open();

    expect(status()).toContain('5,500,000원');
    expect(dd('취득세 (1%)')).toBe('5,000,000원');
    expect(dd('지방교육세 (0.1%)')).toBe('500,000원');
    expect(dd('농어촌특별세')).toBe('없음 (85㎡ 이하)');
  });

  it('adds the rural special tax above 85 square meters', () => {
    open();
    fireEvent.click(screen.getByLabelText('전용면적 85㎡ 초과예요'));

    expect(dd('농어촌특별세 (0.2%)')).toBe('1,000,000원');
    expect(status()).toContain('6,500,000원');
  });

  it('applies the 8% heavy rate for a second house in an adjusted area and explains why', () => {
    open();
    type('취득가액 (매매가)', '120000');
    fireEvent.click(screen.getByRole('radio', { name: '2주택' }));
    fireEvent.click(screen.getByLabelText('조정대상지역 주택이에요'));

    expect(dd('취득세 (8%)')).toBe('96,000,000원');
    expect(screen.getByText(/조정대상지역 2주택은 8%가 적용돼요/)).toBeInTheDocument();
    expect(status()).toContain('100,800,000원');
  });

  it('offers the temporary two-house exemption only in that situation', () => {
    open();
    expect(screen.queryByLabelText(/일시적 2주택/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: '2주택' }));
    fireEvent.click(screen.getByLabelText('조정대상지역 주택이에요'));
    fireEvent.click(screen.getByLabelText(/일시적 2주택/));

    expect(dd('취득세 (1%)')).toBe('5,000,000원');
  });

  it('applies the first-home reduction and explains when it does not apply', () => {
    open();
    fireEvent.click(screen.getByLabelText(/생애최초 주택 구입/));

    expect(dd('생애최초 감면')).toBe('-2,000,000원');
    expect(status()).toContain('3,500,000원');

    type('취득가액 (매매가)', '130000');
    expect(screen.getByRole('alert')).toHaveTextContent('12억원');
  });

  it('uses 4% for non-house property and hides the house-only options', () => {
    open();
    fireEvent.click(screen.getByRole('radio', { name: /주택 외/ }));
    type('취득가액 (매매가)', '100000');

    expect(dd('취득세 (4%)')).toBe('40,000,000원');
    expect(status()).toContain('46,000,000원');
    expect(screen.queryByRole('radio', { name: '2주택' })).not.toBeInTheDocument();
  });

  it('prefills the price from a listing', () => {
    open('/calculator?tab=acquisition&price=70000');
    expect(screen.getByLabelText('취득가액 (매매가)')).toHaveValue(70000);
    expect(dd('취득세 (1.67%)')).toBe('11,690,000원');
  });
});

describe('loan interest tab', () => {
  const open = () => renderPage('/calculator?tab=loan');

  it('shows the monthly payment for an equal-payment loan', () => {
    open();
    type('대출 금액', '10000');
    type('대출 기간', '1');
    // 1억, 연 4%, 12개월 → 월 8,514,990원
    expect(status()).toContain('8,514,990원');
    expect(dd('총 이자')).toBe('2,179,885원');
  });

  it('shows the first and last payments for equal-principal repayment', () => {
    open();
    type('대출 금액', '12000');
    type('연 이율', '6');
    type('대출 기간', '1');
    fireEvent.click(screen.getByRole('radio', { name: '원금균등' }));

    expect(status()).toContain('10,600,000원 → 10,050,000원');
    expect(dd('총 이자')).toBe('3,900,000원');
  });

  it('shows only interest each month for a bullet loan and hides the grace period', () => {
    open();
    type('대출 금액', '10000');
    type('대출 기간', '1');
    fireEvent.click(screen.getByRole('radio', { name: '만기일시' }));

    expect(status()).toContain('333,333원');
    expect(screen.queryByLabelText('거치 기간')).not.toBeInTheDocument();
  });

  it('lets the user expand the repayment schedule', () => {
    open();
    expect(screen.getByText('상환 스케줄 보기 (360회차)')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(1 + 12);

    fireEvent.click(screen.getByRole('button', { name: '전체 360회차 보기' }));
    expect(screen.getAllByRole('row')).toHaveLength(1 + 360);
  });

  it('adds extra months to the term', () => {
    open();
    type('대출 기간', '1');
    type('추가 개월', '6');
    expect(screen.getByText('총 1년 6개월')).toBeInTheDocument();
    expect(screen.getByText('상환 스케줄 보기 (18회차)')).toBeInTheDocument();
  });
});
