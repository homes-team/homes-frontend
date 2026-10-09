import { NearbyFacility } from '../../../types/property';
import {
  createSunlightSectorCoordinates,
  filterFacilities,
  getDirectionBearing,
  getSunlightLayerStyle,
} from './AiInfrastructureMap';

const facilities: NearbyFacility[] = [
  {
    id: 'subway-1',
    type: 'SUBWAY',
    name: '테스트역',
    latitude: 37.5,
    longitude: 127,
    distanceMeters: 300,
    address: null,
    source: 'NATIONWIDE_TRANSPORT_POI',
  },
  {
    id: 'park-1',
    type: 'PARK',
    name: '테스트공원',
    latitude: 37.51,
    longitude: 127.01,
    distanceMeters: 500,
    address: '서울시 테스트구',
    source: 'KAKAO_LOCAL',
  },
];

describe('AI 인프라 지도 도우미', () => {
  it('일조 점수를 단계별 색상과 문구로 변환한다', () => {
    expect(getSunlightLayerStyle(4.2)).toEqual({ color: '#16a34a', label: '우수' });
    expect(getSunlightLayerStyle(3)).toEqual({ color: '#eab308', label: '양호' });
    expect(getSunlightLayerStyle(2.5)).toEqual({ color: '#f97316', label: '보통' });
    expect(getSunlightLayerStyle(1.5)).toEqual({ color: '#dc2626', label: '낮음' });
    expect(getSunlightLayerStyle(null)).toEqual({ color: '#94a3b8', label: '데이터 부족' });
  });

  it('선택한 시설 유형만 반환하고 전체 선택은 원본을 유지한다', () => {
    expect(filterFacilities(facilities, 'PARK')).toEqual([facilities[1]]);
    expect(filterFacilities(facilities, 'ALL')).toEqual(facilities);
  });

  it('매물 방향을 지도 방위각으로 변환한다', () => {
    expect(getDirectionBearing('NORTH')).toBe(0);
    expect(getDirectionBearing('SOUTHEAST')).toBe(135);
    expect(getDirectionBearing('WEST')).toBe(270);
    expect(getDirectionBearing('UNKNOWN')).toBeNull();
    expect(getDirectionBearing(null)).toBeNull();
  });

  it('매물 위치에서 해당 방향을 향하는 부채꼴 좌표를 만든다', () => {
    const south = createSunlightSectorCoordinates(37.5, 127, 180);
    expect(south).toHaveLength(12);
    expect(south[0]).toEqual({ latitude: 37.5, longitude: 127 });
    expect(south[6].latitude).toBeLessThan(37.5);
  });
});
