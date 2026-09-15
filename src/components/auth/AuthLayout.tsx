import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export interface AuthStep {
  label: string;
  status: 'done' | 'active' | 'upcoming';
}

interface AuthLayoutProps {
  /** 모달 상단바에 표시할 제목 (예: "로그인", "아이디 찾기") */
  title: string;
  /** 우측 상단 "회원가입" 링크 노출 여부 (로그인 화면에서만 true) */
  showSignupLink?: boolean;
  /** 회원가입 마법사에서만 사용하는 단계 인디케이터 (1-2-3-4) */
  steps?: AuthStep[];
  children: ReactNode;
}

/**
 * 로그인 / 아이디 찾기 / 비밀번호 찾기 / 회원가입 화면이 공유하는 모달형 레이아웃.
 * Figma WireFrame 페이지의 `/login`, `/sign_up` AuthModal 컨벤션을 그대로 따른다.
 */
function AuthLayout({ title, showSignupLink = false, steps, children }: AuthLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <header className="bg-white px-10 py-3.5">
        <button type="button" onClick={() => navigate('/')} className="inline-flex items-center gap-2">
          <span className="h-[30px] w-[30px] rounded-lg bg-primary" aria-hidden="true" />
          <span className="text-xl font-bold text-primary">홈즈</span>
        </button>
      </header>

      <main className="flex flex-1 justify-center px-6 py-6 pb-15">
        <div className="h-fit w-full max-w-[448px] rounded-2xl bg-white shadow-[0_16px_48px_rgba(17,24,39,0.14)]">
          <div className="flex items-center justify-between px-6 py-5">
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>
            <div className="flex items-center gap-4">
              {showSignupLink && (
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="text-[13px] font-medium text-gray-500 hover:text-primary"
                >
                  회원가입
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/')}
                aria-label="닫기"
                className="text-base leading-none text-gray-500 hover:text-gray-900"
              >
                ✕
              </button>
            </div>
          </div>

          {steps && (
            <div className="flex items-start px-6 pb-5">
              {steps.map((step, index) => (
                <div key={step.label} className={`flex flex-col items-center ${index === steps.length - 1 ? 'flex-none' : 'flex-1'}`}>
                  <div className="flex w-full items-center">
                    <span
                      className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        step.status === 'upcoming' ? 'bg-gray-100 text-gray-400' : 'bg-primary text-white'
                      }`}
                    >
                      {step.status === 'done' ? '✓' : index + 1}
                    </span>
                    {index < steps.length - 1 && (
                      <span className={`mx-1 h-0.5 flex-1 ${step.status === 'done' ? 'bg-primary' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  {step.status === 'active' && (
                    <span className="mt-1.5 whitespace-nowrap text-[11px] font-medium text-primary">{step.label}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="h-px bg-gray-200" />

          {children}
        </div>
      </main>
    </div>
  );
}

export default AuthLayout;
