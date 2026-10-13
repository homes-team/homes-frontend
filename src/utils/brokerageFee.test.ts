import {
  BrokerageInput,
  calculateBrokerageFee,
  convertMonthlyTradeAmount,
  DEFAULT_VAT_RATE,
  OTHER_MAX_RATE,
} from './brokerageFee';

const base: BrokerageInput = {
  deal: 'SALE',
  target: 'HOUSE',
  price: 0,
  monthlyRent: 0,
  premium: 0,
  customRate: null,
  vatRate: DEFAULT_VAT_RATE,
};

const calc = (overrides: Partial<BrokerageInput>) => calculateBrokerageFee({ ...base, ...overrides });

describe('주택 매매 요율표', () => {
  it.each([
    // [매매가(만원), 상한요율(%), 중개보수(원)]
    [4000, 0.6, 240_000], // 5천만원 미만 0.6% = 24만원 (한도 25만원 이내)
    [4500, 0.6, 250_000], // 27만원 → 한도 25만원
    [5000, 0.5, 250_000], // 5천만원은 "이상" 구간 0.5%
    [10000, 0.5, 500_000],
    [19000, 0.5, 800_000], // 95만원 → 한도 80만원
    [20000, 0.4, 800_000], // 2억원부터 0.4% (한도 없음)
    [30000, 0.4, 1_200_000],
    [89999, 0.4, 3_599_960],
    [90000, 0.5, 4_500_000], // 9억원부터 0.5%
    [120000, 0.6, 7_200_000],
    [150000, 0.7, 10_500_000],
  ])('매매가 %i만원 → 요율 %f%%, 중개보수 %i원', (price, rate, fee) => {
    const result = calc({ price });
    expect(result.rate).toBe(rate);
    expect(result.fee).toBe(fee);
  });

  it('applies the cap and says so', () => {
    const result = calc({ price: 19000 });
    expect(result.rawFee).toBe(950_000);
    expect(result.fee).toBe(800_000);
    expect(result.limit).toBe(80);
    expect(result.limited).toBe(true);
  });

  it('does not flag a cap when the fee is under it', () => {
    expect(calc({ price: 4000 }).limited).toBe(false);
  });
});

describe('주택 임대차 요율표', () => {
  it.each([
    [3000, 0.5, 150_000], // 5천만원 미만 0.5% (한도 20만원 이내)
    [4900, 0.5, 200_000], // 24.5만원 → 한도 20만원
    [5000, 0.4, 200_000], // 5천~1억 미만 0.4% (한도 30만원)
    [9000, 0.4, 300_000], // 36만원 → 한도 30만원
    [10000, 0.3, 300_000], // 1억~6억 미만 0.3%
    [20000, 0.3, 600_000],
    [60000, 0.4, 2_400_000], // 6억~12억 미만 0.4%
    [120000, 0.5, 6_000_000],
    [150000, 0.6, 9_000_000],
  ])('전세금 %i만원 → 요율 %f%%, 중개보수 %i원', (price, rate, fee) => {
    const result = calc({ deal: 'JEONSE', price });
    expect(result.rate).toBe(rate);
    expect(result.fee).toBe(fee);
  });
});

describe('월세 환산', () => {
  it('uses deposit + rent x 100', () => {
    expect(convertMonthlyTradeAmount(1000, 50)).toBe(6000);
  });

  it('uses deposit + rent x 70 when the full amount is under 50 million won', () => {
    // 500 + 30x100 = 3500 < 5000 → 500 + 30x70 = 2600
    expect(convertMonthlyTradeAmount(500, 30)).toBe(2600);
  });

  it('keeps x100 once the full amount reaches 50 million won', () => {
    expect(convertMonthlyTradeAmount(2000, 30)).toBe(5000);
  });

  it('prices a monthly-rent deal on the converted amount', () => {
    // 환산 6000만원 → 임대차 0.4% = 24만원 (한도 30만원 이내)
    const result = calc({ deal: 'MONTHLY', price: 1000, monthlyRent: 50 });
    expect(result.tradeAmount).toBe(6000);
    expect(result.rate).toBe(0.4);
    expect(result.fee).toBe(240_000);
  });

  it('uses the x70 conversion for small deals', () => {
    // 환산 2600만원 → 0.5% = 13만원
    const result = calc({ deal: 'MONTHLY', price: 500, monthlyRent: 30 });
    expect(result.tradeAmount).toBe(2600);
    expect(result.fee).toBe(130_000);
  });
});

describe('오피스텔 / 분양권 / 그 외', () => {
  it('uses flat rates for officetels (sale 0.5%, lease 0.4%) without a cap', () => {
    expect(calc({ target: 'OFFICETEL', price: 30000 })).toMatchObject({ rate: 0.5, limit: null, fee: 1_500_000 });
    expect(calc({ target: 'OFFICETEL', deal: 'JEONSE', price: 30000 })).toMatchObject({ rate: 0.4, fee: 1_200_000 });
  });

  it('prices a presale right on (paid amount + premium) with the house sale table', () => {
    // (불입 15000 + 프리미엄 5000) = 20000 → 0.4% = 80만원
    const result = calc({ target: 'PRESALE', price: 15000, premium: 5000 });
    expect(result.tradeAmount).toBe(20000);
    expect(result.rate).toBe(0.4);
    expect(result.fee).toBe(800_000);
  });

  it('uses the sale table for a presale right even if a lease deal type is left selected', () => {
    expect(calc({ target: 'PRESALE', deal: 'JEONSE', price: 15000, premium: 5000 }).rate).toBe(0.4);
  });

  it('caps other properties at 0.9% by default', () => {
    const result = calc({ target: 'OTHER', price: 100000 });
    expect(result.rate).toBe(OTHER_MAX_RATE);
    expect(result.fee).toBe(9_000_000);
  });
});

describe('요율 직접 입력과 부가세', () => {
  it('uses the custom rate and ignores the statutory cap', () => {
    // 매매 1억 5천만원, 0.3%로 협의
    const result = calc({ price: 19000, customRate: 0.3 });
    expect(result.customRateUsed).toBe(true);
    expect(result.limit).toBeNull();
    expect(result.limited).toBe(false);
    expect(result.fee).toBe(570_000);
  });

  it('adds VAT on the fee', () => {
    const result = calc({ price: 30000 });
    expect(result.vat).toBe(120_000);
    expect(result.total).toBe(1_320_000);
  });

  it('supports a custom VAT rate, including none for simplified taxpayers', () => {
    expect(calc({ price: 30000, vatRate: 0 }).total).toBe(1_200_000);
    expect(calc({ price: 30000, vatRate: 4 }).vat).toBe(48_000);
  });

  it('is zero for a zero price', () => {
    expect(calc({ price: 0 }).total).toBe(0);
  });
});
