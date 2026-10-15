/** 입력 문자열을 숫자로. 비었거나 숫자가 아니면 min, 범위를 벗어나면 가장자리 값으로 맞춘다 */
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

/** 원 단위 금액. 예: 1234000 → "1,234,000원" */
export function formatWon(won: number): string {
  return `${Math.round(won).toLocaleString()}원`;
}

/** 소수 둘째 자리까지, 불필요한 0은 뗀다. 예: 0.4 → "0.4", 4.50 → "4.5", 3 → "3" */
export function formatRate(rate: number): string {
  return String(Math.round(rate * 100) / 100);
}

/** 부동소수점 오차(예: 1.5e9 x 0.7 = 1.0499999e9)로 1원이 깎이지 않게, 원 단위 절사 전에 더하는 아주 작은 값 */
const FLOOR_EPSILON = 1e-6;

/** 원 단위 이하 절사 (부동소수점 오차 보정 포함) */
export function floorWon(value: number): number {
  return Math.floor(value + FLOOR_EPSILON);
}
