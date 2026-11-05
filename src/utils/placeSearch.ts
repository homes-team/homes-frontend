import type { PlaceSuggestion } from '../pages/Search/components/SearchBar';
import { loadKakaoMapSdk } from './KakaoLoader';

/**
 * 검색어에 가장 잘 맞는 장소(지하철역, 동네, 단지 등)를 카카오 장소 검색으로 찾는다.
 * 찾지 못하면 null — 이 경우 검색어는 주소·제목 글자 검색으로만 쓴다.
 */
export async function findPlace(keyword: string): Promise<PlaceSuggestion | null> {
  const maps = await loadKakaoMapSdk();

  return new Promise((resolve) => {
    new maps.services.Places().keywordSearch(
      keyword,
      (result, status) => {
        const place = status === maps.services.Status.OK ? result[0] : undefined;
        resolve(
          place
            ? {
                id: place.id,
                name: place.place_name,
                address: place.road_address_name || place.address_name,
                lat: Number(place.y),
                lng: Number(place.x),
              }
            : null,
        );
      },
      { size: 1 },
    );
  });
}
