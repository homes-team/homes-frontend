import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../api/client';
import { TokenDto } from '../types/auth';

export { REFRESH_TOKEN_KEY };

/** 로그인 성공 시 토큰 세트 저장 */
export function saveTokens(token: TokenDto): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, token.refreshToken);
}

/** 로그아웃 시 토큰 제거 */
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/** JwtTokenProvider가 accessToken에 심는 클레임 (sub=userId, email, role) */
export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: 'USER' | 'AGENT' | 'ADMIN';
  exp: number;
}

/** accessToken(JWT)의 payload를 디코딩한다. 서명 검증은 하지 않음(프론트 표시용). */
export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payload = token.split('.')[1];
    const json = decodeURIComponent(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json) as AccessTokenPayload;
  } catch {
    return null;
  }
}

/** 현재 로그인한 사용자의 클레임. 비로그인/만료 시 null. */
export function getCurrentUser(): AccessTokenPayload | null {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return null;
  return decodeAccessToken(token);
}
