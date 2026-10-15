import {
  INFRA_ORDER,
  INFRA_RADIUS_METERS,
  InfraType,
  InfrastructureItem,
} from '../types/infrastructure';

const EARTH_RADIUS_METERS = 6_371_000;
/** 성인 걸음 1분 = 80m. 백엔드가 역세권 도보 시간을 계산할 때 쓰는 기준과 같다 */
const WALKING_METERS_PER_MINUTE = 80;
/** 지하철역이 이 거리 이내면 "역세권"으로 본다 (도보 약 6분) */
export const STATION_AREA_METERS = 500;
/** 카테고리마다 보여줄 가까운 시설 수 */
export const NEARBY_LIMIT = 3;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Bounds {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** 두 좌표 사이의 직선거리 (미터, Haversine) */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

/** 기준 좌표에서 반경(미터)을 모두 덮는 사각형. 위도 1도 ≈ 111.32km, 경도는 위도에 따라 줄어든다 */
export function boundsAround(origin: LatLng, radiusMeters: number): Bounds {
  const dLat = radiusMeters / 111_320;
  const dLon = radiusMeters / (111_320 * Math.cos(toRadians(origin.lat)));
  return {
    minLat: origin.lat - dLat,
    maxLat: origin.lat + dLat,
    minLon: origin.lng - dLon,
    maxLon: origin.lng + dLon,
  };
}

export const walkingMinutes = (meters: number): number => Math.max(1, Math.ceil(meters / WALKING_METERS_PER_MINUTE));

/** 900m 이하는 "850m", 그 이상은 "1.2km" */
export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`;
}

export interface NearbyItem {
  item: InfrastructureItem;
  /** 매물에서의 직선거리 (미터) */
  distance: number;
}

export interface NearbyGroup {
  type: InfraType;
  /** 반경 안의 시설 중 가까운 순 상위 NEARBY_LIMIT개 */
  nearest: NearbyItem[];
  /** 반경 안의 전체 시설 수 (같은 이름은 하나로 센다) */
  total: number;
  radius: number;
}

/**
 * 영역 조회 결과를 카테고리별로 묶는다.
 * - 카테고리마다 정해진 반경 안의 시설만 남긴다
 * - 같은 이름(예: 양방향 버스 정류장, 같은 역의 여러 출구)은 가장 가까운 하나만 쓴다
 * - 시설이 하나도 없는 카테고리도 빠뜨리지 않고 돌려준다 ("반경 안에 없음"을 보여주기 위해)
 */
export function groupNearby(items: InfrastructureItem[], origin: LatLng): NearbyGroup[] {
  return INFRA_ORDER.map((type) => {
    const radius = INFRA_RADIUS_METERS[type];
    const byName = new Map<string, NearbyItem>();

    for (const item of items) {
      if (item.infraType !== type) continue;
      const distance = distanceMeters(origin, { lat: item.lat, lng: item.lon });
      if (distance > radius) continue;
      const existing = byName.get(item.name);
      if (!existing || distance < existing.distance) byName.set(item.name, { item, distance });
    }

    const sorted = [...byName.values()].sort((a, b) => a.distance - b.distance);
    return { type, nearest: sorted.slice(0, NEARBY_LIMIT), total: sorted.length, radius };
  });
}
