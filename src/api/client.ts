import { ApiResponse } from '../types/api';

const BASE_URL = (process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export const ACCESS_TOKEN_KEY = 'accessToken';

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
  signal?: AbortSignal;
}

function validateAuthenticatedUrl(url: string, headers: Record<string, string>): void {
  if (!headers.Authorization) return;

  let protocol: string;
  try {
    protocol = new URL(url, window.location.href).protocol;
  } catch {
    throw new ApiError('INSECURE_AUTH_URL', '인증 요청은 HTTPS 연결을 사용해야 합니다.');
  }

  if (protocol !== 'https:') {
    throw new ApiError('INSECURE_AUTH_URL', '인증 요청은 HTTPS 연결을 사용해야 합니다.');
  }
}

export async function apiGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (options.auth) {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const url = `${BASE_URL}${path}`;
  validateAuthenticatedUrl(url, headers);

  let response: Response;
  try {
    response = await fetch(url, { headers, signal: options.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('NETWORK_ERROR', '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.');
  }

  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json')
    ? ((await response.json()) as ApiResponse<T>)
    : null;

  if (!response.ok || !body?.isSuccess) {
    throw new ApiError(
      body?.code ?? String(response.status),
      body?.message ?? `요청에 실패했습니다. (${response.status})`,
    );
  }
  return body.result;
}

export async function apiPost<T>(
  path: string,
  data: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (options.auth) {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const url = `${BASE_URL}${path}`;
  validateAuthenticatedUrl(url, headers);

  let response: Response;
  let body: ApiResponse<T> | null;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      signal: options.signal,
    });

    const contentType = response.headers.get('content-type') ?? '';
    body = contentType.includes('application/json')
      ? ((await response.json()) as ApiResponse<T>)
      : null;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('NETWORK_ERROR', '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.');
  }

  if (!response.ok || !body?.isSuccess) {
    throw new ApiError(
      body?.code ?? String(response.status),
      body?.message ?? `요청에 실패했습니다. (${response.status})`,
    );
  }

  if (body.result === undefined) {
    throw new ApiError('INVALID_RESPONSE', '서버 응답 형식이 올바르지 않습니다.');
  }

  return body.result;
}

export function isLoggedIn(): boolean {
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
}
