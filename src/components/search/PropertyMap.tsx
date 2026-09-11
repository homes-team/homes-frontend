import { useEffect, useRef } from 'react';
import { MapBounds } from '../../api/propertyApi';
import { useKakaoMap } from '../../hooks/useKakaoMap';
import { PropertyListItem } from '../../types/property';
import { formatPrice } from '../../utils/format';
import styles from './PropertyMap.module.css';

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
      marker.className = `${styles.marker} ${isSelected ? styles.markerSelected : ''}`;
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
    <div className={styles.wrapper}>
      <div className={styles.map} ref={containerRef} />

      {error && (
        <div className={styles.error} role="alert">
          <p className={styles.errorTitle}>지도를 불러오지 못했습니다</p>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      )}

      {showResearch && !error && (
        <button type="button" className={styles.research} onClick={onResearch}>
          <span aria-hidden="true">↻</span> 이 지역에서 재검색
        </button>
      )}
    </div>
  );
}

export default PropertyMap;
