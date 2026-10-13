/**
 * 전월세 전환. 금액은 만원, 전환율은 연 %.
 *
 *   월세 = (전세보증금 - 월세보증금) × 전환율 / 12
 *   전환율 = 월세 × 12 / (전세보증금 - 월세보증금)
 */

/**
 * 주택 전월세 전환율 상한 (연 %). 주택임대차보호법 시행령 제9조에 따라
 * "연 10%"와 "한국은행 기준금리 + 2%p" 중 낮은 값이라 기준금리가 바뀌면 달라진다.
 * 참고 안내용 값이며, 계약 전에는 최신 상한을 확인해야 한다.
 */
export const HOUSING_CONVERSION_RATE_CAP = 4.5;

/** 전세 → 월세. 월세 보증금을 뺀 나머지를 월세로 바꾼다. 바꿀 금액이 없으면 null */
export function jeonseToMonthlyRent(jeonseDeposit: number, monthlyDeposit: number, ratePercent: number): number | null {
  const gap = jeonseDeposit - monthlyDeposit;
  return gap > 0 ? (gap * ratePercent) / 100 / 12 : null;
}

/** 월세 → 전세. 월세를 전환율로 나눈 금액을 월세 보증금에 더한다. 전환율이 0이면 null */
export function monthlyRentToJeonse(monthlyDeposit: number, monthlyRent: number, ratePercent: number): number | null {
  return ratePercent > 0 ? monthlyDeposit + (monthlyRent * 12) / (ratePercent / 100) : null;
}

/** 전세와 월세 조건에서 역산한 전환율. 전세금이 월세 보증금 이하이면 null */
export function conversionRate(jeonseDeposit: number, monthlyDeposit: number, monthlyRent: number): number | null {
  const gap = jeonseDeposit - monthlyDeposit;
  return gap > 0 ? ((monthlyRent * 12) / gap) * 100 : null;
}
