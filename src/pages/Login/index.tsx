import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../api/auth/authApi';
import { ApiError } from '../../api/client';
import { saveTokens } from '../../utils/auth';
import AuthLayout from '../../components/auth/AuthLayout';
import Button from '../../components/ui/Button';
import { Field, Label, Input, ErrorText } from '../../components/ui/Field';

/**
 * 이메일/비밀번호를 틀렸을 때 어느 쪽이 틀렸는지 노출하지 않기 위해
 * USER_NOT_FOUND(USER400_3), WRONG_PASSWORD(USER400_4)를 동일한 문구로 안내한다.
 */
const INVALID_CREDENTIAL_CODES = new Set(['USER400_3', 'USER400_4']);
const INVALID_CREDENTIAL_MESSAGE = '아이디 또는 비밀번호가 올바르지 않습니다.';

function LoginPage() {
  const navigate = useNavigate();
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
      navigate('/');
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
      <form className="flex flex-col gap-5 px-6 pt-6 pb-8" onSubmit={handleSubmit} noValidate>
        <div className="mb-1 flex flex-col items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-[22px]" aria-hidden="true">
            🔒
          </span>
          <h2 className="text-center text-lg font-bold text-gray-900">다시 만나서 반가워요!</h2>
          <p className="text-center text-[13px] text-gray-500">아이디와 비밀번호를 입력해주세요</p>
        </div>

        <Field>
          <Label htmlFor="email">아이디</Label>
          <Input
            id="email"
            type="email"
            placeholder="가입하신 이메일을 입력해주세요"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </Field>

        <Field>
          <Label htmlFor="password">비밀번호</Label>
          <div className="relative flex items-center">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="pr-16"
              invalid={Boolean(errorMessage)}
              placeholder="비밀번호를 입력해주세요"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="absolute right-3 p-1 text-xs font-medium text-gray-500 hover:text-primary"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? '숨기기' : '보기'}
            </button>
          </div>
        </Field>

        {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

        <Button type="submit" disabled={submitting}>
          {submitting ? '로그인 중...' : '로그인'}
        </Button>

        <p className="flex items-center justify-center gap-2 text-[13px] text-gray-500">
          <button type="button" onClick={() => navigate('/find-id')} className="hover:text-primary">
            아이디 찾기
          </button>
          <span className="text-gray-200">·</span>
          <button type="button" onClick={() => navigate('/find-password')} className="hover:text-primary">
            비밀번호 찾기
          </button>
          <span className="text-gray-200">·</span>
          <button type="button" onClick={() => navigate('/signup')} className="font-bold text-primary">
            회원가입
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
