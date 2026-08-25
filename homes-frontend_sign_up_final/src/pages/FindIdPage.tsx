import { FormEvent, useState } from 'react';
import { findId } from '../api/authApi';
import AuthLayout from '../components/auth/AuthLayout';
import formStyles from '../components/auth/AuthForm.module.css';

/**
 * 이름 + 이메일이 가입 정보와 일치하면, 그 이메일로 아이디(=이메일)를 바로 발송한다.
 * 비밀번호 재설정과 달리 새로운 접근 권한을 주는 동작이 아니라 "본인 메일함으로 정보를
 * 보내주는" 동작이라 인증번호 왕복 절차 없이 1단계로 끝낸다.
 */
function FindIdPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && email.trim().length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    setErrorMessage(null);
    setSubmitting(true);
    try {
      await findId(name.trim(), email.trim());
      setDone(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '아이디 찾기에 실패했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="아이디 찾기">
      <form className={formStyles.form} onSubmit={handleSubmit} noValidate>
        <div className={formStyles.intro}>
          <span className={formStyles.iconCircle} aria-hidden="true">
            ✉️
          </span>
          <h2 className={formStyles.introTitle}>가입하신 아이디를 찾아드릴게요</h2>
          <p className={formStyles.introSubtitle}>
            이름과 이메일을 입력하시면 가입하신 아이디를 이메일로 보내드려요
          </p>
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="name">
            이름
          </label>
          <input
            id="name"
            type="text"
            className={formStyles.input}
            placeholder="이름을 입력해주세요"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            disabled={done}
            required
          />
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="email">
            이메일
          </label>
          <input
            id="email"
            type="email"
            className={formStyles.input}
            placeholder="가입하신 이메일을 입력해주세요"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            disabled={done}
            required
          />
        </div>

        {errorMessage && (
          <p className={formStyles.errorMessage} role="alert">
            {errorMessage}
          </p>
        )}

        {!done && (
          <button type="submit" className={formStyles.submit} disabled={!canSubmit || submitting}>
            {submitting ? '전송 중...' : '아이디 찾기'}
          </button>
        )}

        {done && (
          <div className={formStyles.resultBox}>
            <span className={formStyles.resultLabel}>이메일 발송 완료</span>
            <span className={formStyles.resultValue}>
              입력하신 이메일로 아이디를 보내드렸어요. 메일함을 확인해주세요.
            </span>
          </div>
        )}

        <p className={formStyles.bottomLinks}>
          <a href="/login" className={formStyles.bottomLink}>
            로그인으로 돌아가기
          </a>
        </p>
      </form>
    </AuthLayout>
  );
}

export default FindIdPage;
