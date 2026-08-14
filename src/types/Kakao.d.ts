/**
 * 카카오맵 JavaScript SDK 타입 선언.
 *
 * 공식 타입 패키지가 없어 실제로 쓰는 API만 최소한으로 선언했다.
 * 새 기능을 쓸 때마다 여기에 추가하면 된다.
 */
declare namespace kakao.maps {
  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }
 
  class LatLngBounds {
    constructor(sw?: LatLng, ne?: LatLng);
    getSouthWest(): LatLng;
    getNorthEast(): LatLng;
    extend(latlng: LatLng): void;
  }
 
  interface MapOptions {
    center: LatLng;
    /** 1(가장 확대) ~ 14. 기본 3 */
    level?: number;
  }
 
  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    getBounds(): LatLngBounds;
    getCenter(): LatLng;
    setCenter(latlng: LatLng): void;
    getLevel(): number;
    setLevel(level: number): void;
    panTo(latlng: LatLng): void;
    relayout(): void;
  }
 
  interface CustomOverlayOptions {
    position: LatLng;
    content: HTMLElement | string;
    map?: Map | null;
    /** 0: 아래 정렬(기본 말풍선), 1: 중앙 */
    yAnchor?: number;
    xAnchor?: number;
    zIndex?: number;
    clickable?: boolean;
  }
 
  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
    setPosition(position: LatLng): void;
    setZIndex(zIndex: number): void;
  }
 
  namespace event {
    function addListener(target: unknown, type: string, handler: () => void): void;
    function removeListener(target: unknown, type: string, handler: () => void): void;
  }
 
  /** libraries=services 로드 시 사용 가능 */
  namespace services {
    type Status = 'OK' | 'ZERO_RESULT' | 'ERROR';
    const Status: { OK: 'OK'; ZERO_RESULT: 'ZERO_RESULT'; ERROR: 'ERROR' };
 
    interface PlaceResult {
      id: string;
      place_name: string;
      address_name: string;
      road_address_name: string;
      category_group_code: string;
      category_group_name: string;
      x: string;
      y: string;
    }
 
    class Places {
      keywordSearch(
        keyword: string,
        callback: (result: PlaceResult[], status: Status) => void,
        options?: { size?: number; page?: number },
      ): void;
    }
 
    interface AddressResult {
      address_name: string;
      x: string;
      y: string;
    }
 
    class Geocoder {
      addressSearch(
        address: string,
        callback: (result: AddressResult[], status: Status) => void,
      ): void;
    }
  }
 
  function load(callback: () => void): void;
}
 
interface Window {
  kakao: {
    maps: typeof kakao.maps;
  };
}
 
