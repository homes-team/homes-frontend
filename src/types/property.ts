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

/** PropertyDirection.java 대응 */
export type PropertyDirection =
  | 'SOUTH'
  | 'SOUTHEAST'
  | 'SOUTHWEST'
  | 'EAST'
  | 'WEST'
  | 'NORTHEAST'
  | 'NORTHWEST'
  | 'NORTH'
  | 'UNKNOWN';

export const PROPERTY_DIRECTION_LABEL: Record<PropertyDirection, string> = {
  SOUTH: '남향',
  SOUTHEAST: '남동향',
  SOUTHWEST: '남서향',
  EAST: '동향',
  WEST: '서향',
  NORTHEAST: '북동향',
  NORTHWEST: '북서향',
  NORTH: '북향',
  UNKNOWN: '정보 없음',
};

/**
 * PropertyStatus.java 대응. HIDDEN(숨김)은 아직 백엔드에 없는 제안 값이다
 * (docs/api-requests/property-status.md). DELETED는 소프트 삭제된 매물(관리자에게만 보임).
 */
export type PropertyStatus = 'AVAILABLE' | 'MATCHED' | 'COMPLETED' | 'HIDDEN' | 'DELETED';

/** 집주인이 직접 바꿀 수 있는 상태. MATCHED는 제안서 수락/취소 흐름으로만 바뀐다. */
export type ManagedPropertyStatus = 'AVAILABLE' | 'COMPLETED' | 'HIDDEN';

export const PROPERTY_STATUS_LABEL: Record<PropertyStatus, string> = {
  AVAILABLE: '광고 중',
  MATCHED: '매칭 진행 중',
  COMPLETED: '거래 완료',
  HIDDEN: '숨김',
  DELETED: '삭제됨',
};

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
  | 'FULL_OPTION'
  | 'PET_ALLOWED'
  | 'JEONSE_LOAN';

/**
 * 관리비에 포함된 항목 종류 (백엔드 미구현, 제안 스펙 — docs/api-requests/maintenance-fee-breakdown.md).
 * 관리비 상세 내역 공개 의무화에 맞춰 항목별로 적도록 한다.
 */
export type MaintenanceItemType =
  | 'INTERNET'
  | 'WATER'
  | 'ELECTRICITY'
  | 'GAS'
  | 'HEATING'
  | 'CLEANING'
  | 'SECURITY'
  | 'PARKING'
  | 'TV';

/** 관리비 한 항목. amount가 null이면 "포함(금액 미기재)"을 뜻한다. 만원 단위. */
export interface MaintenanceItem {
  type: MaintenanceItemType;
  amount: number | null;
}

export const MAINTENANCE_ITEM_LABEL: Record<MaintenanceItemType, string> = {
  INTERNET: '인터넷',
  WATER: '수도',
  ELECTRICITY: '전기',
  GAS: '가스',
  HEATING: '난방',
  CLEANING: '청소',
  SECURITY: '경비',
  PARKING: '주차',
  TV: 'TV(케이블)',
};

/** 입력/표시 순서 — 임차인이 가장 많이 묻는 항목(인터넷·수도·전기)을 앞에 둔다 */
export const MAINTENANCE_ITEM_ORDER: MaintenanceItemType[] = [
  'INTERNET',
  'WATER',
  'ELECTRICITY',
  'GAS',
  'HEATING',
  'CLEANING',
  'SECURITY',
  'PARKING',
  'TV',
];

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
  PET_ALLOWED: '반려동물 가능',
  JEONSE_LOAN: '전세자금대출 가능',
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
 * 아직 백엔드 PropertyOption enum(및 property_options CHECK 제약)에 없는 옵션.
 * 서버로 보내면 400이 나므로 검색 요청에서는 빼고 프론트에서 결과를 직접 거른다.
 * 백엔드에 추가되면 PROPERTY_OPTION_ORDER로 옮기고 이 목록을 비운다.
 */
export const FRONTEND_ONLY_OPTIONS: PropertyOption[] = ['PET_ALLOWED', 'JEONSE_LOAN'];

/** 검색 필터에만 노출하는 옵션 순서 (등록 마법사는 서버가 저장할 수 있는 PROPERTY_OPTION_ORDER만 쓴다) */
export const FILTER_OPTION_ORDER: PropertyOption[] = [...PROPERTY_OPTION_ORDER, ...FRONTEND_ONLY_OPTIONS];

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
  'PET_ALLOWED',
  'JEONSE_LOAN',
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
 * 목록(PropertyListItem)과 달리 썸네일 구분이 없고
 * 대신 전체 이미지 목록·상세주소·희망 중개수수료율을 내려준다.
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
  /** (백엔드 미구현) 관리비 포함 내역. 내려오기 전에는 undefined */
  maintenanceItems?: MaintenanceItem[];
  totalFloors: number;
  currentFloor: number;
  direction: PropertyDirection;
  remodelingYear: number | null;
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
  status: PropertyStatus;
}

export type AiEvaluationCategoryKey =
  | 'SCHOOL'
  | 'TRANSPORT'
  | 'NATURE'
  | 'SUNLIGHT'
  | 'BUILDING_CONDITION'
  | 'INFRASTRUCTURE';

export type AiEvaluationScoreStatus =
  | 'AVAILABLE'
  | 'PENDING_DATA'
  | 'INSUFFICIENT_DATA'
  | 'NOT_APPLICABLE';

export interface AiEvaluationEvidence {
  code: string;
  label: string;
  value: string;
  unit: string | null;
  criterion: string;
  contribution: number | null;
  source: string;
}

export interface AiEvaluationCalculation {
  formula: string;
  policyVersion: string;
}

export interface AiEvaluationCategory {
  key: AiEvaluationCategoryKey;
  label: string;
  rawScore: number | null;
  displayScore: number | null;
  status: AiEvaluationScoreStatus;
  source: 'GEOSPATIAL_PIPELINE' | 'PROPERTY_RULE' | 'EXTERNAL_DATA' | 'MANUAL' | 'NONE';
  description: string;
  /** 구버전 백엔드 응답과의 호환을 위해 선택값으로 처리한다. */
  evidence?: AiEvaluationEvidence[];
  calculation?: AiEvaluationCalculation | null;
}

/** AiEvaluationRespDto.java 대응 */
export interface AiEvaluation {
  propertyId: number;
  overall: {
    rawScore: number | null;
    displayScore: number | null;
    evaluatedCategoryCount: number;
    totalCategoryCount: number;
    completeness: number;
  };
  categories: AiEvaluationCategory[];
  report: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    notice: string | null;
  };
  scoreVersion: string;
  reportModelVersion: string;
  generatedAt: string;
}

export type NearbyFacilityType =
  | 'SUBWAY'
  | 'BUS_STOP'
  | 'SCHOOL'
  | 'HOSPITAL'
  | 'CULTURE'
  | 'PARK'
  | 'MART';

export interface NearbyFacility {
  id: string;
  type: NearbyFacilityType;
  name: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  address: string | null;
  source: 'NATIONWIDE_TRANSPORT_POI' | 'KAKAO_LOCAL';
}

export interface NearbyFacilities {
  propertyId: number;
  center: {
    latitude: number;
    longitude: number;
  };
  radiusMeters: number;
  facilities: NearbyFacility[];
}

export type IsochroneMode = 'walk' | 'drive';
export type IsochroneTravelTime = 5 | 10;

export interface PropertyIsochrone {
  propertyId: number;
  mode: IsochroneMode;
  travelTimeMinutes: number;
  center: {
    latitude: number;
    longitude: number;
  };
  geometry: {
    type: 'Polygon';
    /** GeoJSON 좌표 순서: [longitude, latitude] */
    coordinates: number[][][];
  };
  metadata: {
    estimatedDistanceMeters: number | null;
    totalAreaSquareMeters: number;
    calculationMethod: string;
    dataSource: string;
    cached: boolean;
    generatedAt: string;
  };
}

export type PricePredictionStatus =
  | 'AVAILABLE'
  | 'INSUFFICIENT_DATA'
  | 'UNSUPPORTED'
  | 'ADDRESS_UNAVAILABLE'
  | 'PROVIDER_UNAVAILABLE';

export type PricePredictionConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNAVAILABLE';

export type PricePredictionComparisonScope =
  | 'SAME_COMPLEX'
  | 'SAME_LEGAL_DONG'
  | 'SAME_DISTRICT'
  | 'UNAVAILABLE';

export interface ComparableTrade {
  apartmentName: string | null;
  legalDongName: string | null;
  areaSquareMeters: number;
  floor: number;
  buildYear: number | null;
  priceTenThousandWon: number;
  contractDate: string;
}

export interface PropertyPricePrediction {
  propertyId: number;
  status: PricePredictionStatus;
  tradeType: TradeType;
  predictedPrice: number | null;
  minimumPrice: number | null;
  maximumPrice: number | null;
  confidence: PricePredictionConfidence;
  comparisonScope: PricePredictionComparisonScope;
  sampleCount: number;
  referenceFrom: string | null;
  referenceTo: string | null;
  representativeTrades: ComparableTrade[];
  method: string;
  description: string;
}

/** PropertyListRespDto.java 대응 (카드형 리스트 아이템) */
/** PropertyClusterResDto.java 대응 — 격자 단위로 묶은 매물 개수 */
export interface PropertyCluster {
  lat: number;
  lon: number;
  count: number;
}

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
