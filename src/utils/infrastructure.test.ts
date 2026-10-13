import { InfrastructureItem } from '../types/infrastructure';
import {
  boundsAround,
  distanceMeters,
  formatDistance,
  groupNearby,
  NEARBY_LIMIT,
  walkingMinutes,
} from './infrastructure';

const origin = { lat: 37.55, lng: 127.17 };

/** 기준점에서 정북쪽으로 meters만큼 떨어진 좌표 (위도 1m = 약 1/111,195도) */
const northOf = (meters: number) => ({ lat: origin.lat + meters / 111_195, lon: origin.lng });

let nextId = 1;
function infra(name: string, infraType: InfrastructureItem['infraType'], meters: number): InfrastructureItem {
  return { id: nextId++, name, infraType, ...northOf(meters) };
}

describe('distanceMeters', () => {
  it('is zero for the same point and about 111km per degree of latitude', () => {
    expect(distanceMeters(origin, origin)).toBe(0);
    expect(distanceMeters({ lat: 37, lng: 127 }, { lat: 38, lng: 127 })).toBeCloseTo(111_195, -2);
  });

  it('shrinks east-west distances with latitude', () => {
    const oneDegreeEast = distanceMeters({ lat: 37, lng: 127 }, { lat: 37, lng: 128 });
    expect(oneDegreeEast).toBeCloseTo(111_195 * Math.cos((37 * Math.PI) / 180), -2);
  });
});

describe('boundsAround', () => {
  it('covers the radius in every direction', () => {
    const bounds = boundsAround(origin, 1500);
    const north = distanceMeters(origin, { lat: bounds.maxLat, lng: origin.lng });
    const east = distanceMeters(origin, { lat: origin.lat, lng: bounds.maxLon });

    expect(north).toBeCloseTo(1500, -1);
    expect(east).toBeCloseTo(1500, -1);
    expect(bounds.minLat).toBeLessThan(origin.lat);
    expect(bounds.minLon).toBeLessThan(origin.lng);
  });
});

describe('walkingMinutes / formatDistance', () => {
  it('rounds the walking time up at 80m per minute, at least one minute', () => {
    expect(walkingMinutes(80)).toBe(1);
    expect(walkingMinutes(81)).toBe(2);
    expect(walkingMinutes(400)).toBe(5);
    expect(walkingMinutes(5)).toBe(1);
  });

  it('shows meters below one kilometer and kilometers above', () => {
    expect(formatDistance(850.4)).toBe('850m');
    expect(formatDistance(999)).toBe('999m');
    expect(formatDistance(1234)).toBe('1.2km');
  });
});

describe('groupNearby', () => {
  it('returns every category in display order, even with no results', () => {
    const groups = groupNearby([], origin);
    expect(groups.map((group) => group.type)).toEqual(['SUBWAY', 'BUS', 'MART', 'HOSPITAL', 'SCHOOL', 'PARK', 'CULTURE']);
    expect(groups.every((group) => group.nearest.length === 0 && group.total === 0)).toBe(true);
  });

  it('sorts by distance and keeps only the nearest few', () => {
    const items = [
      infra('먼 공원', 'PARK', 900),
      infra('가까운 공원', 'PARK', 100),
      infra('중간 공원', 'PARK', 500),
      infra('다른 공원', 'PARK', 700),
    ];
    const park = groupNearby(items, origin).find((group) => group.type === 'PARK')!;

    expect(park.nearest.map(({ item }) => item.name)).toEqual(['가까운 공원', '중간 공원', '다른 공원']);
    expect(park.nearest).toHaveLength(NEARBY_LIMIT);
    expect(park.total).toBe(4);
  });

  it('drops facilities outside the category radius (bus stops are limited to 500m)', () => {
    const items = [infra('가까운 정류장', 'BUS', 300), infra('먼 정류장', 'BUS', 800), infra('먼 지하철', 'SUBWAY', 1400)];
    const groups = groupNearby(items, origin);

    expect(groups.find((group) => group.type === 'BUS')!.nearest.map(({ item }) => item.name)).toEqual(['가까운 정류장']);
    expect(groups.find((group) => group.type === 'SUBWAY')!.nearest).toHaveLength(1); // 지하철은 1.5km까지
  });

  it('counts facilities with the same name once, keeping the nearest', () => {
    const items = [infra('상일동역', 'BUS', 400), infra('상일동역', 'BUS', 120), infra('고덕역', 'BUS', 250)];
    const bus = groupNearby(items, origin).find((group) => group.type === 'BUS')!;

    expect(bus.total).toBe(2);
    expect(bus.nearest[0].item.name).toBe('상일동역');
    expect(bus.nearest[0].distance).toBeCloseTo(120, -1);
  });

  it('does not mix up categories', () => {
    const items = [infra('A마트', 'MART', 200), infra('A병원', 'HOSPITAL', 200)];
    const groups = groupNearby(items, origin);

    expect(groups.find((group) => group.type === 'MART')!.nearest.map(({ item }) => item.name)).toEqual(['A마트']);
    expect(groups.find((group) => group.type === 'HOSPITAL')!.nearest.map(({ item }) => item.name)).toEqual(['A병원']);
  });
});
