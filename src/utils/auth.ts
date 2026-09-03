import { ACCESS_TOKEN_KEY } from '../api/client';
import { TokenDto } from '../types/auth';

export const REFRESH_TOKEN_KEY = 'refreshToken';

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
