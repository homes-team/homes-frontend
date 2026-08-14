const KAKAO_APP_KEY = process.env.REACT_APP_KAKAO_MAP_KEY;
const SCRIPT_ID = 'kakao-maps-sdk';

let loadPromise: Promise<typeof kakao.maps> | null = null;

/**
 * 카카오맵 SDK를 동적으로 로드한다.
 *
 * index.html에 스크립트를 박지 않고 필요한 시점에만 불러온다.
 * 홈 화면에서는 지도를 쓰지 않으므로 초기 로딩에 SDK 비용을 얹지 않기 위함이다.
 *
 * 여러 컴포넌트가 동시에 호출해도 실제 로드는 한 번만 일어난다.
 */
export function loadKakaoMapSdk(): Promise<typeof kakao.maps> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (!KAKAO_APP_KEY) {
      reject(
        new Error(
          '카카오맵 키가 없습니다. .env에 REACT_APP_KAKAO_MAP_KEY를 설정한 뒤 개발 서버를 재시작해 주세요.',
        ),
      );
      return;
    }

    // 이미 로드된 경우 (HMR 등)
    if (window.kakao?.maps?.Map) {
      resolve(window.kakao.maps);
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement('script');

    const handleLoad = () => {
      // autoload=false이므로 load()를 직접 호출해야 maps 객체가 완성된다
      window.kakao.maps.load(() => resolve(window.kakao.maps));
    };

    const handleError = () => {
      loadPromise = null;
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      reject(new Error('카카오맵 SDK를 불러오지 못했습니다. 네트워크와 도메인 등록을 확인해 주세요.'));
    };

    script.addEventListener('error', handleError);

    if (existing) {
      if (window.kakao?.maps) {
        handleLoad();
      } else {
        script.addEventListener('load', handleLoad);
      }
      return;
    }

    script.id = SCRIPT_ID;
    script.async = true;
    script.src =
      `https://dapi.kakao.com/v2/maps/sdk.js` +
      `?appkey=${KAKAO_APP_KEY}&autoload=false&libraries=services`;
    script.addEventListener('load', handleLoad);

    document.head.appendChild(script);
  });

  return loadPromise;
}