import { FormEvent, useState } from 'react';
import { login } from '../api/authApi';
import { ApiError } from '../api/client';
import { saveTokens } from '../utils/auth';
import AuthLayout from '../components/auth/AuthLayout';
import formStyles from '../components/auth/AuthForm.module.css';

/**
 * 이메일/비밀번호를 틀렸을 때 어느 쪽이 틀렸는지 노출하지 않기 위해
 * USER_NOT_FOUND(USER400_3), WRONG_PASSWORD(USER400_4)를 동일한 문구로 안내한다.
 */
const INVALID_CREDENTIAL_CODES = new Set(['USER400_3', 'USER400_4']);
const INVALID_CREDENTIAL_MESSAGE = '아이디 또는 비밀번호가 올바르지 않습니다.';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setErrorMessage(null);
    setSubmitting(true);
    try {
      const tokenDto = await login({ email: email.trim(), password });
      saveTokens(tokenDto);
      // TODO: react-router 도입 후 navigate('/')로 교체
      window.location.href = '/';
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(
          INVALID_CREDENTIAL_CODES.has(error.code) ? INVALID_CREDENTIAL_MESSAGE : error.message
        );
      } else {
        setErrorMessage('로그인 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="로그인" showSignupLink>
      <form className={formStyles.form} onSubmit={handleSubmit} noValidate>
        <div className={formStyles.intro}>
          <span className={formStyles.iconCircle} aria-hidden="true">
            🔒
          </span>
          <h2 className={formStyles.introTitle}>다시 만나서 반가워요!</h2>
          <p className={formStyles.introSubtitle}>아이디와 비밀번호를 입력해주세요</p>
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="email">
            아이디
          </label>
          <input
            id="email"
            type="email"
            className={formStyles.input}
            placeholder="가입하신 이메일을 입력해주세요"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="password">
            비밀번호
          </label>
          <div className={formStyles.passwordRow}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className={`${formStyles.input} ${errorMessage ? formStyles.inputError : ''}`}
              placeholder="비밀번호를 입력해주세요"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className={formStyles.togglePassword}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? '숨기기' : '보기'}
            </button>
          </div>
        </div>

        {errorMessage && (
          <p className={formStyles.errorMessage} role="alert">
            {errorMessage}
          </p>
        )}

        <button type="submit" className={formStyles.submit} disabled={submitting}>
          {submitting ? '로그인 중...' : '로그인'}
        </button>

        <p className={formStyles.bottomLinks}>
          <a href="/find-id" className={formStyles.bottomLink}>
            아이디 찾기
          </a>
          <span className={formStyles.dot}>·</span>
          <a href="/find-password" className={formStyles.bottomLink}>
            비밀번호 찾기
          </a>
          <span className={formStyles.dot}>·</span>
          <a href="/signup" className={`${formStyles.bottomLink} ${formStyles.bottomLinkStrong}`}>
            회원가입
          </a>
        </p>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
