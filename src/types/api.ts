/** 백엔드 공통 응답 래퍼 (ApiResponse.java 대응) */
export interface ApiResponse<T> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T;
}
