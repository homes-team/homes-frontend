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

/** PropertyStatus.java 대응 */
export type PropertyStatus = 'AVAILABLE' | 'MATCHED' | 'COMPLETED';

/** 건축물대장·K-apt 정보 자동 수집 상태 */
export type BuildingInformationStatus =
  | 'NOT_COLLECTED'
  | 'PENDING'
  | 'PROCESSING'
  | 'PARTIAL'
  | 'RESOLVED'
  | 'FAILED';

/** BuildingInformationRespDto.java 대응 */
export interface BuildingInformation {
  propertyId: number;
  status: BuildingInformationStatus;
  normalizedAddress: string | null;
  buildingRegisterId: string | null;
  kaptCode: string | null;
  approvalDate: string | null;
  buildingYear: number | null;
  householdCount: number | null;
  buildingCount: number | null;
  buildingHeightMeters: number | null;
  groundFloorCount: number | null;
  undergroundFloorCount: number | null;
  elevatorCount: number | null;
  parkingCount: number | null;
  corridorType: string | null;
  heatingType: string | null;
  dataSources: string | null;
  collectedAt: string | null;
  retryCount: number | null;
  lastAttemptAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  missingFields: string[];
}

/** PropertyOption.java 대응 (기존 자유 태그 tags를 대체) */
export type PropertyOption =
  | 'ELEVATOR'
  | 'SECURITY_GUARD'
  | 'PARKING'
  | 'BED'
  | 'DESK'
  | 'AIR_CONDITIONER'
  | 'REFRIGERATOR'
  | 'WASHING_MACHINE'
  | 'MICROWAVE'
  | 'INDUCTION'
  | 'GAS_STOVE'
  | 'SHOE_RACK'
  | 'CLOSET'
  | 'SINK'
  | 'VERANDA'
  | 'FULL_OPTION';

/** 정렬 기준 — 백엔드 sortBy 파라미터 값 */
export type SortBy = 'RECOMMENDED' | 'LATEST' | 'FAVORITE';

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

/** PropertyOption.java의 description과 동일하게 유지할 것 */
export const PROPERTY_OPTION_LABEL: Record<PropertyOption, string> = {
  ELEVATOR: '엘리베이터',
  SECURITY_GUARD: '경비원',
  PARKING: '주차 가능',
  BED: '침대',
  DESK: '책상',
  AIR_CONDITIONER: '에어컨',
  REFRIGERATOR: '냉장고',
  WASHING_MACHINE: '세탁기',
  MICROWAVE: '전자레인지',
  INDUCTION: '인덕션 레인지',
  GAS_STOVE: '가스레인지',
  SHOE_RACK: '신발장',
  CLOSET: '옷장',
  SINK: '싱크대',
  VERANDA: '베란다',
  FULL_OPTION: '풀옵션',
};

/** 필터 모달의 체크박스 노출 순서 */
export const PROPERTY_OPTION_ORDER: PropertyOption[] = [
  'FULL_OPTION',
  'PARKING',
  'ELEVATOR',
  'SECURITY_GUARD',
  'AIR_CONDITIONER',
  'WASHING_MACHINE',
  'REFRIGERATOR',
  'INDUCTION',
  'GAS_STOVE',
  'MICROWAVE',
  'SINK',
  'CLOSET',
  'SHOE_RACK',
  'VERANDA',
  'BED',
  'DESK',
];

/**
 * 카드에 노출할 옵션 우선순위.
 *
 * 백엔드는 옵션 전체 배열을 내려주고, 그중 무엇을 몇 개 보여줄지는 프론트가 정한다.
 * 침대·책상·신발장처럼 어느 매물에나 있는 항목은 변별력이 없어 뒤로 뺐다.
 */
export const CARD_OPTION_PRIORITY: PropertyOption[] = [
  'FULL_OPTION',
  'PARKING',
  'ELEVATOR',
  'SECURITY_GUARD',
  'AIR_CONDITIONER',
  'VERANDA',
  'WASHING_MACHINE',
  'REFRIGERATOR',
  'INDUCTION',
  'CLOSET',
  'SINK',
  'MICROWAVE',
  'GAS_STOVE',
  'SHOE_RACK',
  'BED',
  'DESK',
];

/** ReportReason.java 대응 */
export type ReportReason =
  | 'FAKE_PROPERTY'
  | 'SOLD_OUT'
  | 'PRICE_MISMATCH'
  | 'INFO_MISMATCH'
  | 'OTHER';

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  FAKE_PROPERTY: '존재하지 않는 허위 매물',
  SOLD_OUT: '이미 거래완료된 매물',
  PRICE_MISMATCH: '가격 정보 불일치',
  INFO_MISMATCH: '매물 정보 불일치',
  OTHER: '기타',
};

/** ReportCreateReqDto.java 대응 */
export interface ReportCreateRequest {
  reason: ReportReason;
  /** reason이 OTHER일 때만 저장됨 */
  customReason?: string;
}

/** ReportListRespDto.java 대응 (GET /users/me/reports) */
export interface ReportListItem {
  reportId: number;
  propertyId: number;
  propertyTitle: string;
  reasonDescription: string;
  reportedAt: string;
}

/**
 * PropertyDetailRespDto.java 대응.
 * 목록(PropertyListItem)과 달리 status/favoriteCount일부/썸네일 구분이 없고
 * 대신 전체 이미지 목록·상세주소·희망 중개수수료율을 내려준다.
 * ⚠️ 백엔드 응답에 status 필드가 없다 — 상세 화면에서 거래 상태를 보여줘야 하면
 * 목록 API(PropertyListItem.status)에서 가져온 값을 함께 들고 있어야 한다.
 */
export interface PropertyDetail {
  propertyId: number;
  imageUrls: string[];
  title: string;
  description: string;
  address: string;
  detailAddress: string;
  tradeType: TradeType;
  propertyType: PropertyType;
  deposit: number;
  monthlyRent: number;
  maintenanceFee: number | null;
  totalFloors: number;
  currentFloor: number;
  area: number;
  aiScore: number | null;
  desiredBrokerageFee: number | null;
  options: PropertyOption[];
  nearestStation: string | null;
  walkingTime: number | null;
  latitude: number;
  longitude: number;
  favoriteCount: number;
  isSuspicious: boolean;
}

/** PropertyListRespDto.java 대응 (카드형 리스트 아이템) */
export interface PropertyListItem {
  propertyId: number;
  thumbnailUrl: string | null;
  /** 자동 생성 부제목 (예: "강남구 역삼동 신축 원룸") */
  title: string;
  /** 전체 주소 (예: "서울시 강남구 역삼동 123-45") */
  address: string;
  latitude: number;
  longitude: number;
  propertyType: PropertyType;
  tradeType: TradeType;
  /** 만원 단위. 월세는 보증금, 전세는 전세가, 매매는 매매가를 겸한다. */
  deposit: number;
  /** 만원 단위. 전세·매매는 0. */
  monthlyRent: number;
  /** 만원 단위 관리비 */
  maintenanceFee: number | null;
  totalFloors: number;
  currentFloor: number;
  /** m² */
  area: number;
  /** 집주인이 직접 쓴 한 줄 소개 */
  description: string;
  /** ISO LocalDateTime */
  createdAt: string;
  /** 100점 만점. AI 미분석 매물은 null. */
  aiScore: number | null;
  options: PropertyOption[];
  /** 최근접 지하철역명. 계산 불가 시 null. */
  nearestStation: string | null;
  /** 도보 소요 분. 계산 불가 시 null. */
  walkingTime: number | null;
  favoriteCount: number;
  isSuspicious: boolean;
  status: PropertyStatus;
}
