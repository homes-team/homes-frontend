import { ApiResponse } from "../types/api";

const BASE_URL = (
  process.env.REACT_APP_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/$/, "");

export const ACCESS_TOKEN_KEY = "accessToken";

export class ApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

interface RequestOptions {
  /** true면 localStorage의 accessToken을 Authorization 헤더로 첨부 */
  auth?: boolean;
  signal?: AbortSignal;
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
export async function apiGet<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };

  if (options.auth) {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers,
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiError(
      "NETWORK_ERROR",
      "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
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

/**
 * API에 POST 요청을 보냅니다.
 *
 * @template T - 응답 데이터의 타입
 * @param path - API 엔드포인트 경로 (예: '/api/users')
 * @param data - 요청 본문에 포함할 데이터
 * @param options - 요청 옵션 (인증, AbortSignal 등)
 * @returns API 응답의 result 필드
 * @throws {ApiError} 네트워크 오류 또는 API 오류 발생 시
 */
export async function apiPost<T>(
  path: string,
  data: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (options.auth) {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiError(
      "NETWORK_ERROR",
      "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
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

/**
 * 사용자의 로그인 여부를 확인합니다.
 * localStorage에 저장된 액세스 토큰의 존재 여부로 판단합니다.
 *
 * @returns 로그인 상태 (true: 로그인됨, false: 로그인되지 않음)
 */
export function isLoggedIn(): boolean {
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
}
