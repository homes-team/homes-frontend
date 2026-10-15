/**
 * 중개보수(중개수수료) 법정 상한 계산 — 서울특별시 기준.
 *
 * 근거: 공인중개사법 시행규칙 제20조 [별표 1]과 서울특별시 조례의 주택 중개보수 요율표.
 * 지역마다 조례가 달라 서울 외 지역은 요율이 다를 수 있다(요율 직접 입력으로 계산).
 * 요율표는 "상한"이다. 실제 중개보수는 상한 범위 안에서 중개사와 협의해 정한다.
 *
 * 금액 단위: 입력과 한도액은 만원, 결과 수수료는 원.
 */
import { floorWon } from './calcFormat';

export type BrokerageDealType = 'SALE' | 'JEONSE' | 'MONTHLY';
export type BrokerageTarget = 'HOUSE' | 'OFFICETEL' | 'PRESALE' | 'OTHER';

export interface RateTier {
  /** 거래금액 이상 (만원) */
  from: number;
  /** 상한요율 (%) */
  rate: number;
  /** 한도액 (만원). 없으면 null */
  limit: number | null;
}

/** 주택 매매·교환 (분양권도 이 표를 쓴다) */
export const HOUSE_SALE_TIERS: RateTier[] = [
  { from: 0, rate: 0.6, limit: 25 },
  { from: 5000, rate: 0.5, limit: 80 },
  { from: 20000, rate: 0.4, limit: null },
  { from: 90000, rate: 0.5, limit: null },
  { from: 120000, rate: 0.6, limit: null },
  { from: 150000, rate: 0.7, limit: null },
];

/** 주택 임대차 등 (매매·교환 이외의 거래) */
export const HOUSE_LEASE_TIERS: RateTier[] = [
  { from: 0, rate: 0.5, limit: 20 },
  { from: 5000, rate: 0.4, limit: 30 },
  { from: 10000, rate: 0.3, limit: null },
  { from: 60000, rate: 0.4, limit: null },
  { from: 120000, rate: 0.5, limit: null },
  { from: 150000, rate: 0.6, limit: null },
];

/** 오피스텔(전용 85㎡ 이하, 부엌·화장실 갖춤) */
export const OFFICETEL_SALE_RATE = 0.5;
export const OFFICETEL_LEASE_RATE = 0.4;

/** 주택 외(토지·상가 등)는 0.9% 이내에서 중개사와 협의 */
export const OTHER_MAX_RATE = 0.9;

export const DEFAULT_VAT_RATE = 10;

/** 월세를 환산할 때 월차임에 곱하는 수: 보증금 + 월세×100, 합계가 5천만원 미만이면 보증금 + 월세×70 */
const RENT_MULTIPLIER = 100;
const SMALL_RENT_MULTIPLIER = 70;
const SMALL_RENT_THRESHOLD = 5000;

export interface BrokerageInput {
  deal: BrokerageDealType;
  target: BrokerageTarget;
  /** 매매가 / 전세금 / 월세 보증금 / 분양권은 거래 당시까지 불입한 금액(융자 포함). 만원 */
  price: number;
  /** 월세 (만원). 월세 거래일 때만 쓴다 */
  monthlyRent: number;
  /** 분양권 프리미엄 (만원). 분양권일 때만 쓴다 */
  premium: number;
  /** 요율을 직접 정하는 경우 (%) */
  customRate: number | null;
  /** 부가세율 (%) */
  vatRate: number;
}

export interface BrokerageResult {
  /** 요율 적용 기준이 되는 거래금액 (만원). 월세는 환산, 분양권은 불입금액+프리미엄 */
  tradeAmount: number;
  /** 적용한 요율 (%) */
  rate: number;
  /** 요율 구간의 한도액 (만원). 없으면 null */
  limit: number | null;
  /** 한도액 때문에 수수료가 줄었는지 */
  limited: boolean;
  /** 직접 입력한 요율을 썼는지 */
  customRateUsed: boolean;
  /** 요율×거래금액 (원) — 한도 적용 전 */
  rawFee: number;
  /** 중개보수 (원) — 한도 적용 후 */
  fee: number;
  vat: number;
  /** 중개보수 + 부가세 (원) */
  total: number;
}

/** 월세 거래의 환산 거래금액 (만원) */
export function convertMonthlyTradeAmount(deposit: number, monthlyRent: number): number {
  const full = deposit + monthlyRent * RENT_MULTIPLIER;
  return full < SMALL_RENT_THRESHOLD ? deposit + monthlyRent * SMALL_RENT_MULTIPLIER : full;
}

/** 요율표에서 거래금액에 맞는 구간을 찾는다 */
function findTier(tiers: RateTier[], tradeAmount: number): RateTier {
  let found = tiers[0];
  for (const tier of tiers) {
    if (tradeAmount >= tier.from) found = tier;
  }
  return found;
}

function statutoryTier(input: BrokerageInput, tradeAmount: number): { rate: number; limit: number | null } {
  const sale = input.deal === 'SALE' || input.target === 'PRESALE';

  switch (input.target) {
    case 'OFFICETEL':
      return { rate: sale ? OFFICETEL_SALE_RATE : OFFICETEL_LEASE_RATE, limit: null };
    case 'OTHER':
      return { rate: OTHER_MAX_RATE, limit: null };
    default: {
      const { rate, limit } = findTier(sale ? HOUSE_SALE_TIERS : HOUSE_LEASE_TIERS, tradeAmount);
      return { rate, limit };
    }
  }
}

export function calculateBrokerageFee(input: BrokerageInput): BrokerageResult {
  const tradeAmount =
    input.target === 'PRESALE'
      ? input.price + input.premium
      : input.deal === 'MONTHLY'
        ? convertMonthlyTradeAmount(input.price, input.monthlyRent)
        : input.price;

  const statutory = statutoryTier(input, tradeAmount);
  const customRateUsed = input.customRate !== null;
  const rate = customRateUsed ? (input.customRate as number) : statutory.rate;
  // 직접 입력한 요율에는 법정 한도액을 적용하지 않는다 (사용자가 협의한 값 그대로 계산)
  const limit = customRateUsed ? null : statutory.limit;

  const rawFee = floorWon((tradeAmount * 10000 * rate) / 100);
  const fee = limit !== null ? Math.min(rawFee, limit * 10000) : rawFee;
  const vat = floorWon((fee * input.vatRate) / 100);

  return {
    tradeAmount,
    rate,
    limit,
    limited: limit !== null && rawFee > limit * 10000,
    customRateUsed,
    rawFee,
    fee,
    vat,
    total: fee + vat,
  };
}
