import { PropertyListItem } from '../../../types/property';
import { createPropertyOverlayContent } from './PropertyMap';

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
