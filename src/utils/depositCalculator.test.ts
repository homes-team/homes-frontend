import { calculateDepositCost, DepositCalcInput, formatCostManwon, parseCalcNumber } from './depositCalculator';

const base: DepositCalcInput = {
  jeonseDeposit: 30000,
  loanRatio: 70,
  loanRate: 4,
  monthlyDeposit: 3000,
  monthlyRent: 90,
  savingsRate: 3,
  years: 2,
};

describe('calculateDepositCost', () => {
  it('adds loan interest and the opportunity cost of own capital for jeonse', () => {
    const { jeonse } = calculateDepositCost(base);

    expect(jeonse.loanAmount).toBe(21000);
    expect(jeonse.ownCapital).toBe(9000);
    expect(jeonse.loanInterest).toBeCloseTo(70, 5); // 21000 * 4% / 12
    expect(jeonse.opportunityCost).toBeCloseTo(22.5, 5); // 9000 * 3% / 12
    expect(jeonse.monthlyTotal).toBeCloseTo(92.5, 5);
  });

  it('adds rent and the opportunity cost of the deposit for monthly rent', () => {
    const { monthly } = calculateDepositCost(base);

    expect(monthly.opportunityCost).toBeCloseTo(7.5, 5); // 3000 * 3% / 12
    expect(monthly.monthlyTotal).toBeCloseTo(97.5, 5);
  });

  it('says jeonse is cheaper when the monthly total is lower, with the gap and term totals', () => {
    const result = calculateDepositCost(base);

    expect(result.cheaper).toBe('JEONSE');
    expect(result.monthlyDifference).toBeCloseTo(5, 5);
    expect(result.totalOverTerm.jeonse).toBeCloseTo(92.5 * 24, 5);
    expect(result.totalOverTerm.monthly).toBeCloseTo(97.5 * 24, 5);
  });

  it('says monthly rent is cheaper when loan interest is high', () => {
    expect(calculateDepositCost({ ...base, loanRate: 6 }).cheaper).toBe('MONTHLY');
  });

  it('calls it even when the difference is under 500 won a month', () => {
    const even = calculateDepositCost({ ...base, monthlyRent: 85.02 });
    expect(even.cheaper).toBe('EQUAL');
  });

  it('works without any loan (all own capital)', () => {
    const { jeonse } = calculateDepositCost({ ...base, loanRatio: 0 });
    expect(jeonse.loanInterest).toBe(0);
    expect(jeonse.monthlyTotal).toBeCloseTo((30000 * 3) / 100 / 12, 5);
  });

  it('computes the implied jeonse-to-monthly conversion rate', () => {
    // (월세 90 * 12) / (전세 30000 - 월세보증금 3000) = 4%
    expect(calculateDepositCost(base).conversionRate).toBeCloseTo(4, 5);
    expect(calculateDepositCost({ ...base, monthlyDeposit: 30000 }).conversionRate).toBeNull();
  });
});

describe('parseCalcNumber', () => {
  it('treats blanks and garbage as the minimum and clamps to the range', () => {
    expect(parseCalcNumber('', 0, 100)).toBe(0);
    expect(parseCalcNumber('abc', 1, 100)).toBe(1);
    expect(parseCalcNumber('150', 0, 100)).toBe(100);
    expect(parseCalcNumber('-5', 0, 100)).toBe(0);
    expect(parseCalcNumber('4.5', 0, 100)).toBe(4.5);
  });
});

describe('formatCostManwon', () => {
  it.each([
    [92.5, '92.5만원'],
    [3, '3만원'],
    [92.54, '92.5만원'],
    [12345, '1억 2,345만원'],
    [20000, '2억'],
    [-4.2, '-4.2만원'],
  ])('formats %f as %s', (value, expected) => {
    expect(formatCostManwon(value)).toBe(expected);
  });
});
