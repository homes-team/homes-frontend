/** InfraType.java 대응 */
export type InfraType = 'SUBWAY' | 'BUS' | 'MART' | 'HOSPITAL' | 'PARK' | 'SCHOOL' | 'CULTURE';

/** InfrastructureResDto.java 대응 — GET /properties/infrastructure */
export interface InfrastructureItem {
  id: number;
  name: string;
  infraType: InfraType;
  lat: number;
  lon: number;
}

export const INFRA_TYPE_LABEL: Record<InfraType, string> = {
  SUBWAY: '지하철역',
  BUS: '버스 정류장',
  MART: '대형마트',
  HOSPITAL: '병원',
  PARK: '공원',
  SCHOOL: '학교',
  CULTURE: '문화시설',
};

export const INFRA_TYPE_ICON: Record<InfraType, string> = {
  SUBWAY: '🚇',
  BUS: '🚌',
  MART: '🛒',
  HOSPITAL: '🏥',
  PARK: '🌳',
  SCHOOL: '🏫',
  CULTURE: '🎭',
};

/** 화면에 보여주는 순서 — 임차인이 가장 먼저 보는 교통·생활 시설을 앞에 둔다 */
export const INFRA_ORDER: InfraType[] = ['SUBWAY', 'BUS', 'MART', 'HOSPITAL', 'SCHOOL', 'PARK', 'CULTURE'];

/** 카테고리별로 "가깝다"고 볼 반경 (미터). 버스 정류장은 촘촘해서 좁게, 마트·지하철은 넓게 잡는다 */
export const INFRA_RADIUS_METERS: Record<InfraType, number> = {
  SUBWAY: 1500,
  BUS: 500,
  MART: 1500,
  HOSPITAL: 1000,
  SCHOOL: 1000,
  PARK: 1000,
  CULTURE: 1500,
};
