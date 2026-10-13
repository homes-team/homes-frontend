import { calculateRentCompare, RentCompareInput } from './rentCompare';

const side = { returnRate: null, loanRate: null, oneTimeCost: 0, monthlyExtra: 0 };

/** 전세 3억(내 돈 9천 + 대출 2.1억) vs 월세 보증금 3천 / 월세 90 */
const base: RentCompareInput = {
  returnRate: 3,
  loanRate: 4,
  months: 24,
  jeonse: { ...side, ownFunds: 9000, loan: 21000 },
  monthly: { ...side, ownFunds: 3000, loan: 0, rent: 90 },
};

const withJeonse = (patch: Partial<RentCompareInput['jeonse']>): RentCompareInput => ({
  ...base,
  jeonse: { ...base.jeonse, ...patch },
});
const withMonthly = (patch: Partial<RentCompareInput['monthly']>): RentCompareInput => ({
  ...base,
  monthly: { ...base.monthly, ...patch },
});

describe('calculateRentCompare', () => {
  it('adds loan interest and the opportunity cost of own funds for jeonse', () => {
    const { jeonse } = calculateRentCompare(base);

    expect(jeonse.loanInterest).toBeCloseTo(70, 5); // 21000 x 4% / 12
    expect(jeonse.opportunityCost).toBeCloseTo(22.5, 5); // 9000 x 3% / 12
    expect(jeonse.monthlyTotal).toBeCloseTo(92.5, 5);
  });

  it('adds rent and the opportunity cost of the deposit for monthly rent', () => {
    const { monthly } = calculateRentCompare(base);

    expect(monthly.opportunityCost).toBeCloseTo(7.5, 5); // 3000 x 3% / 12
    expect(monthly.rent).toBe(90);
    expect(monthly.monthlyTotal).toBeCloseTo(97.5, 5);
  });

  it('says jeonse is cheaper with the monthly and period gaps', () => {
    const result = calculateRentCompare(base);

    expect(result.cheaper).toBe('JEONSE');
    expect(result.monthlyDifference).toBeCloseTo(5, 5);
    expect(result.jeonse.total).toBeCloseTo(92.5 * 24, 5);
    expect(result.totalDifference).toBeCloseTo(5 * 24, 5);
  });

  it('says monthly rent is cheaper when loan interest is high', () => {
    expect(calculateRentCompare({ ...base, loanRate: 6 }).cheaper).toBe('MONTHLY');
  });

  it('calls it even when the difference is under 500 won a month', () => {
    expect(calculateRentCompare(withMonthly({ rent: 85.02 })).cheaper).toBe('EQUAL');
  });

  it('lets each side override the shared return and loan rates', () => {
    const result = calculateRentCompare(withJeonse({ loanRate: 6, returnRate: 0 }));

    expect(result.jeonse.loanInterest).toBeCloseTo(105, 5); // 21000 x 6% / 12
    expect(result.jeonse.opportunityCost).toBe(0);
    expect(result.monthly.opportunityCost).toBeCloseTo(7.5, 5); // 월세 쪽은 공통 3%
  });

  it('spreads one-time costs over the comparison period and adds monthly extras', () => {
    const result = calculateRentCompare(withJeonse({ oneTimeCost: 240, monthlyExtra: 2 }));

    expect(result.jeonse.oneTimeMonthly).toBeCloseTo(10, 5); // 240 / 24
    expect(result.jeonse.monthlyTotal).toBeCloseTo(92.5 + 10 + 2, 5);
  });

  it('also finances part of a monthly deposit', () => {
    const result = calculateRentCompare(withMonthly({ ownFunds: 1000, loan: 2000 }));

    expect(result.monthlyDeposit).toBe(3000);
    expect(result.monthly.loanInterest).toBeCloseTo(6.6667, 3); // 2000 x 4% / 12
    expect(result.monthly.opportunityCost).toBeCloseTo(2.5, 5); // 1000 x 3% / 12
  });

  it('reports the implied conversion rate', () => {
    expect(calculateRentCompare(base).conversionRate).toBeCloseTo(4, 5); // 90x12 / (30000-3000)
    expect(calculateRentCompare(withMonthly({ ownFunds: 30000 })).conversionRate).toBeNull();
  });

  it('never divides by a zero period', () => {
    const result = calculateRentCompare({ ...withJeonse({ oneTimeCost: 100 }), months: 0 });
    expect(Number.isFinite(result.jeonse.monthlyTotal)).toBe(true);
  });
});
