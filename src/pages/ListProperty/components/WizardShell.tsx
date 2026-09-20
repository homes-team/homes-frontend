import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface WizardShellProps {
  /** 1부터 시작 */
  step: number;
  totalSteps: number;
  title: string;
  description?: string;
  /** 지정하지 않으면 브라우저 뒤로가기(navigate(-1)) */
  onBack?: () => void;
  /** 하단 고정 바에 들어갈 버튼/에러 메시지 등 */
  footer: ReactNode;
  children: ReactNode;
}

/**
 * "/list-property/*" 6단계가 공통으로 쓰는 뼈대.
 * 와이어프레임의 상단 헤더(← 방 내놓기) + 단계 진행바 + 본문 + 하단 고정 CTA 구조를 그대로 따른다.
 */
function WizardShell({ step, totalSteps, title, description, onBack, footer, children }: WizardShellProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-10 py-3.5">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-pill text-lg text-gray-900 hover:bg-gray-100"
          onClick={() => (onBack ? onBack() : navigate(-1))}
          aria-label="이전 단계로"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-900">방 내놓기</h1>
        <span className="w-10" aria-hidden="true" />
      </header>

      <div className="mx-auto max-w-[768px] px-4 pt-8">
        <div className="mb-8">
          <div
            className="flex gap-2"
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
          >
            {Array.from({ length: totalSteps }).map((_, index) => (
              <span
                key={index}
                className={`h-1.5 flex-1 rounded-pill ${index < step ? 'bg-primary' : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <p className="mt-1.5 text-sm text-gray-500">
            {step} / {totalSteps} 단계
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {description && <p className="mt-2 text-[15px] text-gray-500">{description}</p>}
        </div>

        <div className="flex flex-col gap-6">{children}</div>
      </div>

      <footer className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white py-4">
        <div className="mx-auto flex max-w-[768px] flex-col gap-2 px-4">{footer}</div>
      </footer>
    </div>
  );
}

export default WizardShell;
