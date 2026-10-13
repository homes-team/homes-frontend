import { FRONTEND_ONLY_OPTIONS, PropertyListItem, PropertyOption } from '../types/property';

interface ClientSideFilter {
  /** 만원 단위. 관리비가 없는 매물(null)은 0으로 본다. */
  minMaintenanceFee?: number;
  maxMaintenanceFee?: number;
  options?: PropertyOption[];
}

/** 서버로 보내도 되는 옵션만 남긴다 (FRONTEND_ONLY_OPTIONS는 서버 enum에 없어 400이 난다) */
export function serverSupportedOptions(options: PropertyOption[] | undefined): PropertyOption[] {
  return (options ?? []).filter((option) => !FRONTEND_ONLY_OPTIONS.includes(option));
}

/**
 * 백엔드 검색 조건에 아직 없는 필터(관리비 범위, 신규 옵션)를 응답 결과에 직접 적용한다.
 * 백엔드가 같은 조건을 지원하게 되어도 이미 걸러진 결과를 다시 거르는 것이라 결과가 달라지지 않는다.
 */
export function applyClientSideFilters(items: PropertyListItem[], filter: ClientSideFilter): PropertyListItem[] {
  const { minMaintenanceFee, maxMaintenanceFee } = filter;
  const requiredOptions = (filter.options ?? []).filter((option) => FRONTEND_ONLY_OPTIONS.includes(option));

  return items.filter((item) => {
    const fee = item.maintenanceFee ?? 0;
    if (minMaintenanceFee !== undefined && fee < minMaintenanceFee) return false;
    if (maxMaintenanceFee !== undefined && fee > maxMaintenanceFee) return false;
    return requiredOptions.every((option) => item.options.includes(option));
  });
}
