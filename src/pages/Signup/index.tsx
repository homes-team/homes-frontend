import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';

/** 회원가입 유형 선택 화면 (Figma `/sign_up`). */
function SignupPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout title="회원가입">
      <div className="flex flex-col gap-5 px-6 pt-6 pb-8">
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-center text-lg font-bold text-gray-900">어떤 분이신가요?</h2>
          <p className="text-center text-[13px] text-gray-500">서비스 유형을 선택하면 맞춤 가입 절차가 시작됩니다</p>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/signup/user')}
            className="flex flex-1 flex-col items-center gap-2 rounded-2xl border border-gray-200 px-4 py-7 text-center hover:border-primary hover:shadow-[0_4px_16px_rgba(37,99,235,0.12)]"
          >
            <span className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-2xl" aria-hidden="true">
              👤
            </span>
            <span className="text-base font-bold text-gray-900">일반 사용자</span>
            <span className="text-[13px] text-gray-500">집을 찾거나 내놓고 싶어요</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/signup/realtor')}
            className="flex flex-1 flex-col items-center gap-2 rounded-2xl border border-gray-200 px-4 py-7 text-center hover:border-primary hover:shadow-[0_4px_16px_rgba(37,99,235,0.12)]"
          >
            <span className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-2xl" aria-hidden="true">
              🏢
            </span>
            <span className="text-base font-bold text-gray-900">공인 중개사</span>
            <span className="text-[13px] text-gray-500">매물을 관리하고 중개하고 싶어요</span>
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

export default SignupPage;
