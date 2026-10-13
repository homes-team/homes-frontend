/**
 * 비교 표에서 "가장 좋은 값"을 가진 칸의 인덱스를 돌려준다.
 *
 * 비교가 의미 없는 경우는 빈 집합이다:
 * - 값이 있는 매물이 2개 미만 (비교 대상이 없음)
 * - 모든 값이 같음 (우열이 없음)
 */
export function bestIndexes(values: Array<number | null | undefined>, mode: 'min' | 'max'): Set<number> {
  const known = values
    .map((value, index) => ({ value, index }))
    .filter((entry): entry is { value: number; index: number } => typeof entry.value === 'number');

  if (known.length < 2) return new Set();

  const target = mode === 'min' ? Math.min(...known.map((entry) => entry.value)) : Math.max(...known.map((entry) => entry.value));
  if (known.every((entry) => entry.value === target)) return new Set();

  return new Set(known.filter((entry) => entry.value === target).map((entry) => entry.index));
}

/** 모든 값이 같은 항목이면 true. 서로 다른 거래 유형 간 가격 비교를 막는 데 쓴다. */
export function allSame<T>(values: T[]): boolean {
  return values.every((value) => value === values[0]);
}
