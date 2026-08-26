import { useState } from 'react';
import { checkEmailDuplicate, sendSignupEmailCode, verifySignupEmailCode } from '../api/authApi';
import { ApiError } from '../api/client';

/** 백엔드 password 검증 규칙과 동일: 영문/숫자/특수문자 포함 8~20자 (UserCreateReqDto, RealtorSignupReqDto 공통) */
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&]{8,20}$/;

/**
 * 일반 사용자/공인중개사 회원가입 마법사가 공통으로 쓰는 "계정 정보" 단계 로직.
 * 이메일 중복확인 → 이메일 인증번호 발송/검증 → 비밀번호 검증까지를 캡슐화한다.
 */
export function useEmailAccountStep() {
  const [email, setEmail] = useState('');
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [code, setCode] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = PASSWORD_PATTERN.test(password);
  const passwordMatches = password.length > 0 && password === confirmPassword;
  const canProceed = emailAvailable === true && codeVerified && passwordValid && passwordMatches;

  /** 이메일 입력 변경 시 중복확인/인증 상태 초기화 */
  function handleEmailChange(value: string) {
    setEmail(value);
    setEmailAvailable(null);
    setCodeSent(false);
    setCodeVerified(false);
  }

  /** 이메일 중복 확인 API 호출 */
  async function handleCheckEmail() {
    if (!emailFormatValid || checkingEmail) return;
    setErrorMessage(null);
    setCheckingEmail(true);
    try {
      await checkEmailDuplicate(email.trim());
      setEmailAvailable(true);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'USER400_1') {
        setEmailAvailable(false);
      } else {
        setErrorMessage(error instanceof Error ? error.message : '중복 확인에 실패했어요.');
      }
    } finally {
      setCheckingEmail(false);
    }
  }

  /** 이메일 인증번호 발송 API 호출 */
  async function handleSendCode() {
    if (emailAvailable !== true || sendingCode) return;
    setErrorMessage(null);
    setSendingCode(true);
    try {
      await sendSignupEmailCode(email.trim());
      setCodeSent(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '인증번호 발송에 실패했어요.');
    } finally {
      setSendingCode(false);
    }
  }

  /** 이메일 인증번호 검증 API 호출 */
  async function handleVerifyCode() {
    if (!codeSent || code.trim().length === 0 || verifyingCode) return;
    setErrorMessage(null);
    setVerifyingCode(true);
    try {
      await verifySignupEmailCode(email.trim(), code.trim());
      setCodeVerified(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '인증번호가 올바르지 않아요.');
    } finally {
      setVerifyingCode(false);
    }
  }

  return {
    email,
    handleEmailChange,
    emailFormatValid,
    emailAvailable,
    checkingEmail,
    handleCheckEmail,
    codeSent,
    sendingCode,
    code,
    setCode,
    codeVerified,
    verifyingCode,
    handleSendCode,
    handleVerifyCode,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    passwordValid,
    passwordMatches,
    canProceed,
    errorMessage,
    setErrorMessage,
  };
}

export type EmailAccountStep = ReturnType<typeof useEmailAccountStep>;
