import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendTemporaryPassword } from '../../api/auth/authApi';
import AuthLayout from '../../components/auth/AuthLayout';
import Button from '../../components/ui/Button';
import { Field, Label, Input, ErrorText } from '../../components/ui/Field';

/**
 * 이름 + 아이디(이메일) + 이메일이 가입 정보와 일치하면, 서버가 생성한 임시 비밀번호를
 * 그 이메일로 발송한다. 아이디 찾기와 동일하게 인증번호 왕복 없는 1단계 흐름.
 */
function FindPasswordPage() {
  const navigate = useNavigate();
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
      <form className="flex flex-col gap-5 px-6 pt-6 pb-8" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-[22px]" aria-hidden="true">
            🔑
          </span>
          <h2 className="text-center text-lg font-bold text-gray-900">임시 비밀번호를 보내드릴게요</h2>
          <p className="text-center text-[13px] text-gray-500">
            이름, 아이디, 이메일을 입력하시면 임시 비밀번호를 이메일로 보내드려요
          </p>
        </div>

        <Field>
          <Label htmlFor="name">이름</Label>
          <Input
            id="name"
            type="text"
            placeholder="이름을 입력해주세요"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            disabled={done}
            required
          />
        </Field>

        <Field>
          <Label htmlFor="loginId">아이디</Label>
          <Input
            id="loginId"
            type="email"
            placeholder="가입하신 아이디(이메일)를 입력해주세요"
            value={loginId}
            onChange={(event) => setLoginId(event.target.value)}
            autoComplete="username"
            disabled={done}
            required
          />
        </Field>

        <Field>
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            placeholder="임시 비밀번호를 받으실 이메일을 입력해주세요"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            disabled={done}
            required
          />
        </Field>

        {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

        {!done && (
          <Button type="submit" disabled={!canSubmit || submitting}>
            {submitting ? '전송 중...' : '임시 비밀번호 받기'}
          </Button>
        )}

        {done && (
          <div className="flex flex-col gap-1 rounded-[10px] bg-success-50 p-4">
            <span className="text-xs font-medium text-success">이메일 발송 완료</span>
            <span className="text-base font-bold text-gray-900">
              입력하신 이메일로 임시 비밀번호를 보내드렸어요. 로그인 후 꼭 비밀번호를 변경해주세요.
            </span>
          </div>
        )}

        <p className="flex justify-center text-[13px] text-gray-500">
          <button type="button" onClick={() => navigate('/login')} className="hover:text-primary">
            로그인으로 돌아가기
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}

export default FindPasswordPage;
