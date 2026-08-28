/** PropertyType.java 대응 */
export type PropertyType =
  | 'ONE_ROOM'
  | 'TWO_ROOM'
  | 'VILLA'
  | 'HOUSE'
  | 'APARTMENT'
  | 'OFFICETEL'
  | 'PRESALE';

/** TradeType.java 대응 */
export type TradeType = 'MONTHLY_RENT' | 'JEONSE' | 'SALE';

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  ONE_ROOM: '원룸',
  TWO_ROOM: '투룸',
  VILLA: '빌라',
  HOUSE: '주택',
  APARTMENT: '아파트',
  OFFICETEL: '오피스텔',
  PRESALE: '분양',
};

export const TRADE_TYPE_LABEL: Record<TradeType, string> = {
  MONTHLY_RENT: '월세',
  JEONSE: '전세',
  SALE: '매매',
};

/** PropertyListRespDto.java 대응 (카드형 리스트 아이템) */
export interface PropertyListItem {
  propertyId: number;
  thumbnailUrl: string | null;
  propertyType: PropertyType;
  tradeType: TradeType;
  deposit: number; // 만원 단위
  monthlyRent: number; // 만원 단위
  totalFloors: number;
  currentFloor: number;
  area: number; // m²
  description: string;
  createdAt: string; // ISO LocalDateTime
  aiScore: number;
  tags: string[];
  favoriteCount: number;
  isSuspicious: boolean;
}
