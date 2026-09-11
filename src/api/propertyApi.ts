import {
  PropertyListItem,
  PropertyOption,
  PropertyType,
  SortBy,
  TradeType,
} from '../types/property';
import { apiGet } from './client';

/** 전체 매물 리스트 조회 (최신 등록순) — GET /properties */
export function fetchAllProperties(): Promise<PropertyListItem[]> {
  return apiGet<PropertyListItem[]>('/properties');
}

/** 실시간 급상승 랭킹 조회 — GET /properties/surge-rankings */
export function fetchSurgeRankings(): Promise<PropertyListItem[]> {
  return apiGet<PropertyListItem[]>('/properties/surge-rankings');
}

/** 지도 영역 (카카오맵 getBounds() 결과를 그대로 옮긴 값) */
export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

/** 사용자가 조작하는 필터 값. 지도 영역과 분리해 두어야 상태 관리가 단순해진다. */
export interface PropertyFilter {
  /** 주소 · 제목 · 옵션 부분 일치 */
  keyword?: string;
  tradeType?: TradeType;
  propertyType?: PropertyType;
  /** 만원 단위. 월세는 보증금, 전세·매매는 가격 자체 */
  minDeposit?: number;
  maxDeposit?: number;
  /** 만원 단위 */
  minMonthlyRent?: number;
  maxMonthlyRent?: number;
  /** m² */
  minArea?: number;
  maxArea?: number;
  /** AND 조건 — 모두 만족하는 매물만 */
  options?: PropertyOption[];
  sortBy?: SortBy;
}

export type MapSearchParams = MapBounds & PropertyFilter;

/**
 * 백엔드는 sortBy가 비어 있으면 RECOMMENDED로 처리한다.
 * 그런데 aiScore가 아직 고정값이라 추천순은 찜많은순과 결과가 같다.
 * 정렬 정규화가 실제로 의미를 갖기 전까지는 프론트에서 항상 명시적으로 보낸다.
 */
const DEFAULT_SORT_BY: SortBy = 'LATEST';

export function buildSearchQuery(params: MapSearchParams): string {
  const query = new URLSearchParams();

  const append = (key: string, value: string | number | undefined | null) => {
    if (value === undefined || value === null || value === '') return;
    query.append(key, String(value));
  };

  append('swLat', params.swLat);
  append('swLng', params.swLng);
  append('neLat', params.neLat);
  append('neLng', params.neLng);

  append('keyword', params.keyword?.trim());
  append('tradeType', params.tradeType);
  append('propertyType', params.propertyType);
  append('minDeposit', params.minDeposit);
  append('maxDeposit', params.maxDeposit);
  append('minMonthlyRent', params.minMonthlyRent);
  append('maxMonthlyRent', params.maxMonthlyRent);
  append('minArea', params.minArea);
  append('maxArea', params.maxArea);
  append('sortBy', params.sortBy ?? DEFAULT_SORT_BY);

  // List<PropertyOption>은 같은 키를 반복해서 보낸다: ?options=PARKING&options=ELEVATOR
  params.options?.forEach((option) => query.append('options', option));

  return query.toString();
}

/**
 * 지도 영역 기반 매물 검색 — GET /properties/map
 *
 * 로그인 상태면 토큰을 함께 보낸다. 백엔드가 권한에 따라 노출 매물 상태를 다르게 주고
 * (일반 유저는 AVAILABLE + MATCHED, 중개사는 AVAILABLE만),
 * 추천순 정렬의 개인화 보너스에도 사용자 정보가 쓰이기 때문이다.
 */
export function searchPropertiesOnMap(
  params: MapSearchParams,
  signal?: AbortSignal,
): Promise<PropertyListItem[]> {
  return apiGet<PropertyListItem[]>(`/properties/map?${buildSearchQuery(params)}`, {
    auth: true,
    signal,
  });
}
