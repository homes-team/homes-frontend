import { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmailAccountStep } from '../../hooks/useEmailAccountStep';
import Button from '../ui/Button';
import { Field, Label, Input, ErrorText, HelperText } from '../ui/Field';

interface EmailAccountFieldsProps {
  step: EmailAccountStep;
  /** 다음 단계로 진행 (이미 canProceed 검증 후 호출됨) */
  onNext: () => void;
  /** 회원가입 마법사 진입 전 로그인 화면으로 돌아가는 링크 노출 여부 */
  showLoginLink?: boolean;
}

const actionButtonClass =
  'shrink-0 whitespace-nowrap rounded-button bg-primary px-4 py-[13px] text-[13px] font-medium text-white disabled:opacity-50 hover:bg-primary-dark';

/**
 * 일반 사용자/공인중개사 가입 마법사가 공유하는 "계정 정보 입력" 단계 UI.
 * 이메일 중복확인 → 이메일 인증번호 발송/확인 → 비밀번호/비밀번호 확인 순서로 렌더링한다.
 */
function EmailAccountFields({ step, onNext, showLoginLink = true }: EmailAccountFieldsProps) {
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!step.canProceed) return;
    onNext();
  };

  return (
    <form className="flex flex-col gap-5 px-6 pt-6 pb-8" onSubmit={handleSubmit} noValidate>
      <h2 className="text-left text-lg font-bold text-gray-900">계정 정보 입력</h2>

      <Field>
        <Label htmlFor="email">이메일 (아이디로 사용돼요)</Label>
        <div className="flex gap-2">
          <Input
            id="email"
            type="email"
            placeholder="example@homes.com"
            value={step.email}
            onChange={(event) => step.handleEmailChange(event.target.value)}
            autoComplete="email"
            disabled={step.codeVerified}
            required
          />
          <button
            type="button"
            className={actionButtonClass}
            onClick={step.handleCheckEmail}
            disabled={!step.emailFormatValid || step.checkingEmail || step.codeVerified}
          >
            {step.checkingEmail ? '확인 중...' : '중복확인'}
          </button>
        </div>
        {step.emailAvailable === true && <p className="text-xs text-success">사용 가능한 이메일이에요.</p>}
        {step.emailAvailable === false && <p className="text-xs text-danger">이미 가입된 이메일이에요.</p>}
      </Field>

      {step.emailAvailable === true && (
        <Field>
          <Label htmlFor="code">이메일 인증번호</Label>
          <div className="flex gap-2">
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              placeholder="6자리 인증번호 입력"
              value={step.code}
              onChange={(event) => step.setCode(event.target.value)}
              disabled={step.codeVerified}
              required
            />
            {!step.codeVerified ? (
              <button
                type="button"
                className={actionButtonClass}
                onClick={step.codeSent ? step.handleVerifyCode : step.handleSendCode}
                disabled={step.sendingCode || step.verifyingCode || (step.codeSent && step.code.trim().length === 0)}
              >
                {step.sendingCode
                  ? '전송 중...'
                  : step.verifyingCode
                    ? '확인 중...'
                    : step.codeSent
                      ? '확인'
                      : '인증번호 받기'}
              </button>
            ) : (
              <span className={`${actionButtonClass} bg-success`}>인증 완료</span>
            )}
          </div>
          {step.codeSent && !step.codeVerified && (
            <div className="mt-1 flex items-center gap-2">
              <HelperText>이메일로 인증번호가 발송됐어요.</HelperText>
              <button type="button" className="p-1 text-xs font-medium text-gray-500 hover:text-primary" onClick={step.handleSendCode}>
                재전송
              </button>
            </div>
          )}
        </Field>
      )}

      <Field>
        <Label htmlFor="password">비밀번호</Label>
        <div className="relative flex items-center">
          <Input
            id="password"
            type={step.showPassword ? 'text' : 'password'}
            className="pr-16"
            placeholder="8자 이상, 영문+숫자+특수문자 조합"
            value={step.password}
            onChange={(event) => step.setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            className="absolute right-3 p-1 text-xs font-medium text-gray-500 hover:text-primary"
            onClick={() => step.setShowPassword((prev) => !prev)}
            aria-label={step.showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
          >
            {step.showPassword ? '숨기기' : '보기'}
          </button>
        </div>
        {step.password.length > 0 && !step.passwordValid && (
          <ErrorText>영문, 숫자, 특수문자를 포함해 8~20자로 입력해주세요.</ErrorText>
        )}
      </Field>

      <Field>
        <Label htmlFor="confirmPassword">비밀번호 확인</Label>
        <Input
          id="confirmPassword"
          type={step.showPassword ? 'text' : 'password'}
          placeholder="비밀번호를 다시 입력해주세요"
          value={step.confirmPassword}
          onChange={(event) => step.setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
        {step.confirmPassword.length > 0 && !step.passwordMatches && <ErrorText>비밀번호가 일치하지 않아요.</ErrorText>}
      </Field>

      {step.errorMessage && <ErrorText>{step.errorMessage}</ErrorText>}

      <Button type="submit" disabled={!step.canProceed}>
        다음
      </Button>

      {showLoginLink && (
        <p className="flex justify-center text-[13px] text-gray-500">
          <button type="button" onClick={() => navigate('/login')} className="hover:text-primary">
            이미 계정이 있으신가요? 로그인
          </button>
        </p>
      )}
    </form>
  );
}

export default EmailAccountFields;
