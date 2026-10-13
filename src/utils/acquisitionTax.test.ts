import {
  AcquisitionTaxInput,
  calculateAcquisitionTax,
  FIRST_HOME_REDUCTION_CAP,
  generalHouseRate,
  houseCategory,
} from './acquisitionTax';

const base: AcquisitionTaxInput = {
  kind: 'HOUSE',
  price: 50000,
  houseCountAfter: 1,
  adjustedArea: false,
  corporation: false,
  temporaryTwoHouses: false,
  over85: false,
  firstTimeBuyer: false,
  depopulationArea: false,
};
const calc = (overrides: Partial<AcquisitionTaxInput>) => calculateAcquisitionTax({ ...base, ...overrides });

describe('generalHouseRate (1주택 일반 세율)', () => {
  it.each([
    [30000, 1],
    [60000, 1], // 6억 이하
    [60001, 1], // 6억 초과 직후는 1%에 가까움
    [70000, 1.67], // (7 × 2/3 − 3) = 1.6667 → 1.67
    [75000, 2],
    [80000, 2.33],
    [90000, 3], // 9억 이하의 끝
    [100000, 3], // 9억 초과
  ])('취득가액 %i만원 → %f%%', (price, rate) => {
    expect(generalHouseRate(price)).toBe(rate);
  });
});

describe('1주택 일반 세율의 세금 (전용 85㎡ 이하)', () => {
  it('5억원: 취득세 1% + 지방교육세 0.1%, 농어촌특별세 없음', () => {
    const result = calc({ price: 50000 });

    expect(result.category).toBe('GENERAL');
    expect(result.acquisitionTax).toBe(5_000_000);
    expect(result.localEducationTax).toBe(500_000);
    expect(result.ruralSpecialTax).toBe(0);
    expect(result.total).toBe(5_500_000);
  });

  it('7억원: 비례 세율 1.67%, 지방교육세 0.167%', () => {
    const result = calc({ price: 70000 });

    expect(result.acquisitionRate).toBe(1.67);
    expect(result.localEducationRate).toBe(0.167);
    expect(result.acquisitionTax).toBe(11_690_000);
    expect(result.localEducationTax).toBe(1_169_000);
    expect(result.total).toBe(12_859_000);
  });

  it('9억원 초과: 3%, 지방교육세 0.3%', () => {
    const result = calc({ price: 100000 });

    expect(result.acquisitionTax).toBe(30_000_000);
    expect(result.localEducationTax).toBe(3_000_000);
    expect(result.total).toBe(33_000_000);
  });
});

describe('농어촌특별세 (전용 85㎡ 초과)', () => {
  it('일반 세율에는 0.2%를 더한다', () => {
    const result = calc({ price: 50000, over85: true });
    expect(result.ruralSpecialRate).toBe(0.2);
    expect(result.ruralSpecialTax).toBe(1_000_000);
    expect(result.total).toBe(6_500_000);
  });

  it('중과 8%는 0.6%, 12%는 1.0%', () => {
    expect(calc({ houseCountAfter: 2, adjustedArea: true, over85: true }).ruralSpecialRate).toBe(0.6);
    expect(calc({ houseCountAfter: 3, adjustedArea: true, over85: true }).ruralSpecialRate).toBe(1);
  });
});

describe('다주택·법인 중과', () => {
  it('조정대상지역 2주택은 8%: 12억원이면 취득세 9,600만원 + 지방교육세 480만원', () => {
    const result = calc({ price: 120000, houseCountAfter: 2, adjustedArea: true });

    expect(result.category).toBe('HEAVY_8');
    expect(result.acquisitionTax).toBe(96_000_000);
    expect(result.localEducationRate).toBe(0.4);
    expect(result.localEducationTax).toBe(4_800_000);
    expect(result.total).toBe(100_800_000);
  });

  it('85㎡를 넘으면 농어촌특별세 0.6%가 더 붙는다', () => {
    const result = calc({ price: 120000, houseCountAfter: 2, adjustedArea: true, over85: true });
    expect(result.ruralSpecialTax).toBe(7_200_000);
    expect(result.total).toBe(108_000_000);
  });

  it.each([
    // [취득 후 주택 수, 조정지역, 기대 구분]
    [2, false, 'GENERAL'], // 비조정 2주택은 중과 없음
    [2, true, 'HEAVY_8'],
    [3, false, 'HEAVY_8'],
    [3, true, 'HEAVY_12'],
    [4, false, 'HEAVY_12'], // 4주택 이상은 지역 무관
    [4, true, 'HEAVY_12'],
  ] as const)('취득 후 %i주택, 조정지역=%s → %s', (houseCountAfter, adjustedArea, category) => {
    expect(houseCategory({ ...base, houseCountAfter, adjustedArea }).category).toBe(category);
  });

  it('일시적 2주택은 조정대상지역이어도 일반 세율', () => {
    const result = calc({ price: 50000, houseCountAfter: 2, adjustedArea: true, temporaryTwoHouses: true });
    expect(result.category).toBe('GENERAL');
    expect(result.acquisitionRate).toBe(1);
  });

  it('일시적 2주택 표시는 3주택 이상에는 효력이 없다', () => {
    expect(calc({ houseCountAfter: 3, adjustedArea: true, temporaryTwoHouses: true }).category).toBe('HEAVY_12');
  });

  it('법인은 주택 수와 관계없이 12%', () => {
    const result = calc({ corporation: true, houseCountAfter: 1, price: 30000 });
    expect(result.category).toBe('HEAVY_12');
    expect(result.acquisitionTax).toBe(36_000_000);
  });
});

describe('주택 외 부동산', () => {
  it('10억원: 취득세 4% + 지방교육세 0.4% + 농어촌특별세 0.2%', () => {
    const result = calc({ kind: 'NON_HOUSE', price: 100000, houseCountAfter: 3, adjustedArea: true });

    expect(result.category).toBe('NON_HOUSE');
    expect(result.acquisitionTax).toBe(40_000_000);
    expect(result.localEducationTax).toBe(4_000_000);
    expect(result.ruralSpecialTax).toBe(2_000_000);
    expect(result.total).toBe(46_000_000);
  });
});

describe('생애최초 주택 구입 감면', () => {
  it('취득세에서 최대 200만원을 감면한다 (5억원: 500만원 → 300만원)', () => {
    const result = calc({ price: 50000, firstTimeBuyer: true });

    expect(result.reduction).toBe(FIRST_HOME_REDUCTION_CAP);
    expect(result.reductionBlockedReason).toBeNull();
    expect(result.total).toBe(5_000_000 - 2_000_000 + 500_000);
  });

  it('인구감소지역은 300만원까지', () => {
    const result = calc({ price: 60000, firstTimeBuyer: true, depopulationArea: true });
    expect(result.reduction).toBe(3_000_000);
  });

  it('취득세가 한도보다 작으면 취득세만큼만 감면한다', () => {
    const result = calc({ price: 10000, firstTimeBuyer: true });
    expect(result.reduction).toBe(1_000_000);
    expect(result.total).toBe(100_000); // 지방교육세만 남는다
  });

  it.each([
    [{ price: 130000 }, /12억원/],
    [{ houseCountAfter: 2 as const }, /1주택/],
    [{ houseCountAfter: 3 as const, adjustedArea: true }, /1주택/],
    [{ corporation: true }, /법인/],
    [{ kind: 'NON_HOUSE' as const }, /주택에만/],
  ])('조건을 못 채우면 감면하지 않고 이유를 알려준다 (%j)', (overrides, message) => {
    const result = calc({ firstTimeBuyer: true, ...overrides });
    expect(result.reduction).toBe(0);
    expect(result.reductionBlockedReason).toMatch(message);
  });

  it('신청하지 않으면 안내도 없다', () => {
    expect(calc({ price: 130000 }).reductionBlockedReason).toBeNull();
  });
});

describe('경계값', () => {
  it('취득가액 0원이면 세금도 0원', () => {
    const result = calc({ price: 0 });
    expect(result.total).toBe(0);
    expect(result.effectiveRate).toBe(0);
  });

  it('실제 부담률을 계산한다', () => {
    expect(calc({ price: 50000 }).effectiveRate).toBeCloseTo(1.1, 5);
  });
});
