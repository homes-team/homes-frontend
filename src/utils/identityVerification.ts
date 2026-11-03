import * as PortOne from '@portone/browser-sdk/v2';

const STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID as string | undefined;
const CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY as string | undefined;

/** 모바일 등 팝업이 막히는 환경에서 포트원이 인증 후 되돌려 보내는 주소 */
export const IDENTITY_REDIRECT_PATH = '/mypage';

export type IdentityRedirectResult =
  | { status: 'success'; identityVerificationId: string }
  | { status: 'failure'; message: string }
  | null;

/**
 * 포트원 본인인증창을 띄우고, 인증이 끝나면 identityVerificationId를 돌려준다.
 * ID는 우리가 요청 시점에 만들어 넘기고(V2 방식), 백엔드(POST /users/me/verification)가 이 ID로 포트원에서 결과를 다시 조회한다.
 * 팝업을 쓰지 못하는 환경에서는 redirectUrl로 페이지가 이동하므로 null을 돌려준다 (결과는 parseIdentityRedirect로 읽는다).
 */
export async function requestIdentityVerification(): Promise<string | null> {
  if (!STORE_ID || !CHANNEL_KEY) {
    throw new Error('본인인증 설정이 아직 완료되지 않았어요. 관리자에게 문의해주세요.');
  }
  const identityVerificationId = `identity-verification-${crypto.randomUUID()}`;
  const response = await PortOne.requestIdentityVerification({
    storeId: STORE_ID,
    channelKey: CHANNEL_KEY,
    identityVerificationId,
    redirectUrl: `${window.location.origin}${IDENTITY_REDIRECT_PATH}`,
  });
  if (!response) return null;
  if (response.code != null) throw new Error(response.message ?? '본인인증에 실패했어요.');
  return response.identityVerificationId;
}

/** 리다이렉트로 돌아온 URL의 쿼리에서 인증 결과를 읽는다. 인증과 무관한 주소면 null */
export function parseIdentityRedirect(search: string): IdentityRedirectResult {
  const params = new URLSearchParams(search);
  const identityVerificationId = params.get('identityVerificationId');
  if (!identityVerificationId) return null;
  if (params.get('code')) return { status: 'failure', message: params.get('message') ?? '본인인증에 실패했어요.' };
  return { status: 'success', identityVerificationId };
}
