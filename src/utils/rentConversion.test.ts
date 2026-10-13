import { conversionRate, HOUSING_CONVERSION_RATE_CAP, jeonseToMonthlyRent, monthlyRentToJeonse } from './rentConversion';

describe('jeonseToMonthlyRent', () => {
  it('converts the deposit above the monthly deposit into rent', () => {
    // (30000 - 3000) x 4.5% / 12 = 101.25
    expect(jeonseToMonthlyRent(30000, 3000, 4.5)).toBeCloseTo(101.25, 5);
  });

  it('has nothing to convert when the jeonse is not above the monthly deposit', () => {
    expect(jeonseToMonthlyRent(3000, 3000, 4.5)).toBeNull();
    expect(jeonseToMonthlyRent(1000, 3000, 4.5)).toBeNull();
  });
});

describe('monthlyRentToJeonse', () => {
  it('adds rent x 12 / rate to the monthly deposit', () => {
    // 3000 + 90 x 12 / 0.045 = 27000
    expect(monthlyRentToJeonse(3000, 90, 4.5)).toBeCloseTo(27000, 5);
  });

  it('cannot divide by a zero rate', () => {
    expect(monthlyRentToJeonse(3000, 90, 0)).toBeNull();
  });
});

describe('conversionRate', () => {
  it('reverses the conversion', () => {
    expect(conversionRate(30000, 3000, 90)).toBeCloseTo(4, 5);
    expect(conversionRate(30000, 3000, 101.25)).toBeCloseTo(4.5, 5);
  });

  it('round-trips with the other two conversions', () => {
    const rent = jeonseToMonthlyRent(50000, 5000, 5) as number;
    expect(conversionRate(50000, 5000, rent)).toBeCloseTo(5, 5);
    expect(monthlyRentToJeonse(5000, rent, 5)).toBeCloseTo(50000, 5);
  });

  it('is undefined without a deposit gap', () => {
    expect(conversionRate(3000, 3000, 90)).toBeNull();
  });
});

describe('HOUSING_CONVERSION_RATE_CAP', () => {
  it('is a plausible percentage', () => {
    expect(HOUSING_CONVERSION_RATE_CAP).toBeGreaterThan(0);
    expect(HOUSING_CONVERSION_RATE_CAP).toBeLessThanOrEqual(10);
  });
});
