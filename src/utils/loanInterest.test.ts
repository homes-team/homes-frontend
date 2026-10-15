import { calculateLoan, LoanInput, MAX_LOAN_MONTHS } from './loanInterest';

const base: LoanInput = { principal: 100_000_000, annualRate: 4, months: 12, graceMonths: 0, method: 'ANNUITY' };
const calc = (overrides: Partial<LoanInput>) => calculateLoan({ ...base, ...overrides });

describe('원리금균등상환', () => {
  it('pays the same amount every month (1억, 연 4%, 12개월)', () => {
    const { rows, firstPayment, lastPayment } = calc({});

    // P·r / (1 − (1+r)^−n) = 8,514,990.4…
    expect(firstPayment).toBeCloseTo(8_514_990.42, 1);
    expect(lastPayment).toBeCloseTo(8_514_990.42, 1);
    expect(new Set(rows.map((row) => Math.round(row.payment))).size).toBe(1);
  });

  it('has interest on the full balance in month 1 and shrinking interest afterwards', () => {
    const { rows } = calc({});

    expect(rows[0].interest).toBeCloseTo(333_333.33, 1); // 1억 × 4% ÷ 12
    expect(rows[1].interest).toBeLessThan(rows[0].interest);
    expect(rows[1].principalPaid).toBeGreaterThan(rows[0].principalPaid);
  });

  it('matches a long loan (1억, 연 5%, 30년)', () => {
    const { firstPayment, totalInterest } = calc({ annualRate: 5, months: 360 });

    expect(firstPayment).toBeCloseTo(536_821.62, 1);
    // 총이자 = 월 상환액 × 360 − 원금 (월 상환액을 반올림하지 않은 값으로 계산)
    const exact = (100_000_000 * (0.05 / 12)) / (1 - Math.pow(1 + 0.05 / 12, -360));
    expect(totalInterest).toBeCloseTo(exact * 360 - 100_000_000, 0);
  });
});

describe('원금균등상환', () => {
  const result = calc({ principal: 120_000_000, annualRate: 6, method: 'EQUAL_PRINCIPAL' });

  it('pays the same principal and a shrinking payment', () => {
    expect(result.rows[0].principalPaid).toBeCloseTo(10_000_000, 3);
    expect(result.firstPayment).toBeCloseTo(10_600_000, 1); // 원금 1천만 + 이자 120,000,000 × 0.5%
    expect(result.lastPayment).toBeCloseTo(10_050_000, 1); // 남은 원금 1천만 × 0.5% = 5만
  });

  it('has total interest = P × r × (n + 1) ÷ 2', () => {
    expect(result.totalInterest).toBeCloseTo(120_000_000 * 0.005 * 6.5, 1);
  });
});

describe('만기일시상환', () => {
  it('pays interest only, then the principal in the last month', () => {
    const { rows, totalInterest, lastPayment } = calc({ method: 'BULLET' });

    expect(rows[0].payment).toBeCloseTo(333_333.33, 1);
    expect(rows[10].balance).toBe(100_000_000);
    expect(lastPayment).toBeCloseTo(100_333_333.33, 1);
    expect(totalInterest).toBeCloseTo(100_000_000 * (0.04 / 12) * 12, 1);
  });

  it('ignores the grace period', () => {
    expect(calc({ method: 'BULLET', graceMonths: 6 }).totalInterest).toBeCloseTo(calc({ method: 'BULLET' }).totalInterest, 5);
  });
});

describe('거치기간', () => {
  it('pays interest only during the grace period and amortizes the rest', () => {
    const { rows } = calc({ graceMonths: 6 });

    expect(rows.slice(0, 6).every((row) => row.principalPaid === 0 && row.balance === 100_000_000)).toBe(true);
    // 남은 6개월 원리금균등 월 상환액 = P·r / (1 − (1+r)^−6)
    expect(rows[6].payment).toBeCloseTo(16_861_650.33, 1);
  });

  it('always pays off the whole principal', () => {
    for (const method of ['ANNUITY', 'EQUAL_PRINCIPAL', 'BULLET'] as const) {
      const { rows } = calc({ method, graceMonths: 3, months: 24 });
      expect(rows[rows.length - 1].balance).toBe(0);
      expect(rows.reduce((sum, row) => sum + row.principalPaid, 0)).toBeCloseTo(100_000_000, 3);
    }
  });

  it('keeps at least one repayment month', () => {
    const { rows } = calc({ graceMonths: 99, months: 12 });
    expect(rows[11].principalPaid).toBeGreaterThan(0);
  });
});

describe('경계값', () => {
  it('handles a 0% rate as an even split with no interest', () => {
    const result = calc({ annualRate: 0 });
    expect(result.totalInterest).toBe(0);
    expect(result.firstPayment).toBeCloseTo(100_000_000 / 12, 3);
  });

  it('clamps the term to a sensible range', () => {
    expect(calc({ months: 0 }).rows).toHaveLength(1);
    expect(calc({ months: 99999 }).rows).toHaveLength(MAX_LOAN_MONTHS);
  });

  it('is zero for a zero principal', () => {
    const result = calc({ principal: 0 });
    expect(result.totalInterest).toBe(0);
    expect(result.totalPayment).toBe(0);
  });
});
