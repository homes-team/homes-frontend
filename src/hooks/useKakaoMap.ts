import { RefObject, useEffect, useState } from 'react';
import { loadKakaoMapSdk } from '../utils/KakaoLoader';

/** 강남역. 초기 진입 시 지도 중심 */
export const DEFAULT_CENTER = { lat: 37.4979, lng: 127.0276 };
export const DEFAULT_LEVEL = 5;

interface UseKakaoMapResult {
  map: kakao.maps.Map | null;
  error: string | null;
}

/**
 * 컨테이너에 카카오맵을 붙이고 인스턴스를 돌려준다.
 *
 * SDK 로드는 비동기라 첫 렌더에는 map이 null이다.
 * 지도를 쓰는 쪽에서는 map이 생긴 뒤에 동작하도록 의존성에 넣어야 한다.
 */
export function useKakaoMap(containerRef: RefObject<HTMLDivElement | null>): UseKakaoMapResult {
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadKakaoMapSdk()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;

        const instance = new maps.Map(containerRef.current, {
          center: new maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
          level: DEFAULT_LEVEL,
        });
        setMap(instance);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [containerRef]);

  return { map, error };
}
