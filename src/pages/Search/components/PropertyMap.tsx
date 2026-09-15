import { useEffect, useRef } from 'react';
import { MapBounds } from '../../../api/property/propertyApi';
import { useKakaoMap } from '../../../hooks/useKakaoMap';
import { PropertyListItem } from '../../../types/property';
import { formatPrice } from '../../../utils/format';

interface PropertyMapProps {
  items: PropertyListItem[];
  selectedId: number | null;
  onSelectProperty: (propertyId: number) => void;
  /** 지도 이동이 멈췄을 때. 초기 렌더 직후에도 한 번 호출된다. */
  onBoundsChanged: (bounds: MapBounds, isInitial: boolean) => void;
  /** 지도를 움직여 현재 결과와 영역이 어긋난 상태 */
  showResearch: boolean;
  onResearch: () => void;
  /** 검색어 선택 시 이동할 좌표 */
  moveTo: { lat: number; lng: number } | null;
}

/**
 * 마커는 CustomOverlay content로 넘기는 실제 DOM 요소라 React 트리 밖에 있지만,
 * Tailwind는 소스 텍스트를 정적으로 스캔해서 클래스를 생성하기 때문에 문자열로
 * 직접 대입해도 문제없이 동작한다.
 */
const MARKER_BASE =
  'cursor-pointer rounded-pill border-[1.5px] border-primary bg-white px-3.5 py-[7px] text-[13px] font-bold whitespace-nowrap text-primary shadow-[0_2px_8px_rgba(0,0,0,0.16)] hover:bg-primary-50';
const MARKER_SELECTED =
  'scale-105 cursor-pointer rounded-pill border-[1.5px] border-primary bg-primary px-3.5 py-[7px] text-[13px] font-bold whitespace-nowrap text-white shadow-[0_2px_8px_rgba(0,0,0,0.16)] hover:bg-primary-dark';

function readBounds(map: kakao.maps.Map): MapBounds {
  const bounds = map.getBounds();
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  return {
    swLat: sw.getLat(),
    swLng: sw.getLng(),
    neLat: ne.getLat(),
    neLng: ne.getLng(),
  };
}

function PropertyMap({
  items,
  selectedId,
  onSelectProperty,
  onBoundsChanged,
  showResearch,
  onResearch,
  moveTo,
}: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { map, error } = useKakaoMap(containerRef);
  const overlaysRef = useRef<kakao.maps.CustomOverlay[]>([]);

  /* 콜백을 ref로 들고 있어야 리스너를 매번 재등록하지 않는다 */
  const onBoundsChangedRef = useRef(onBoundsChanged);
  onBoundsChangedRef.current = onBoundsChanged;
  const onSelectRef = useRef(onSelectProperty);
  onSelectRef.current = onSelectProperty;

  /* 지도 idle 이벤트 → 영역 변경 알림 */
  useEffect(() => {
    if (!map) return;

    // 최초 1회는 초기 검색 트리거용
    onBoundsChangedRef.current(readBounds(map), true);

    const handleIdle = () => onBoundsChangedRef.current(readBounds(map), false);
    window.kakao.maps.event.addListener(map, 'idle', handleIdle);

    return () => window.kakao.maps.event.removeListener(map, 'idle', handleIdle);
  }, [map]);

  /* 검색어로 선택한 장소로 이동 */
  useEffect(() => {
    if (!map || !moveTo) return;
    map.panTo(new window.kakao.maps.LatLng(moveTo.lat, moveTo.lng));
  }, [map, moveTo]);

  /* 매물 목록이 바뀌면 마커 다시 그리기 */
  useEffect(() => {
    if (!map) return;
    const maps = window.kakao.maps;

    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];

    items.forEach((item) => {
      const isSelected = item.propertyId === selectedId;

      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = isSelected ? MARKER_SELECTED : MARKER_BASE;
      marker.textContent = formatPrice(item);
      marker.addEventListener('click', () => onSelectRef.current(item.propertyId));

      const overlay = new maps.CustomOverlay({
        position: new maps.LatLng(item.latitude, item.longitude),
        content: marker,
        yAnchor: 1.15, // 말풍선 꼬리가 좌표를 가리키도록 위로 띄운다
        zIndex: isSelected ? 10 : 1,
        clickable: true,
      });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);
    });

    return () => {
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];
    };
  }, [map, items, selectedId]);

  /* 리스트에서 선택하면 해당 마커로 지도 이동 */
  useEffect(() => {
    if (!map || selectedId === null) return;
    const target = items.find((item) => item.propertyId === selectedId);
    if (!target) return;
    map.panTo(new window.kakao.maps.LatLng(target.latitude, target.longitude));
  }, [map, selectedId, items]);

  return (
    <div className="relative min-w-0 flex-1 bg-gray-100">
      <div className="h-full w-full" ref={containerRef} />

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-100 p-6 text-center">
          <p className="text-[15px] font-bold text-gray-900">지도를 불러오지 못했습니다</p>
          <p className="max-w-[360px] text-[13px] leading-relaxed text-gray-500">{error}</p>
        </div>
      )}

      {showResearch && !error && (
        <button
          type="button"
          className="absolute top-5 left-1/2 z-[5] flex -translate-x-1/2 items-center gap-1.5 rounded-pill border border-gray-200 bg-white px-4.5 py-2.5 text-[13px] font-bold text-gray-900 shadow-[0_2px_10px_rgba(0,0,0,0.12)] hover:bg-gray-50"
          onClick={onResearch}
        >
          <span className="text-primary" aria-hidden="true">
            ↻
          </span>{' '}
          이 지역에서 재검색
        </button>
      )}
    </div>
  );
}

export default PropertyMap;
