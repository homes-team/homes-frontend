/**
 * 구글 OAuth 2.0 Authorization Code 흐름의 시작점 URL을 만든다.
 * redirect_uri는 백엔드 application-local.yml의
 * spring.security.oauth2.client.registration.google.redirect-uri와 정확히 같아야 한다
 * (다르면 구글이 redirect_uri_mismatch로 거부한다) — 이 값은 또한 구글 클라우드
 * 콘솔의 "승인된 리디렉션 URI" 목록에도 등록되어 있어야 한다.
 */
export function getGoogleOAuthRedirectUri(): string {
  return `${window.location.origin}/oauth/google/callback`;
}

export function buildGoogleAuthUrl(): string {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleOAuthRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
