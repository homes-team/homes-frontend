import { FormEvent } from 'react';
import { EmailAccountStep } from '../../hooks/useEmailAccountStep';
import { Link } from 'react-router-dom';
import formStyles from './AuthForm.module.css';

interface EmailAccountFieldsProps {
  step: EmailAccountStep;
  /** 다음 단계로 진행 (이미 canProceed 검증 후 호출됨) */
  onNext: () => void;
  /** 회원가입 마법사 진입 전 로그인 화면으로 돌아가는 링크 노출 여부 */
  showLoginLink?: boolean;
}

/**
 * 일반 사용자/공인중개사 가입 마법사가 공유하는 "계정 정보 입력" 단계 UI.
 * 이메일 중복확인 → 이메일 인증번호 발송/확인 → 비밀번호/비밀번호 확인 순서로 렌더링한다.
 */
function EmailAccountFields({ step, onNext, showLoginLink = true }: EmailAccountFieldsProps) {
  /** 폼 제출 핸들러 — canProceed 검증 후 다음 단계로 진행 */
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!step.canProceed) return;
    onNext();
  };

  return (
    <form className={formStyles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={formStyles.introTitle} style={{ textAlign: 'left' }}>
        계정 정보 입력
      </h2>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="email">
          이메일 (아이디로 사용돼요)
        </label>
        <div className={formStyles.inputRow}>
          <input
            id="email"
            type="email"
            className={formStyles.input}
            placeholder="example@homes.com"
            value={step.email}
            onChange={(event) => step.handleEmailChange(event.target.value)}
            autoComplete="email"
            disabled={step.codeVerified}
            required
          />
          <button
            type="button"
            className={formStyles.actionButton}
            onClick={step.handleCheckEmail}
            disabled={!step.emailFormatValid || step.checkingEmail || step.codeVerified}
          >
            {step.checkingEmail ? '확인 중...' : '중복확인'}
          </button>
        </div>
        {step.emailAvailable === true && <p className={formStyles.availabilityOk}>사용 가능한 이메일이에요.</p>}
        {step.emailAvailable === false && <p className={formStyles.availabilityTaken}>이미 가입된 이메일이에요.</p>}
      </div>

      {step.emailAvailable === true && (
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="code">
            이메일 인증번호
          </label>
          <div className={formStyles.inputRow}>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              className={formStyles.input}
              placeholder="6자리 인증번호 입력"
              value={step.code}
              onChange={(event) => step.setCode(event.target.value)}
              disabled={step.codeVerified}
              required
            />
            {!step.codeVerified ? (
              <button
                type="button"
                className={formStyles.actionButton}
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
              <span className={formStyles.actionButton} style={{ backgroundColor: '#0f7048' }}>
                인증 완료
              </span>
            )}
          </div>
          {step.codeSent && !step.codeVerified && (
            <div className={formStyles.inputRow} style={{ marginTop: 4 }}>
              <p className={formStyles.helperText}>이메일로 인증번호가 발송됐어요.</p>
              <button type="button" className={formStyles.togglePassword} onClick={step.handleSendCode}>
                재전송
              </button>
            </div>
          )}
        </div>
      )}

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="password">
          비밀번호
        </label>
        <div className={formStyles.passwordRow}>
          <input
            id="password"
            type={step.showPassword ? 'text' : 'password'}
            className={formStyles.input}
            placeholder="8자 이상, 영문+숫자+특수문자 조합"
            value={step.password}
            onChange={(event) => step.setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            className={formStyles.togglePassword}
            onClick={() => step.setShowPassword((prev) => !prev)}
            aria-label={step.showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
          >
            {step.showPassword ? '숨기기' : '보기'}
          </button>
        </div>
        {step.password.length > 0 && !step.passwordValid && (
          <p className={formStyles.errorMessage} style={{ marginTop: 0 }}>
            영문, 숫자, 특수문자를 포함해 8~20자로 입력해주세요.
          </p>
        )}
      </div>

      <div className={formStyles.field}>
        <label className={formStyles.label} htmlFor="confirmPassword">
          비밀번호 확인
        </label>
        <input
          id="confirmPassword"
          type={step.showPassword ? 'text' : 'password'}
          className={formStyles.input}
          placeholder="비밀번호를 다시 입력해주세요"
          value={step.confirmPassword}
          onChange={(event) => step.setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
        {step.confirmPassword.length > 0 && !step.passwordMatches && (
          <p className={formStyles.errorMessage} style={{ marginTop: 0 }}>
            비밀번호가 일치하지 않아요.
          </p>
        )}
      </div>

      {step.errorMessage && (
        <p className={formStyles.errorMessage} role="alert">
          {step.errorMessage}
        </p>
      )}

      <button type="submit" className={formStyles.submit} disabled={!step.canProceed}>
        다음
      </button>

      {showLoginLink && (
        <p className={formStyles.bottomLinks}>
          <Link to="/login" className={formStyles.bottomLink}>
            이미 계정이 있으신가요? 로그인
          </Link>
        </p>
      )}
    </form>
  );
}

export default EmailAccountFields;
