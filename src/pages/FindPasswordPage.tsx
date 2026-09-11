import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { sendTemporaryPassword } from '../api/authApi';
import AuthLayout from '../components/auth/AuthLayout';
import formStyles from '../components/auth/AuthForm.module.css';

/**
 * 이름 + 아이디(이메일) + 이메일이 가입 정보와 일치하면, 서버가 생성한 임시 비밀번호를
 * 그 이메일로 발송한다. 아이디 찾기와 동일하게 인증번호 왕복 없는 1단계 흐름.
 */
function FindPasswordPage() {
  const [name, setName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && loginId.trim().length > 0 && email.trim().length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    setErrorMessage(null);
    setSubmitting(true);
    try {
      await sendTemporaryPassword(name.trim(), loginId.trim(), email.trim());
      setDone(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '임시 비밀번호 발송에 실패했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="비밀번호 찾기">
      <form className={formStyles.form} onSubmit={handleSubmit} noValidate>
        <div className={formStyles.intro}>
          <span className={formStyles.iconCircle} aria-hidden="true">
            🔑
          </span>
          <h2 className={formStyles.introTitle}>임시 비밀번호를 보내드릴게요</h2>
          <p className={formStyles.introSubtitle}>
            이름, 아이디, 이메일을 입력하시면 임시 비밀번호를 이메일로 보내드려요
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
          <label className={formStyles.label} htmlFor="loginId">
            아이디
          </label>
          <input
            id="loginId"
            type="email"
            className={formStyles.input}
            placeholder="가입하신 아이디(이메일)를 입력해주세요"
            value={loginId}
            onChange={(event) => setLoginId(event.target.value)}
            autoComplete="username"
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
            placeholder="임시 비밀번호를 받으실 이메일을 입력해주세요"
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
            {submitting ? '전송 중...' : '임시 비밀번호 받기'}
          </button>
        )}

        {done && (
          <div className={formStyles.resultBox}>
            <span className={formStyles.resultLabel}>이메일 발송 완료</span>
            <span className={formStyles.resultValue}>
              입력하신 이메일로 임시 비밀번호를 보내드렸어요. 로그인 후 꼭 비밀번호를 변경해주세요.
            </span>
          </div>
        )}

        <p className={formStyles.bottomLinks}>
          <Link to="/login" className={formStyles.bottomLink}>
            로그인으로 돌아가기
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default FindPasswordPage;
