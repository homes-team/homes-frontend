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
 * RealtorSignupReqDto.java 대응 (application/json).
 * 서류 이미지는 미리 GET /properties/presigned-url로 S3에 업로드한 뒤 그 결과 URL을
 * businessCertUrl/agentCertUrl(필수)/profileImageUrl(선택)로 전달한다. S3 버킷 도메인이
 * 아닌 URL은 백엔드가 거부한다.
 */
export interface RealtorSignupRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  officeName: string;
  businessNum: string;
  officeAddress?: string;
  businessCertUrl: string;
  agentCertUrl: string;
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

/** OAuthLoginReqDto.java 대응 — 구글 로그인/자동가입 */
export interface OAuthLoginRequest {
  authorizationCode: string;
}

/** UserProfileResDto.java 대응 — GET /users/me */
export interface UserProfile {
  userId: number;
  email: string;
  name: string | null;
  nickname: string | null;
  phone: string | null;
  usagePurpose: string | null;
  isIdentityVerified: boolean;
  role: 'USER' | 'AGENT' | 'ADMIN';
}

/** UserUpdateProfileReqDto.java 대응 (부분 수정) */
export interface UserUpdateProfileRequest {
  nickname?: string;
  usagePurpose?: string;
}

/** UserUpdateProfileResDto.java 대응 */
export interface UserUpdateProfileResult {
  userId: number;
  nickname: string | null;
  usagePurpose: string | null;
}

/** UserUpdatePasswordReqDto.java 대응 */
export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
