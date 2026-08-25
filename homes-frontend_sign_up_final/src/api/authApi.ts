import {
  IdentityVerificationResult,
  LoginRequest,
  RealtorSignupRequest,
  RealtorSignupResult,
  SignupRequest,
  SignupResult,
  TokenDto,
} from '../types/auth';
import { apiPost, apiPostForm } from './client';

/** 이메일/비밀번호 로그인 — POST /users/login */
export function login(request: LoginRequest): Promise<TokenDto> {
  return apiPost<TokenDto>('/users/login', request);
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

/* ------------------------------------------------------------------ *
 * ⚠️ 백엔드 미구현 안내
 * 아이디 찾기 / 비밀번호 찾기 API는 현재 UserController에 존재하지 않습니다.
 * (있는 것: /users/login, /users/signup, /users/emails/verification-requests
 *  — 단, 이메일 인증은 "가입 안 된 이메일"만 통과시키는 회원가입 전용 로직이라
 *  비밀번호 찾기(이미 가입된 이메일이어야 함)에는 그대로 재사용할 수 없습니다.)
 *
 * 아래 함수들은 화면 흐름과 상태 관리를 미리 붙여두기 위한 스텁입니다.
 * 백엔드에 대응 엔드포인트가 추가되면 각 함수 내부만 apiPost 호출로 교체하면 됩니다.
 * ------------------------------------------------------------------ */

function notImplemented<T>(feature: string): Promise<T> {
  return Promise.reject(
    new Error(`${feature} 기능은 아직 백엔드에 준비되지 않았어요. 백엔드 팀 구현 후 이용해주세요.`)
  );
}

/**
 * TODO: 백엔드에 아이디 찾기 API 추가 후 연결 (예: POST /users/find-id)
 * 이름+이메일이 가입 정보와 일치하면, 별도 인증번호 없이 그 이메일로 아이디(=이메일)를 발송한다.
 * 비밀번호 재설정과 달리 계정 접근 권한을 새로 부여하는 동작이 아니라 "본인 소유 메일함으로
 * 정보를 보내주는" 동작이라 인증번호 왕복 절차가 필요 없다.
 */
export function findId(name: string, email: string): Promise<void> {
  return notImplemented('아이디 찾기');
}

/**
 * TODO: 백엔드에 비밀번호 찾기 API 추가 후 연결 (예: POST /users/find-password)
 * 이름+아이디(이메일)가 가입 정보와 일치하면, 서버가 임시 비밀번호를 생성해
 * 입력한 이메일로 발송한다. 사용자는 로그인 후 반드시 비밀번호를 변경해야 한다.
 * (기존 새 비밀번호 직접 입력 + 인증번호 확인 방식 대신, 아이디 찾기와 동일하게
 * 인증번호 왕복 없는 1단계 흐름으로 통일했다.)
 */
export function sendTemporaryPassword(name: string, loginId: string, email: string): Promise<void> {
  return notImplemented('임시 비밀번호 발송');
}

interface RealtorSignupFiles {
  businessCertImage: File;
  agentCertImage: File;
  profileImage?: File;
}

/**
 * 중개사 회원가입 — POST /users/realtors (multipart/form-data)
 * checkEmailDuplicate/sendSignupEmailCode/verifySignupEmailCode와 동일한 이메일 인증
 * 절차를 사전에 통과해야 한다 (일반 회원가입과 같은 Redis AUTH_SUCCESS 플래그를 공유).
 */
export function signupRealtor(request: RealtorSignupRequest, files: RealtorSignupFiles): Promise<RealtorSignupResult> {
  const formData = new FormData();
  formData.append('email', request.email);
  formData.append('password', request.password);
  formData.append('name', request.name);
  formData.append('phone', request.phone);
  formData.append('officeName', request.officeName);
  formData.append('businessNum', request.businessNum);
  if (request.officeAddress) formData.append('officeAddress', request.officeAddress);
  if (request.officeLatitude !== undefined) formData.append('officeLatitude', String(request.officeLatitude));
  if (request.officeLongitude !== undefined) formData.append('officeLongitude', String(request.officeLongitude));

  formData.append('businessCertImage', files.businessCertImage);
  formData.append('agentCertImage', files.agentCertImage);
  if (files.profileImage) formData.append('profileImage', files.profileImage);

  return apiPostForm<RealtorSignupResult>('/users/realtors', formData);
}
