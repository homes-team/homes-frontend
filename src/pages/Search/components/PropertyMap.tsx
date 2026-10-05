import { useEffect, useRef } from 'react';
import { MapBounds } from '../../../api/property/propertyApi';
import { useKakaoMap } from '../../../hooks/useKakaoMap';
import { PropertyListItem } from '../../../types/property';
import { formatPrice } from '../../../utils/format';

interface PropertyMapProps {
  items: PropertyListItem[];
  selectedId: number | null;
  onSelectProperty: (propertyId: number) => void;
  onOpenProperty: (propertyId: number) => void;
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
const PREVIEW_CARD =
  'flex w-[320px] max-w-[calc(100vw-32px)] cursor-pointer items-center gap-4 overflow-hidden rounded-card border border-primary-100 bg-white p-3.5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.26)] focus-visible:outline-2 focus-visible:outline-primary';

/**
 * 카카오 CustomOverlay에 삽입할 DOM을 만든다.
 * 첫 클릭 전에는 가격 마커, 선택 후에는 상세 이동이 가능한 미리보기 카드가 된다.
 */
export function createPropertyOverlayContent(
  item: PropertyListItem,
  isSelected: boolean,
  onSelect: (propertyId: number) => void,
  onOpen: (propertyId: number) => void,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';

  if (!isSelected) {
    button.className = MARKER_BASE;
    button.textContent = formatPrice(item);
    button.setAttribute('aria-label', `${item.title} 매물 선택`);
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      onSelect(item.propertyId);
    });
    return button;
  }

  button.className = PREVIEW_CARD;
  button.setAttribute('aria-label', `${item.title} 상세보기`);

  const thumbnail = document.createElement('div');
  thumbnail.className = 'relative h-[92px] w-[112px] shrink-0 overflow-hidden rounded-button bg-gray-100';
  if (item.thumbnailUrl) {
    const image = document.createElement('img');
    image.src = item.thumbnailUrl;
    image.alt = `${item.title} 매물 사진`;
    image.className = 'h-full w-full object-cover';
    thumbnail.appendChild(image);
  } else {
    const placeholder = document.createElement('span');
    placeholder.className = 'absolute inset-0 grid place-items-center text-xs text-gray-400';
    placeholder.textContent = '사진 준비 중';
    thumbnail.appendChild(placeholder);
  }

  const content = document.createElement('span');
  content.className = 'flex min-w-0 flex-1 flex-col gap-1.5';
  const price = document.createElement('strong');
  price.className = 'text-lg font-bold text-gray-900';
  price.textContent = formatPrice(item);
  const title = document.createElement('span');
  title.className = 'truncate text-[15px] font-semibold text-gray-900';
  title.textContent = item.title;
  const meta = document.createElement('span');
  meta.className = 'truncate text-[13px] text-gray-500';
  meta.textContent = `${item.currentFloor}/${item.totalFloors}층 · ${item.area}㎡`;
  const hint = document.createElement('span');
  hint.className = 'text-[13px] font-semibold text-primary';
  hint.textContent = '상세보기 →';
  content.append(price, title, meta, hint);
  button.append(thumbnail, content);
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    onOpen(item.propertyId);
  });
  return button;
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
  onOpenProperty,
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
  const onOpenRef = useRef(onOpenProperty);
  onOpenRef.current = onOpenProperty;

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

      const marker = createPropertyOverlayContent(
        item,
        isSelected,
        (propertyId) => onSelectRef.current(propertyId),
        (propertyId) => onOpenRef.current(propertyId),
      );

      const overlay = new maps.CustomOverlay({
        position: new maps.LatLng(item.latitude, item.longitude),
        content: marker,
        yAnchor: isSelected ? 1.08 : 1.15, // 미리보기 카드는 마커 좌표 위에 자연스럽게 배치한다
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
