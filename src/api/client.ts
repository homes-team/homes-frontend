import axios, { AxiosRequestConfig } from 'axios';
import { ApiResponse } from '../types/api';

export const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');
export const WS_BASE_URL = (import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8080').replace(/\/$/, '');

export const ACCESS_TOKEN_KEY = 'accessToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';
export const AUTH_STATE_CHANGED_EVENT = 'homes:auth-state-changed';

/** 토큰이 갱신되거나 제거됐음을 현재 탭의 UI에 알린다. */
export function notifyAuthStateChanged(): void {
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
}

export class ApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

const http = axios.create({ baseURL: BASE_URL });

/**
 * accessToken이 만료돼 401이 났을 때 RefreshToken으로 1회 재발급을 시도한다.
 * 성공하면 새 accessToken을 반환, 실패하면 로그인 정보를 지우고 null을 반환한다.
 * (RefreshToken 헤더명은 Authorization이 아니라 커스텀 헤더 "RefreshToken" — UserController 참고)
 */
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    try {
      const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        `${BASE_URL}/users/refresh`,
        undefined,
        { headers: { RefreshToken: `Bearer ${refreshToken}` } },
      );
      if (!response.data.isSuccess) throw new Error('refresh failed');

      localStorage.setItem(ACCESS_TOKEN_KEY, response.data.result.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.data.result.refreshToken);
      notifyAuthStateChanged();
      return response.data.result.accessToken;
    } catch {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      notifyAuthStateChanged();
      return null;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

interface RequestOptions {
  /** true면 localStorage의 accessToken을 Authorization 헤더로 첨부 */
  auth?: boolean;
  /** 공개 API에서 저장된 토큰이 무효하면 비로그인 요청으로 한 번 복구 */
  allowAnonymousFallback?: boolean;
  signal?: AbortSignal;
}

async function request<T>(
  method: AxiosRequestConfig['method'],
  path: string,
  options: RequestOptions & { data?: unknown; isRetry?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.auth) {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await http.request<ApiResponse<T>>({
      method,
      url: path,
      data: options.data,
      headers,
      signal: options.signal,
    });

    if (!response.data.isSuccess) {
      throw new ApiError(response.data.code, response.data.message);
    }
    return response.data.result;
  } catch (error) {
    if (axios.isCancel(error) || (error instanceof DOMException && error.name === 'AbortError')) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      // accessToken 만료로 인한 401이면 재발급 후 원 요청을 1회만 재시도한다.
      if (error.response?.status === 401 && options.auth && !options.isRetry) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return request<T>(method, path, { ...options, isRetry: true });
        }
        if (options.allowAnonymousFallback) {
          return request<T>(method, path, {
            ...options,
            auth: false,
            allowAnonymousFallback: false,
            isRetry: true,
          });
        }
      }

      const body = error.response?.data as ApiResponse<T> | undefined;
      throw new ApiError(
        body?.code ?? String(error.response?.status ?? 'NETWORK_ERROR'),
        body?.message ?? (error.response ? `요청에 실패했습니다. (${error.response.status})` : '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.'),
      );
    }

    throw error;
  }
}

/**
 * API에 GET 요청을 보냅니다.
 *
 * @template T - 응답 데이터의 타입
 * @param path - API 엔드포인트 경로 (예: '/api/users')
 * @param options - 요청 옵션 (인증, AbortSignal 등)
 * @returns API 응답의 result 필드
 * @throws {ApiError} 네트워크 오류 또는 API 오류 발생 시
 */
export function apiGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>('GET', path, options);
}

/** API에 POST 요청을 보냅니다. */
export function apiPost<T>(path: string, data: unknown, options: RequestOptions = {}): Promise<T> {
  return request<T>('POST', path, { ...options, data });
}

/** API에 PATCH 요청을 보냅니다 (JSON 바디). */
export function apiPatch<T>(path: string, data: unknown, options: RequestOptions = {}): Promise<T> {
  return request<T>('PATCH', path, { ...options, data });
}

/** API에 DELETE 요청을 보냅니다. */
export function apiDelete<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>('DELETE', path, options);
}

/** multipart/form-data POST 요청 (파일 업로드가 포함된 생성 요청용). */
export function apiPostMultipart<T>(path: string, form: FormData, options: RequestOptions = {}): Promise<T> {
  return request<T>('POST', path, { ...options, data: form });
}

/** multipart/form-data PATCH 요청 (파일 교체가 포함된 수정 요청용). */
export function apiPatchMultipart<T>(path: string, form: FormData, options: RequestOptions = {}): Promise<T> {
  return request<T>('PATCH', path, { ...options, data: form });
}

/**
 * 사용자의 로그인 여부를 확인합니다.
 * localStorage에 저장된 액세스 토큰의 존재 여부로 판단합니다.
 *
 * @returns 로그인 상태 (true: 로그인됨, false: 로그인되지 않음)
 */
export function isLoggedIn(): boolean {
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
}
