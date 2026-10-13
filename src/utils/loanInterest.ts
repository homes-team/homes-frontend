/**
 * 대출 상환 계산. 금액은 원, 이율은 연 %, 기간은 개월.
 *
 * - 원리금균등: 매달 같은 금액(원금+이자)을 낸다.   월 상환액 = P·r / (1 − (1+r)^−n),  r = 연이율 ÷ 12
 * - 원금균등: 매달 같은 원금을 내고 이자는 줄어든다.  원금 = P ÷ n,  이자 = 잔금 × r
 * - 만기일시: 매달 이자만 내고 마지막 달에 원금을 한 번에 낸다.
 *
 * 거치기간에는 이자만 낸다. 거치기간이 끝나면 남은 기간(n − 거치)에 대해 위 방식으로 갚는다.
 * 금융기관은 원 단위 반올림·절사 방식이 달라 실제 금액과 몇 원 차이가 날 수 있다.
 */
export type RepaymentMethod = 'ANNUITY' | 'EQUAL_PRINCIPAL' | 'BULLET';

export interface LoanInput {
  /** 대출 원금 (원) */
  principal: number;
  /** 연 이율 (%) */
  annualRate: number;
  /** 전체 대출 기간 (개월) */
  months: number;
  /** 이자만 내는 거치 기간 (개월). 만기일시는 무시한다 */
  graceMonths: number;
  method: RepaymentMethod;
}

export interface LoanRow {
  /** 회차 (1부터) */
  month: number;
  /** 갚는 원금 */
  principalPaid: number;
  interest: number;
  /** 그 달에 내는 총액 (원금 + 이자) */
  payment: number;
  /** 갚고 난 뒤 남은 원금 */
  balance: number;
}

export interface LoanResult {
  rows: LoanRow[];
  totalInterest: number;
  totalPayment: number;
  /** 첫 회차에 내는 금액 */
  firstPayment: number;
  /** 마지막 회차에 내는 금액 (만기일시는 원금 포함) */
  lastPayment: number;
}

export const MAX_LOAN_MONTHS = 600;

export function calculateLoan(input: LoanInput): LoanResult {
  const months = Math.max(1, Math.min(MAX_LOAN_MONTHS, Math.round(input.months)));
  const monthlyRate = input.annualRate / 100 / 12;
  const grace =
    input.method === 'BULLET' ? months : Math.max(0, Math.min(months - 1, Math.round(input.graceMonths)));
  const amortizeMonths = months - grace;

  const rows: LoanRow[] = [];
  let balance = input.principal;

  // 원리금균등: 거치 후 남은 기간 동안 매달 내는 금액 (이율 0%면 원금만 균등)
  const annuityPayment =
    monthlyRate === 0
      ? input.principal / amortizeMonths
      : (input.principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -amortizeMonths));

  for (let month = 1; month <= months; month++) {
    const interest = balance * monthlyRate;
    let principalPaid = 0;

    if (input.method === 'BULLET') {
      principalPaid = month === months ? balance : 0;
    } else if (month > grace) {
      principalPaid =
        input.method === 'EQUAL_PRINCIPAL'
          ? input.principal / amortizeMonths
          : annuityPayment - interest;
    }

    // 부동소수점 오차로 마지막 달 잔금이 0이 아니게 남지 않도록 마지막 회차는 남은 원금을 전부 갚는다
    if (month === months) principalPaid = balance;

    balance = month === months ? 0 : balance - principalPaid;
    rows.push({ month, principalPaid, interest, payment: principalPaid + interest, balance });
  }

  const totalInterest = rows.reduce((sum, row) => sum + row.interest, 0);

  return {
    rows,
    totalInterest,
    totalPayment: input.principal + totalInterest,
    firstPayment: rows[0].payment,
    lastPayment: rows[rows.length - 1].payment,
  };
}
