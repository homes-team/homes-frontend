import {
  CARD_OPTION_PRIORITY,
  PropertyListItem,
  PropertyOption,
  TRADE_TYPE_LABEL,
} from '../types/property';

/** 만원 단위 금액을 "1000", "2.5억", "8억 5000" 형태로 변환 */
export function formatMoney(manwon: number): string {
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000);
    const rest = manwon % 10000;
    if (rest === 0) {
      return `${eok}억`;
    }
    // 2억 5000 → "2.5억" 처럼 천만원 단위로 떨어지면 소수점 표기
    if (rest % 1000 === 0) {
      return `${eok}.${rest / 1000}억`;
    }
    return `${eok}억 ${rest.toLocaleString()}`;
  }
  return manwon.toLocaleString();
}

/** 거래 유형에 맞는 가격 라벨: "월세 1000/80", "전세 2.5억", "매매 8.5억" */
export function formatPrice(item: PropertyListItem): string {
  const label = TRADE_TYPE_LABEL[item.tradeType];
  if (item.tradeType === 'MONTHLY_RENT') {
    return `${label} ${formatMoney(item.deposit)}/${item.monthlyRent}`;
  }
  return `${label} ${formatMoney(item.deposit)}`;
}

/** "3/5층 · 23m²" 형태의 메타 정보 */
export function formatMeta(item: PropertyListItem): string {
  return `${item.currentFloor}/${item.totalFloors}층 · ${item.area}m²`;
}

/** createdAt(ISO) → "방금 전", "10분 전", "3시간 전", "3일 전", "2주 전" */
export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}주 전`;

  return new Date(isoDate).toLocaleDateString('ko-KR');
}

/* ------------------------------------------------------------------ */
/* 검색 화면 전용                                                       */
/* ------------------------------------------------------------------ */

/** "서울시 강남구 역삼동 123-45" → "서울시 강남구 역삼동" (번지 제거) */
export function shortenAddress(address: string): string {
  return address.split(' ').slice(0, 3).join(' ');
}

/** 만원 단위 관리비 → "관리비 7만". 없거나 0이면 null */
export function formatMaintenanceFee(fee: number | null): string | null {
  if (!fee) return null;
  return `관리비 ${formatMoney(fee)}만`;
}

/** 검색 카드 메타 라인: "서울시 강남구 역삼동 · 3/5층 · 23m² · 관리비 7만" */
export function formatSearchMeta(item: PropertyListItem): string {
  return [shortenAddress(item.address), formatMeta(item), formatMaintenanceFee(item.maintenanceFee)]
    .filter(Boolean)
    .join(' · ');
}

/**
 * 역세권 표기 임계값.
 *
 * 백엔드는 거리에 상한을 두지 않아 역이 5km 떨어진 매물도 "도보 63분"으로 저장된다.
 * 카드에 띄우면 의미 없는 정보라 프론트에서 잘라낸다.
 * 백엔드에 상한 처리가 반영되면 이 상수는 제거해도 된다.
 */
export const MAX_VISIBLE_WALKING_MINUTES = 15;

/** "역삼역 도보 5분". 역이 없거나 너무 멀면 null */
export function formatWalking(item: PropertyListItem): string | null {
  if (!item.nearestStation || item.walkingTime === null) return null;
  if (item.walkingTime > MAX_VISIBLE_WALKING_MINUTES) return null;
  return `${item.nearestStation} 도보 ${item.walkingTime}분`;
}

/** m² → 평 (반올림). 필터 UI 표기용 */
export function toPyeong(squareMeter: number): number {
  return Math.round(squareMeter / 3.3058);
}

/** 평 → m². 필터 값을 API로 보낼 때 사용 */
export function toSquareMeter(pyeong: number): number {
  return Math.round(pyeong * 3.3058 * 10) / 10;
}

/**
 * 카드에 노출할 옵션을 우선순위에 따라 골라낸다.
 *
 * 백엔드는 옵션 전체를 내려주지만 카드 공간은 3칸뿐이라,
 * 침대·책상처럼 변별력 없는 항목보다 풀옵션·주차 가능을 먼저 보여준다.
 */
export function pickCardOptions(options: PropertyOption[], max = 3): PropertyOption[] {
  if (!options?.length) return [];
  const owned = new Set(options);
  return CARD_OPTION_PRIORITY.filter((option) => owned.has(option)).slice(0, max);
}