import { useEffect, useMemo, useRef, useState } from 'react';
import { useKakaoMap } from '../../../hooks/useKakaoMap';
import {
  AiEvaluation,
  NearbyFacilities,
  NearbyFacility,
  NearbyFacilityType,
  PROPERTY_DIRECTION_LABEL,
  PropertyDirection,
} from '../../../types/property';

interface Props {
  evaluation: AiEvaluation | null;
  facilities: NearbyFacilities | null;
  direction: PropertyDirection | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const FACILITY_META: Record<NearbyFacilityType, { label: string; icon: string; color: string }> = {
  SUBWAY: { label: '지하철', icon: '🚇', color: '#2563eb' },
  BUS_STOP: { label: '버스', icon: '🚌', color: '#0891b2' },
  SCHOOL: { label: '학교', icon: '🏫', color: '#7c3aed' },
  HOSPITAL: { label: '병원', icon: '🏥', color: '#dc2626' },
  CULTURE: { label: '문화', icon: '🎭', color: '#db2777' },
  PARK: { label: '공원', icon: '🌳', color: '#16a34a' },
  MART: { label: '마트', icon: '🛒', color: '#ea580c' },
};

const FILTERS: Array<{ type: NearbyFacilityType | 'ALL'; label: string }> = [
  { type: 'ALL', label: '전체' },
  ...Object.entries(FACILITY_META).map(([type, meta]) => ({
    type: type as NearbyFacilityType,
    label: meta.label,
  })),
];

export function getSunlightLayerStyle(score: number | null | undefined) {
  if (score === null || score === undefined) return { color: '#94a3b8', label: '데이터 부족' };
  if (score >= 4) return { color: '#16a34a', label: '우수' };
  if (score >= 3) return { color: '#eab308', label: '양호' };
  if (score >= 2) return { color: '#f97316', label: '보통' };
  return { color: '#dc2626', label: '낮음' };
}

export function filterFacilities(
  facilities: NearbyFacility[],
  selectedType: NearbyFacilityType | 'ALL',
) {
  return selectedType === 'ALL'
    ? facilities
    : facilities.filter((facility) => facility.type === selectedType);
}

const DIRECTION_BEARING: Partial<Record<PropertyDirection, number>> = {
  NORTH: 0,
  NORTHEAST: 45,
  EAST: 90,
  SOUTHEAST: 135,
  SOUTH: 180,
  SOUTHWEST: 225,
  WEST: 270,
  NORTHWEST: 315,
};

export function getDirectionBearing(direction: PropertyDirection | null) {
  return direction ? DIRECTION_BEARING[direction] ?? null : null;
}

export function createSunlightSectorCoordinates(
  latitude: number,
  longitude: number,
  bearing: number,
  radiusMeters = 350,
  spreadDegrees = 70,
) {
  const coordinates = [{ latitude, longitude }];
  const points = 10;
  for (let index = 0; index <= points; index += 1) {
    const angle = bearing - spreadDegrees / 2 + (spreadDegrees * index) / points;
    const radians = (angle * Math.PI) / 180;
    const latitudeOffset = (radiusMeters * Math.cos(radians)) / 111_320;
    const longitudeOffset = (radiusMeters * Math.sin(radians))
      / (111_320 * Math.cos((latitude * Math.PI) / 180));
    coordinates.push({ latitude: latitude + latitudeOffset, longitude: longitude + longitudeOffset });
  }
  return coordinates;
}

function createMarkerContent(
  facility: NearbyFacility,
  onSelect: (facility: NearbyFacility) => void,
) {
  const meta = FACILITY_META[facility.type];
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'grid h-9 w-9 place-items-center rounded-full border-2 bg-white text-base shadow-md';
  button.style.borderColor = meta.color;
  button.textContent = meta.icon;
  button.title = `${meta.label} ${facility.name}, ${facility.distanceMeters.toLocaleString()}m`;
  button.setAttribute('aria-label', button.title);
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    onSelect(facility);
  });
  return button;
}

function createPropertyMarker() {
  const marker = document.createElement('div');
  marker.className = 'grid h-11 w-11 place-items-center rounded-full border-2 border-primary bg-white text-xl shadow-lg';
  marker.textContent = '🏠';
  marker.title = '선택한 매물';
  marker.setAttribute('aria-label', '선택한 매물 위치');
  return marker;
}

function AiInfrastructureMap({ evaluation, facilities, direction, loading, error, onRetry }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { map, error: mapError } = useKakaoMap(containerRef);
  const overlaysRef = useRef<kakao.maps.CustomOverlay[]>([]);
  const sunlightPolygonRef = useRef<kakao.maps.Polygon | null>(null);
  const [selectedType, setSelectedType] = useState<NearbyFacilityType | 'ALL'>('ALL');
  const [selectedFacility, setSelectedFacility] = useState<NearbyFacility | null>(null);
  const [showSunlight, setShowSunlight] = useState(true);

  const sunlightScore = evaluation?.categories?.find((category) => category.key === 'SUNLIGHT')?.displayScore;
  const sunlightStyle = getSunlightLayerStyle(sunlightScore);
  const directionBearing = getDirectionBearing(direction);
  const visibleFacilities = useMemo(
    () => filterFacilities(facilities?.facilities ?? [], selectedType),
    [facilities, selectedType],
  );

  useEffect(() => {
    if (!map || !facilities) return;
    const maps = window.kakao.maps;
    const center = new maps.LatLng(facilities.center.latitude, facilities.center.longitude);
    map.setCenter(center);
    map.setLevel(5);

    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];

    const propertyOverlay = new maps.CustomOverlay({
      position: center,
      content: createPropertyMarker(),
      xAnchor: 0.5,
      yAnchor: 0.5,
      zIndex: 10,
    });
    propertyOverlay.setMap(map);
    overlaysRef.current.push(propertyOverlay);

    visibleFacilities.forEach((facility) => {
      const overlay = new maps.CustomOverlay({
        position: new maps.LatLng(facility.latitude, facility.longitude),
        content: createMarkerContent(facility, setSelectedFacility),
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: 5,
        clickable: true,
      });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);
    });

    return () => {
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];
    };
  }, [facilities, map, visibleFacilities]);

  useEffect(() => {
    if (!map || !facilities) return;
    sunlightPolygonRef.current?.setMap(null);
    sunlightPolygonRef.current = null;
    if (!showSunlight || directionBearing === null) return;

    const path = createSunlightSectorCoordinates(
      facilities.center.latitude,
      facilities.center.longitude,
      directionBearing,
    ).map(({ latitude, longitude }) => new window.kakao.maps.LatLng(latitude, longitude));
    const polygon = new window.kakao.maps.Polygon({
      path,
      strokeWeight: 1,
      strokeColor: sunlightStyle.color,
      strokeOpacity: 0.65,
      fillColor: sunlightStyle.color,
      fillOpacity: 0.18,
      zIndex: 1,
    });
    polygon.setMap(map);
    sunlightPolygonRef.current = polygon;

    return () => {
      polygon.setMap(null);
      if (sunlightPolygonRef.current === polygon) sunlightPolygonRef.current = null;
    };
  }, [directionBearing, facilities, map, showSunlight, sunlightStyle.color]);

  return (
    <section className="mb-8 overflow-hidden rounded-card border border-gray-200 bg-white">
      <div className="border-b border-gray-100 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">주변 인프라 지도</h2>
            <p className="mt-1 text-sm text-gray-500">평가에 활용된 주변 생활 시설을 위치와 거리로 확인해 보세요.</p>
          </div>
          <label className={`flex items-center gap-2 text-sm font-semibold ${
            directionBearing === null ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer text-gray-700'
          }`}>
            <input
              type="checkbox"
              checked={showSunlight}
              disabled={directionBearing === null}
              onChange={(event) => setShowSunlight(event.target.checked)}
              className="accent-primary"
            />
            {directionBearing === null ? '일조 방향 정보 없음' : '일조 방향 레이어'}
          </label>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="시설 유형 필터">
          {FILTERS.map((filter) => (
            <button
              key={filter.type}
              type="button"
              aria-pressed={selectedType === filter.type}
              onClick={() => {
                setSelectedType(filter.type);
                setSelectedFacility(null);
              }}
              className={`shrink-0 rounded-pill px-3 py-1.5 text-xs font-semibold transition ${
                selectedType === filter.type
                  ? 'bg-primary text-white'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[420px] bg-gray-100">
        <div ref={containerRef} className="h-full w-full" />
        {loading && (
          <div className="absolute inset-0 grid place-items-center bg-white/75 text-sm text-gray-500">
            주변 시설을 불러오는 중...
          </div>
        )}
        {(error || mapError) && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-50 p-6 text-center">
            <p className="text-sm font-semibold text-gray-900">지도를 불러오지 못했습니다.</p>
            <p className="text-xs text-gray-500">{error ?? mapError}</p>
            {error ? (
              <button type="button" className="text-sm font-semibold text-primary underline" onClick={onRetry}>
                다시 시도
              </button>
            ) : (
              <p className="text-xs text-gray-500">페이지를 새로 고침해 주세요.</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3 p-5">
        {!loading && !error && facilities && visibleFacilities.length === 0 && (
          <p className="rounded-button bg-gray-50 p-3 text-sm text-gray-500">
            선택한 유형의 주변 시설 정보가 없습니다.
          </p>
        )}
        {selectedFacility && (
          <div className="rounded-button bg-gray-50 p-3 text-sm">
            <div className="flex items-center gap-2">
              <span aria-hidden="true">{FACILITY_META[selectedFacility.type].icon}</span>
              <strong className="text-gray-900">{selectedFacility.name}</strong>
              <span className="ml-auto text-gray-500">{selectedFacility.distanceMeters.toLocaleString()}m</span>
            </div>
            {selectedFacility.address && <p className="mt-1 text-xs text-gray-500">{selectedFacility.address}</p>}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
          {Object.entries(FACILITY_META).map(([type, meta]) => (
            <span key={type} className="flex items-center gap-1"><span aria-hidden="true">{meta.icon}</span>{meta.label}</span>
          ))}
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: sunlightStyle.color }} />
            일조 {sunlightStyle.label}{sunlightScore != null ? ` (${sunlightScore.toFixed(1)}/5)` : ''}
            {direction && direction !== 'UNKNOWN' ? ` · ${PROPERTY_DIRECTION_LABEL[direction]}` : ''}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-gray-400">
          {directionBearing === null
            ? '매물 방향 정보가 없어 일조 방향 레이어는 표시하지 않습니다. 점수는 등록된 평가 정보만 보여줍니다.'
            : '부채꼴은 매물의 주실 방향을 나타내며, 색상은 방향과 층수를 기반으로 한 상대 평가입니다. 실제 주변 건물의 그림자나 시간대별 일조를 시뮬레이션한 결과가 아닙니다.'}
        </p>
      </div>
    </section>
  );
}

export default AiInfrastructureMap;
