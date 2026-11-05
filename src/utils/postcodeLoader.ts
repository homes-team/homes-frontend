const SCRIPT_ID = 'kakao-postcode';
const SCRIPT_SRC = 'https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

/** 카카오(다음) 우편번호 서비스가 선택 결과로 넘겨주는 값 중 실제로 쓰는 것만 선언했다 */
export interface PostcodeResult {
  zonecode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
  userSelectedType: 'R' | 'J';
}

interface PostcodeOptions {
  oncomplete: (data: PostcodeResult) => void;
  width?: string;
  height?: string;
}

declare global {
  interface Window {
    daum?: { Postcode: new (options: PostcodeOptions) => { embed: (element: HTMLElement) => void } };
  }
}

let loadPromise: Promise<NonNullable<Window['daum']>> | null = null;

/** 우편번호 검색 스크립트를 필요한 시점에 한 번만 불러온다 (API 키 불필요) */
export function loadPostcodeScript(): Promise<NonNullable<Window['daum']>> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (window.daum?.Postcode) {
      resolve(window.daum);
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = SCRIPT_SRC;
    script.addEventListener('load', () => (window.daum ? resolve(window.daum) : reject(new Error('주소 검색을 불러오지 못했어요.'))));
    script.addEventListener('error', () => {
      loadPromise = null;
      script.remove();
      reject(new Error('주소 검색을 불러오지 못했어요. 네트워크를 확인해주세요.'));
    });
    document.head.appendChild(script);
  });

  return loadPromise;
}

/** 선택 결과에서 저장할 주소를 고른다. 표준 도로명 주소를 우선하고, 없으면 지번 주소를 쓴다 */
export function pickAddress(result: PostcodeResult): string {
  return result.roadAddress || result.jibunAddress || result.address;
}
