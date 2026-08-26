/** UserLoginReqDto.java 대응 */
export interface LoginRequest {
  email: string;
  password: string;
}

/** TokenDto.java 대응 */
export interface TokenDto {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpirationTime: number; // ms
}

/** UserCreateReqDto.java 대응 */
export interface SignupRequest {
  email: string;
  password: string;
}

/** UserSignupResDto.java 대응 */
export interface SignupResult {
  userId: number;
  email: string;
  name: string | null;
}

/** IdentityVerificationResDto.java 대응 */
export interface IdentityVerificationResult {
  userId: number;
  isIdentityVerified: boolean;
  name: string | null;
}

/**
 * RealtorSignupReqDto.java 대응 (Presigned URL 방식 전환 버전).
 * 이미지는 프론트에서 S3에 직접 업로드한 뒤, 그 결과 URL만 문자열로 전송한다.
 * ⚠️ 백엔드가 아직 이 방식으로 전환 중이라 필드명은 잠정안입니다 —
 * 실제 RealtorSignupReqDto 필드명이 확정되면 이 인터페이스만 맞춰 고치면 됩니다.
 */
export interface RealtorSignupRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  officeName: string;
  businessNum: string;
  officeAddress?: string;
  officeLatitude?: number;
  officeLongitude?: number;
  businessCertImageUrl: string;
  agentCertImageUrl: string;
  profileImageUrl?: string;
}

/** RealtorSignupResDto.java 대응 */
export interface RealtorSignupResult {
  userId: number;
  agentId: number;
  email: string;
  officeName: string;
  isVerified: boolean;
}

/**
 * 이미지 업로드용 Presigned URL 발급 요청/응답.
 * ⚠️ 백엔드에 아직 없는 API라 잠정 스펙입니다 — 실제 엔드포인트 경로/필드명이
 * 확정되면 api/uploadApi.ts의 requestPresignedUploadUrl()만 맞춰 고치면 됩니다.
 */
export interface PresignedUploadRequest {
  /** 원본 파일명 (S3 키 생성에 참고용) */
  fileName: string;
  /** 파일 MIME 타입 (예: image/png) — Presigned URL 서명에 포함됨 */
  contentType: string;
  /** 업로드 대상 디렉터리/버킷 경로 구분 (예: 'agent-certs', 'agent-profiles') */
  directory: string;
}

export interface PresignedUploadResult {
  /** 프론트에서 PUT으로 직접 업로드할 S3 Presigned URL (짧은 시간만 유효) */
  uploadUrl: string;
  /** 업로드 완료 후 DB에 저장할 최종 공개 URL */
  fileUrl: string;
}
