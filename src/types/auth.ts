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
 * RealtorSignupReqDto.java 대응.
 * 백엔드가 실제로는 multipart/form-data로 받는다 — 텍스트 필드는 ModelAttribute 파트로,
 * 파일은 businessCertImage/agentCertImage(필수)/profileImage(선택) 파트로 함께 전송한다.
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
  businessCertImage: File;
  agentCertImage: File;
  profileImage?: File;
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
