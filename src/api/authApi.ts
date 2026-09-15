import {
  IdentityVerificationResult,
  LoginRequest,
  OAuthLoginRequest,
  RealtorSignupRequest,
  RealtorSignupResult,
  SignupRequest,
  SignupResult,
  TokenDto,
} from '../types/auth';
import { apiPost, apiPostMultipart } from './client';

/** 이메일/비밀번호 로그인 — POST /users/login */
export function login(request: LoginRequest): Promise<TokenDto> {
  return apiPost<TokenDto>('/users/login', request);
}

/** 로그아웃 — POST /users/logout (Redis에 저장된 refreshToken 무효화) */
export function logout(): Promise<void> {
  return apiPost<void>('/users/logout', {}, { auth: true });
}

/** 구글 OAuth 로그인/자동가입 — POST /users/oauth/google */
export function loginWithGoogle(request: OAuthLoginRequest): Promise<TokenDto> {
  return apiPost<TokenDto>('/users/oauth/google', request);
}

/** 이메일 중복 확인 — POST /users/check-email (중복이면 DUPLICATE_EMAIL 에러) */
export function checkEmailDuplicate(email: string): Promise<void> {
  return apiPost<void>('/users/check-email', { email });
}

/** 회원가입용 이메일 인증번호 발송 — POST /users/emails/verification-requests */
export function sendSignupEmailCode(email: string): Promise<void> {
  return apiPost<void>('/users/emails/verification-requests', { email });
}

/** 회원가입용 이메일 인증번호 검증 — POST /users/emails/verifications (성공 시 서버가 5분간 인증 완료 상태를 기억함) */
export function verifySignupEmailCode(email: string, code: string): Promise<void> {
  return apiPost<void>('/users/emails/verifications', { email, code });
}

/** 일반 회원가입 — POST /users/signup (사전에 이메일 인증이 완료되어 있어야 함) */
export function signup(request: SignupRequest): Promise<SignupResult> {
  return apiPost<SignupResult>('/users/signup', request);
}

/**
 * 실명 인증 — POST /users/me/verification (로그인 상태 필요)
 * PortOne SDK로 본인인증을 마친 뒤 발급되는 identityVerificationId를 전달한다.
 * TODO: 실제 PortOne SDK(스토어 ID/채널 키) 연동 후 프론트에서 진짜 identityVerificationId를 발급받아 넘기도록 교체.
 */
export function verifyIdentity(identityVerificationId: string): Promise<IdentityVerificationResult> {
  return apiPost<IdentityVerificationResult>(
    '/users/me/verification',
    { identityVerificationId },
    { auth: true }
  );
}

/**
 * 중개사 회원가입 — POST /users/realtors (multipart/form-data)
 * checkEmailDuplicate/sendSignupEmailCode/verifySignupEmailCode와 동일한 이메일 인증
 * 절차를 사전에 통과해야 한다 (일반 회원가입과 같은 Redis AUTH_SUCCESS 플래그를 공유).
 * 텍스트 필드는 RealtorSignupReqDto와 1:1로 매핑되는 폼 파트로, 서류 이미지는
 * businessCertImage/agentCertImage(필수)/profileImage(선택) 파일 파트로 함께 보낸다.
 */
export function signupRealtor(request: RealtorSignupRequest): Promise<RealtorSignupResult> {
  const form = new FormData();
  form.append('email', request.email);
  form.append('password', request.password);
  form.append('name', request.name);
  form.append('phone', request.phone);
  form.append('officeName', request.officeName);
  form.append('businessNum', request.businessNum);
  if (request.officeAddress) form.append('officeAddress', request.officeAddress);
  if (request.officeLatitude !== undefined) form.append('officeLatitude', String(request.officeLatitude));
  if (request.officeLongitude !== undefined) form.append('officeLongitude', String(request.officeLongitude));
  form.append('businessCertImage', request.businessCertImage);
  form.append('agentCertImage', request.agentCertImage);
  if (request.profileImage) form.append('profileImage', request.profileImage);

  return apiPostMultipart<RealtorSignupResult>('/users/realtors', form);
}

/* ------------------------------------------------------------------ *
 * ⚠️ 백엔드 미구현 안내
 * 아이디 찾기 / 비밀번호 찾기 API는 현재 UserController에 존재하지 않습니다.
 * 아래 함수들은 화면 흐름과 상태 관리를 미리 붙여두기 위한 스텁입니다.
 * ------------------------------------------------------------------ */

function notImplemented<T>(feature: string): Promise<T> {
  return Promise.reject(
    new Error(`${feature} 기능은 아직 백엔드에 준비되지 않았어요. 백엔드 팀 구현 후 이용해주세요.`)
  );
}

/** TODO: 백엔드에 아이디 찾기 API 추가 후 연결 (예: POST /users/find-id) */
export function findId(name: string, email: string): Promise<void> {
  return notImplemented('아이디 찾기');
}

/** TODO: 백엔드에 비밀번호 찾기 API 추가 후 연결 (예: POST /users/find-password) */
export function sendTemporaryPassword(name: string, loginId: string, email: string): Promise<void> {
  return notImplemented('임시 비밀번호 발송');
}
