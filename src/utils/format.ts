import { PropertyListItem, TRADE_TYPE_LABEL } from '../types/property';

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
