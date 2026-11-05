import { ACCESS_TOKEN_KEY, notifyAuthStateChanged, REFRESH_TOKEN_KEY } from '../api/client';
import { TokenDto } from '../types/auth';

export { REFRESH_TOKEN_KEY };

const LOGIN_METHOD_KEY = 'loginMethod';

export type LoginMethod = 'PASSWORD' | 'GOOGLE';

/**
 * 로그인 성공 시 토큰 세트 저장.
 * 어떤 방식으로 로그인했는지도 함께 기억해 둔다 — 구글 로그인 계정은 비밀번호를 알 수 없어서
 * 비밀번호 변경 같은 화면을 숨기는 데 쓴다.
 */
export function saveTokens(token: TokenDto, method: LoginMethod = 'PASSWORD'): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, token.refreshToken);
  try {
    localStorage.setItem(LOGIN_METHOD_KEY, method);
  } catch {
    // 저장이 막힌 환경에서는 기본 동작(비밀번호 로그인으로 간주)을 따른다
  }
  notifyAuthStateChanged();
}

/** 이번 로그인이 구글 계정으로 한 것인지 */
export function isGoogleLogin(): boolean {
  try {
    return localStorage.getItem(LOGIN_METHOD_KEY) === 'GOOGLE';
  } catch {
    return false;
  }
}

/** 로그아웃 시 토큰 제거 */
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(LOGIN_METHOD_KEY);
  notifyAuthStateChanged();
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
