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
}

export async function apiGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (options.auth) {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { headers });
  } catch {
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

export function isLoggedIn(): boolean {
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
}
