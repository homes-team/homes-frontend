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
 * RealtorSignupReqDto.java 대응 (multipart 폼 필드 부분).
 * businessCertImage/agentCertImage/profileImage 파일은 FormData에 별도로 append한다.
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
}

/** RealtorSignupResDto.java 대응 */
export interface RealtorSignupResult {
  userId: number;
  agentId: number;
  email: string;
  officeName: string;
  isVerified: boolean;
}
