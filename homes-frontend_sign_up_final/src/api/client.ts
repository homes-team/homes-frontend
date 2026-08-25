import { ApiResponse } from '../types/api';

const BASE_URL = process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:8080';

export const ACCESS_TOKEN_KEY = 'accessToken';

/**
 * 백엔드 에러 코드(UserErrorCode 등)를 그대로 보존하는 에러.
 * 화면에서 code로 분기해 안내 문구를 커스터마이즈할 때 사용한다.
 * 예: USER400_3(USER_NOT_FOUND), USER400_4(WRONG_PASSWORD)
 */
export class ApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

interface RequestOptions {
  /** true면 localStorage의 accessToken을 Authorization 헤더로 첨부 */
  auth?: boolean;
}

async function unwrap<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !body.isSuccess) {
    throw new ApiError(body.code ?? String(response.status), body.message ?? '요청에 실패했습니다.');
  }
  return body.result;
}

function buildHeaders(options: RequestOptions): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.auth) {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function apiGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, { headers: buildHeaders(options) });
  return unwrap<T>(response);
}

export async function apiPost<T>(path: string, body: unknown, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: buildHeaders(options),
    body: JSON.stringify(body),
  });
  return unwrap<T>(response);
}

/**
 * multipart/form-data 전송 전용. Content-Type을 직접 지정하지 않는다 —
 * 브라우저가 FormData의 boundary를 자동으로 채워야 하므로 수동 지정 시 오히려 깨진다.
 */
export async function apiPostForm<T>(path: string, formData: FormData, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.auth) {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  return unwrap<T>(response);
}

export function isLoggedIn(): boolean {
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
}
