import { checkProposedRate, commissionCalculatorPath, legalFeeCap } from './legalFeeCap';

describe('legalFeeCap', () => {
  it('applies the lease table to a jeonse', () => {
    const cap = legalFeeCap({ tradeType: 'JEONSE', propertyType: 'APARTMENT', deposit: 10000, monthlyRent: 0 });

    expect(cap).toMatchObject({ tradeAmount: 10000, rate: 0.3, limit: null, limited: false, maxFee: 300000, effectiveRate: 0.3 });
  });

  it('converts a monthly rent into a trade amount before looking up the rate', () => {
    // 보증금 1,000 + 월세 50 × 100 = 6,000만원 → 임대차 5천만~1억 구간 0.4%, 한도 30만원
    const cap = legalFeeCap({ tradeType: 'MONTHLY_RENT', propertyType: 'VILLA', deposit: 1000, monthlyRent: 50 });

    expect(cap).toMatchObject({ tradeAmount: 6000, rate: 0.4, limit: 30, maxFee: 240000 });
  });

  it('uses the lower effective rate when the cap amount limits the fee', () => {
    // 매매 1억 9천만원: 0.5% = 95만원이지만 한도 80만원 → 실질 약 0.42%
    const cap = legalFeeCap({ tradeType: 'SALE', propertyType: 'HOUSE', deposit: 19000, monthlyRent: 0 });

    expect(cap).toMatchObject({ rate: 0.5, limit: 80, limited: true, maxFee: 800000, effectiveRate: 0.42 });
  });

  it('uses the officetel rate instead of the house table', () => {
    const cap = legalFeeCap({ tradeType: 'JEONSE', propertyType: 'OFFICETEL', deposit: 10000, monthlyRent: 0 });

    expect(cap).toMatchObject({ rate: 0.4, maxFee: 400000 });
  });

  it('flags presale because the premium is unknown', () => {
    const cap = legalFeeCap({ tradeType: 'SALE', propertyType: 'PRESALE', deposit: 30000, monthlyRent: 0 });

    expect(cap?.presale).toBe(true);
    expect(cap?.tradeAmount).toBe(30000);
  });

  it('returns null when there is no trade amount to apply a rate to', () => {
    expect(legalFeeCap({ tradeType: 'JEONSE', propertyType: 'APARTMENT', deposit: 0, monthlyRent: 0 })).toBeNull();
  });
});

describe('checkProposedRate', () => {
  const cap = legalFeeCap({ tradeType: 'SALE', propertyType: 'HOUSE', deposit: 19000, monthlyRent: 0 })!;

  it('accepts a rate that stays within the cap amount', () => {
    expect(checkProposedRate(cap, 0.42)).toEqual({ amount: 798000, exceeds: false });
  });

  it('accepts exactly the cap amount', () => {
    expect(checkProposedRate(legalFeeCap({ tradeType: 'JEONSE', propertyType: 'APARTMENT', deposit: 10000, monthlyRent: 0 })!, 0.3))
      .toEqual({ amount: 300000, exceeds: false });
  });

  it('rejects a rate above the 한도액 even when it is below the table rate', () => {
    // 0.5%는 요율표 상한이지만 이 매물은 한도액 때문에 80만원까지만 가능
    expect(checkProposedRate(cap, 0.5)).toEqual({ amount: 950000, exceeds: true });
  });
});

describe('commissionCalculatorPath', () => {
  it('prefills trade, price and rent for a monthly rent', () => {
    expect(commissionCalculatorPath({ tradeType: 'MONTHLY_RENT', propertyType: 'VILLA', deposit: 1000, monthlyRent: 50 }))
      .toBe('/calculator?tab=commission&trade=monthly&price=1000&rent=50');
  });

  it('omits rent for sale and jeonse', () => {
    expect(commissionCalculatorPath({ tradeType: 'SALE', propertyType: 'HOUSE', deposit: 30000, monthlyRent: 0 }))
      .toBe('/calculator?tab=commission&trade=sale&price=30000');
  });
});
