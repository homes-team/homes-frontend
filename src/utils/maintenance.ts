import { MAINTENANCE_ITEM_ORDER, MaintenanceItem } from '../types/property';

export interface MaintenanceSummary {
  /** 표시 순서(MAINTENANCE_ITEM_ORDER)로 정렬된 항목 */
  items: MaintenanceItem[];
  /** 금액이 적힌 항목의 합 (만원) */
  itemizedTotal: number;
  /** 총액에서 항목 합계를 뺀 나머지 (만원). 계산할 수 없거나 0 이하이면 null */
  remainder: number | null;
  /** 항목 합계가 총액을 넘는 경우 — 입력 오류일 가능성이 크다 */
  exceedsTotal: boolean;
}

/** 소수점 오차(0.1+0.2) 없이 만원 단위 소수 한 자리까지만 다룬다 */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function summarizeMaintenance(totalFee: number | null | undefined, items: MaintenanceItem[]): MaintenanceSummary {
  const sorted = [...items].sort(
    (a, b) => MAINTENANCE_ITEM_ORDER.indexOf(a.type) - MAINTENANCE_ITEM_ORDER.indexOf(b.type),
  );
  const itemizedTotal = round1(sorted.reduce((sum, item) => sum + (item.amount ?? 0), 0));
  const hasTotal = typeof totalFee === 'number' && totalFee > 0;
  const remainder = hasTotal && itemizedTotal > 0 ? round1(totalFee - itemizedTotal) : null;

  return {
    items: sorted,
    itemizedTotal,
    remainder: remainder !== null && remainder > 0 ? remainder : null,
    exceedsTotal: hasTotal && itemizedTotal > totalFee,
  };
}

/** 폼 입력 문자열 → 금액. 비어 있거나 숫자가 아니면 null("포함", 금액 미기재), 음수는 0으로 본다 */
export function parseMaintenanceAmount(raw: string): number | null {
  if (raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, value) : null;
}
