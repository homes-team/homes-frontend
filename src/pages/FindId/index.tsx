import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { findId } from '../../api/authApi';
import AuthLayout from '../../components/auth/AuthLayout';
import Button from '../../components/ui/Button';
import { Field, Label, Input, ErrorText } from '../../components/ui/Field';

/** 이름 + 이메일이 가입 정보와 일치하면, 그 이메일로 아이디(=이메일)를 바로 발송한다. */
function FindIdPage() {
  const navigate = useNavigate();
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
      <form className="flex flex-col gap-5 px-6 pt-6 pb-8" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-[22px]" aria-hidden="true">
            ✉️
          </span>
          <h2 className="text-center text-lg font-bold text-gray-900">가입하신 아이디를 찾아드릴게요</h2>
          <p className="text-center text-[13px] text-gray-500">
            이름과 이메일을 입력하시면 가입하신 아이디를 이메일로 보내드려요
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
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            placeholder="가입하신 이메일을 입력해주세요"
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
            {submitting ? '전송 중...' : '아이디 찾기'}
          </Button>
        )}

        {done && (
          <div className="flex flex-col gap-1 rounded-[10px] bg-[#ebfbf3] p-4">
            <span className="text-xs font-medium text-[#0f7048]">이메일 발송 완료</span>
            <span className="text-base font-bold text-gray-900">
              입력하신 이메일로 아이디를 보내드렸어요. 메일함을 확인해주세요.
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

export default FindIdPage;
