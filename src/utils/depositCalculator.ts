/**
 * 전세(대출 이용) vs 월세 월 비용 비교. 금액은 모두 만원, 금리는 연 %.
 *
 * 월 비용 = 실제로 나가는 돈(대출 이자, 월세) + 보증금 기회비용
 * 기회비용 = 목돈이 보증금으로 묶여 있지 않았다면 예금 등으로 벌었을 이자.
 * 대출 원금 상환, 중도상환수수료, 관리비, 세금은 포함하지 않는 단순 비교다.
 */
export interface DepositCalcInput {
  /** 전세 보증금 */
  jeonseDeposit: number;
  /** 전세금 중 대출로 마련하는 비율 (0~100) */
  loanRatio: number;
  /** 전세대출 금리 (연 %) */
  loanRate: number;
  /** 월세 보증금 */
  monthlyDeposit: number;
  /** 월세 */
  monthlyRent: number;
  /** 보증금을 예금했다면 받았을 금리 (연 %) */
  savingsRate: number;
  /** 거주 기간 (년) */
  years: number;
}

export interface JeonseCost {
  loanAmount: number;
  ownCapital: number;
  /** 월 대출 이자 */
  loanInterest: number;
  /** 자기 자본(전세금 - 대출)의 월 기회비용 */
  opportunityCost: number;
  monthlyTotal: number;
}

export interface MonthlyCost {
  /** 월세 보증금의 월 기회비용 */
  opportunityCost: number;
  rent: number;
  monthlyTotal: number;
}

export interface DepositCalcResult {
  jeonse: JeonseCost;
  monthly: MonthlyCost;
  /** 월세 월 비용 - 전세 월 비용. 양수면 전세가 유리 */
  monthlyDifference: number;
  cheaper: 'JEONSE' | 'MONTHLY' | 'EQUAL';
  /** 거주 기간 동안 나가는 총비용 */
  totalOverTerm: { jeonse: number; monthly: number };
  /** 월세를 전세금으로 환산했을 때의 전월세 전환율 (연 %). 전세금이 월세 보증금 이하면 null */
  conversionRate: number | null;
}

/** 1만원 미만 오차는 "같다"고 본다 */
const EQUAL_THRESHOLD = 0.05;

const monthlyInterest = (principal: number, annualRate: number) => (principal * annualRate) / 100 / 12;

export function calculateDepositCost(input: DepositCalcInput): DepositCalcResult {
  const loanAmount = (input.jeonseDeposit * input.loanRatio) / 100;
  const ownCapital = input.jeonseDeposit - loanAmount;

  const loanInterest = monthlyInterest(loanAmount, input.loanRate);
  const jeonseOpportunity = monthlyInterest(ownCapital, input.savingsRate);
  const jeonseTotal = loanInterest + jeonseOpportunity;

  const monthlyOpportunity = monthlyInterest(input.monthlyDeposit, input.savingsRate);
  const monthlyTotal = monthlyOpportunity + input.monthlyRent;

  const monthlyDifference = monthlyTotal - jeonseTotal;
  const months = input.years * 12;
  const gap = input.jeonseDeposit - input.monthlyDeposit;

  return {
    jeonse: { loanAmount, ownCapital, loanInterest, opportunityCost: jeonseOpportunity, monthlyTotal: jeonseTotal },
    monthly: { opportunityCost: monthlyOpportunity, rent: input.monthlyRent, monthlyTotal },
    monthlyDifference,
    cheaper: Math.abs(monthlyDifference) < EQUAL_THRESHOLD ? 'EQUAL' : monthlyDifference > 0 ? 'JEONSE' : 'MONTHLY',
    totalOverTerm: { jeonse: jeonseTotal * months, monthly: monthlyTotal * months },
    conversionRate: gap > 0 ? ((input.monthlyRent * 12) / gap) * 100 : null,
  };
}

/** 입력 문자열을 숫자로. 비었거나 숫자가 아니면 0, 범위를 벗어나면 가장자리 값으로 맞춘다 */
export function parseCalcNumber(raw: string, min: number, max: number): number {
  const value = Number(raw);
  if (raw.trim() === '' || !Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** 만원 값을 소수 한 자리까지 보여준다. 예: 92.5 → "92.5만원", 3 → "3만원", 12345 → "1억 2,345만원" */
export function formatCostManwon(manwon: number): string {
  const rounded = Math.round(manwon * 10) / 10;
  const sign = rounded < 0 ? '-' : '';
  const abs = Math.abs(rounded);
  if (abs >= 10000) {
    const eok = Math.floor(abs / 10000);
    const rest = Math.round((abs % 10000) * 10) / 10;
    return `${sign}${eok.toLocaleString()}억${rest > 0 ? ` ${rest.toLocaleString()}만원` : ''}`;
  }
  return `${sign}${abs.toLocaleString()}만원`;
}
