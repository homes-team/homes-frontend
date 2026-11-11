import { render } from '@testing-library/react';
import { PropertyListItem } from '../../../types/property';
import PropertyMap, { createClusterOverlayContent, createPropertyOverlayContent } from './PropertyMap';

const fakeMap = vi.hoisted(() => ({
  getBounds: () => ({
    getSouthWest: () => ({ getLat: () => 1, getLng: () => 2 }),
    getNorthEast: () => ({ getLat: () => 3, getLng: () => 4 }),
  }),
  getLevel: () => 3,
  panTo: () => undefined,
  setLevel: () => undefined,
}));
vi.mock('../../../hooks/useKakaoMap', () => ({ useKakaoMap: () => ({ map: fakeMap, error: null }) }));
vi.mock('../../../api/property/propertyApi', () => ({ fetchPropertyClusters: vi.fn().mockResolvedValue([]) }));

const property: PropertyListItem = {
  propertyId: 21,
  thumbnailUrl: 'https://example.com/property.jpg',
  title: '방학동 벽산아파트',
  address: '서울특별시 도봉구 방학동',
  latitude: 37.6,
  longitude: 127.0,
  propertyType: 'APARTMENT',
  tradeType: 'SALE',
  deposit: 50000,
  monthlyRent: 0,
  maintenanceFee: 15,
  totalFloors: 15,
  currentFloor: 5,
  area: 63.38,
  description: '테스트 매물',
  createdAt: '2026-10-01T00:00:00',
  aiScore: null,
  options: [],
  nearestStation: '방학역',
  walkingTime: 15,
  favoriteCount: 0,
  isSuspicious: false,
  status: 'AVAILABLE',
};

describe('createPropertyOverlayContent', () => {
  it('selects an unselected price marker on the first click', () => {
    const onSelect = vi.fn();
    const onOpen = vi.fn();
    const marker = createPropertyOverlayContent(property, false, onSelect, onOpen);

    expect(marker).toHaveTextContent('매매 5억');
    expect(marker).toHaveAccessibleName('방학동 벽산아파트 매물 선택');
    marker.click();

    expect(onSelect).toHaveBeenCalledWith(21);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('shows a compact preview and opens details on the second click', () => {
    const onSelect = vi.fn();
    const onOpen = vi.fn();
    const preview = createPropertyOverlayContent(property, true, onSelect, onOpen);

    expect(preview).toHaveAccessibleName('방학동 벽산아파트 상세보기');
    expect(preview).toHaveTextContent('방학동 벽산아파트');
    expect(preview).toHaveTextContent('5/15층 · 63.38㎡');
    expect(preview).toHaveTextContent('상세보기 →');
    expect(preview.querySelector('img')).toHaveAttribute('src', property.thumbnailUrl);
    preview.click();

    expect(onOpen).toHaveBeenCalledWith(21);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows a placeholder when the property has no thumbnail', () => {
    const preview = createPropertyOverlayContent({ ...property, thumbnailUrl: null }, true, vi.fn(), vi.fn());
    expect(preview).toHaveTextContent('사진 준비 중');
    expect(preview.querySelector('img')).not.toBeInTheDocument();
  });
});

describe('createClusterOverlayContent', () => {
  it('shows the property count and zooms in on click', () => {
    const onClick = vi.fn();
    const cluster = createClusterOverlayContent({ lat: 37.6, lon: 127.0, count: 1234 }, onClick);

    expect(cluster).toHaveTextContent('1,234');
    expect(cluster).toHaveAccessibleName('매물 1234개, 확대해서 보기');
    cluster.click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('grows with the number of properties', () => {
    const small = createClusterOverlayContent({ lat: 0, lon: 0, count: 3 }, vi.fn());
    const large = createClusterOverlayContent({ lat: 0, lon: 0, count: 150 }, vi.fn());

    expect(small).toHaveClass('h-10');
    expect(large).toHaveClass('h-14');
  });
});

describe('PropertyMap empty-area click', () => {
  it('tells the page when the empty map is clicked, and stops listening on unmount', () => {
    const listeners = new Map<string, () => void>();
    const removed: string[] = [];
    (window as unknown as { kakao: unknown }).kakao = {
      maps: {
        event: {
          addListener: (_target: unknown, type: string, handler: () => void) => listeners.set(type, handler),
          removeListener: (_target: unknown, type: string) => removed.push(type),
        },
      },
    };
    const onMapClick = vi.fn();
    const { unmount } = render(
      <PropertyMap
        items={[]} selectedId={null} onSelectProperty={() => undefined} onOpenProperty={() => undefined}
        onBoundsChanged={() => undefined} showResearch={false} onResearch={() => undefined} moveTo={null}
        onMapClick={onMapClick}
      />,
    );

    listeners.get('click')?.();
    expect(onMapClick).toHaveBeenCalledTimes(1);

    unmount();
    expect(removed).toContain('click');
  });
});
