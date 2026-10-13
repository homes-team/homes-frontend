/**
 * 전세 vs 월세 월 비용 비교. 금액은 만원, 금리는 연 %.
 *
 * 월 비용 = 대출 이자 + 내 자금의 기회비용 + (월세) + 월 추가비용 + 일회성 비용 ÷ 비교기간
 *
 * - 기회비용: 보증금에 묶인 내 자금을 예금 등으로 굴렸다면 벌었을 이자
 * - 대출은 원금 상환 없이 월 이자만 계산한다 (원금 상환·중도상환수수료·세금은 제외)
 */
export interface RentSideInput {
  /** 보증금 중 내 돈 */
  ownFunds: number;
  /** 보증금 중 대출 */
  loan: number;
  /** 내 자금 기대수익률 (연 %). null이면 공통 값 */
  returnRate: number | null;
  /** 대출 이율 (연 %). null이면 공통 값 */
  loanRate: number | null;
  /** 계약 시 한 번 드는 돈(중개보수·이사비 등). 비교기간으로 나눠 월 비용에 넣는다 */
  oneTimeCost: number;
  /** 매달 드는 추가 비용(관리비 차이 등) */
  monthlyExtra: number;
}

export interface RentCompareInput {
  /** 공통 내 자금 기대수익률 (연 %) */
  returnRate: number;
  /** 공통 대출 이율 (연 %) */
  loanRate: number;
  /** 비교 기간 (개월) */
  months: number;
  jeonse: RentSideInput;
  monthly: RentSideInput & { rent: number };
}

export interface SideCost {
  loanInterest: number;
  opportunityCost: number;
  rent: number;
  monthlyExtra: number;
  /** 일회성 비용을 비교기간으로 나눈 월 환산액 */
  oneTimeMonthly: number;
  monthlyTotal: number;
  /** 비교 기간 동안 나가는 총비용 */
  total: number;
}

export interface RentCompareResult {
  jeonse: SideCost;
  monthly: SideCost;
  jeonseDeposit: number;
  monthlyDeposit: number;
  /** 월세 월 비용 - 전세 월 비용. 양수면 전세가 유리 */
  monthlyDifference: number;
  /** 비교 기간 총비용 차이 (월세 - 전세) */
  totalDifference: number;
  cheaper: 'JEONSE' | 'MONTHLY' | 'EQUAL';
  /** 월세를 전세금으로 환산했을 때의 전월세 전환율 (연 %). 전세금이 월세 보증금 이하면 null */
  conversionRate: number | null;
}

/** 1만원 미만의 5% 오차는 "같다"고 본다 */
const EQUAL_THRESHOLD = 0.05;

const monthlyInterest = (principal: number, annualRate: number) => (principal * annualRate) / 100 / 12;

function sideCost(side: RentSideInput, rent: number, common: RentCompareInput): SideCost {
  const months = Math.max(1, common.months);
  const loanInterest = monthlyInterest(side.loan, side.loanRate ?? common.loanRate);
  const opportunityCost = monthlyInterest(side.ownFunds, side.returnRate ?? common.returnRate);
  const oneTimeMonthly = side.oneTimeCost / months;
  const monthlyTotal = loanInterest + opportunityCost + rent + side.monthlyExtra + oneTimeMonthly;

  return {
    loanInterest,
    opportunityCost,
    rent,
    monthlyExtra: side.monthlyExtra,
    oneTimeMonthly,
    monthlyTotal,
    total: monthlyTotal * months,
  };
}

export function calculateRentCompare(input: RentCompareInput): RentCompareResult {
  const jeonse = sideCost(input.jeonse, 0, input);
  const monthly = sideCost(input.monthly, input.monthly.rent, input);

  const jeonseDeposit = input.jeonse.ownFunds + input.jeonse.loan;
  const monthlyDeposit = input.monthly.ownFunds + input.monthly.loan;
  const monthlyDifference = monthly.monthlyTotal - jeonse.monthlyTotal;
  const gap = jeonseDeposit - monthlyDeposit;

  return {
    jeonse,
    monthly,
    jeonseDeposit,
    monthlyDeposit,
    monthlyDifference,
    totalDifference: monthly.total - jeonse.total,
    cheaper: Math.abs(monthlyDifference) < EQUAL_THRESHOLD ? 'EQUAL' : monthlyDifference > 0 ? 'JEONSE' : 'MONTHLY',
    conversionRate: gap > 0 ? ((input.monthly.rent * 12) / gap) * 100 : null,
  };
}
