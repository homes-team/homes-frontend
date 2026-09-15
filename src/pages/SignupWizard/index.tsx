import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signup } from '../../api/authApi';
import { saveTokens } from '../../utils/auth';
import { buildAuthSteps } from '../../utils/authSteps';
import { SignupResult } from '../../types/auth';
import { useEmailAccountStep } from '../../hooks/useEmailAccountStep';
import AuthLayout from '../../components/auth/AuthLayout';
import EmailAccountFields from '../../components/auth/EmailAccountFields';
import Button from '../../components/ui/Button';
import { HelperText, ErrorText } from '../../components/ui/Field';

type WizardStep = 'account' | 'terms' | 'identity' | 'done';

const STEP_LABELS = ['가입 유형', '계정 정보', '약관 동의', '본인인증'];

/**
 * Figma `/sign_up/commonuser/step2~5`를 기반으로 한 일반 사용자 회원가입 마법사.
 * "계정 정보" 단계는 공인중개사 마법사(SignupAgentWizardPage)와 완전히 동일한 로직이라
 * useEmailAccountStep 훅 + EmailAccountFields 컴포넌트로 공용화했다.
 *
 * 원본 와이어프레임과 다르게 조정한 부분 (백엔드 User 엔티티/DTO에 대응 필드가 없어서 조정):
 * - "아이디"(4~20자 영문/숫자) 별도 필드 → 이메일로 통일 (로그인은 email 기준이라 커스텀
 *   아이디 개념 자체가 없음). "중복확인" 버튼은 실제 POST /users/check-email에 연결했다.
 * - step2의 "이름" 직접입력, step3의 "생년월일"/"성별" 필드는 제거했다. User 엔티티에
 *   대응 컬럼이 없고, name/phone은 오직 실명 인증(PortOne)을 통해서만 채워지도록
 *   설계되어 있어 자유 텍스트로 받아도 저장할 곳이 없다.
 * - step5 "휴대폰 본인인증"은 SMS 자체 인증이 아니라 PortOne SDK 연동이 필요하고, 로그인
 *   상태에서만 호출 가능한 API(POST /users/me/verification)라 회원가입 마지막 단계에서
 *   "선택 사항"으로 배치했다. PortOne 스토어 키가 아직 없어 실제 인증창은 뜨지 않는다
 *   (버튼을 누르면 안내만 표시되고, 건너뛰기로 가입을 완료할 수 있다).
 */
function SignupWizardPage() {
  const navigate = useNavigate();
  const [wizardStep, setWizardStep] = useState<WizardStep>('account');
  const accountStep = useEmailAccountStep();

  const [agreeService, setAgreeService] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeLocation, setAgreeLocation] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const allAgreed = agreeService && agreePrivacy && agreeLocation && agreeMarketing;

  const [submittingSignup, setSubmittingSignup] = useState(false);
  const [signupResult, setSignupResult] = useState<SignupResult | null>(null);
  const [identityMessage, setIdentityMessage] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);

  const toggleAllAgree = () => {
    const next = !allAgreed;
    setAgreeService(next);
    setAgreePrivacy(next);
    setAgreeLocation(next);
    setAgreeMarketing(next);
  };

  const canSubmitSignup = agreeService && agreePrivacy;

  const handleSignup = async () => {
    if (!canSubmitSignup || submittingSignup) return;
    setTermsError(null);
    setSubmittingSignup(true);
    try {
      const result = await signup({ email: accountStep.email.trim(), password: accountStep.password });
      const tokenDto = await login({ email: accountStep.email.trim(), password: accountStep.password });
      saveTokens(tokenDto);
      setSignupResult(result);
      setWizardStep('identity');
    } catch (error) {
      setTermsError(error instanceof Error ? error.message : '회원가입에 실패했어요.');
    } finally {
      setSubmittingSignup(false);
    }
  };

  const handleStartIdentityVerification = () => {
    // TODO: PortOne SDK(IMP.init 등) 연동 후, 팝업 완료 시 받는 identityVerificationId를
    // api/authApi.ts의 verifyIdentity(identityVerificationId)로 전달하도록 교체.
    setIdentityMessage('PortOne 본인인증 SDK 연동 후 이용할 수 있어요. 지금은 건너뛰어도 가입에는 문제가 없어요.');
  };

  if (wizardStep === 'done' && signupResult) {
    return (
      <AuthLayout title="회원가입">
        <div className="flex flex-col gap-5 px-6 pt-6 pb-8">
          <div className="flex flex-col items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-[22px]" aria-hidden="true">
              ✅
            </span>
            <h2 className="text-center text-lg font-bold text-gray-900">가입 완료!</h2>
            <p className="text-center text-[13px] text-gray-500">홈즈님, 환영합니다 🎉</p>
            <p className="text-center text-[13px] text-gray-500">일반 사용자로 가입되었습니다. 이제 모든 서비스를 이용하실 수 있어요.</p>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">아이디</span>
              <span className="font-bold text-gray-900">{signupResult.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">이름</span>
              <span className="font-bold text-gray-900">{signupResult.name ?? '본인인증 후 표시돼요'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">계정 유형</span>
              <span className="font-bold text-primary">일반 사용자</span>
            </div>
          </div>

          <Button onClick={() => navigate('/')}>시작하기 →</Button>
        </div>
      </AuthLayout>
    );
  }

  if (wizardStep === 'identity') {
    return (
      <AuthLayout title="회원가입" steps={buildAuthSteps(STEP_LABELS, 4)}>
        <div className="flex flex-col gap-5 px-6 pt-6 pb-8">
          <div className="flex flex-col items-center gap-3">
            <span className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary-50 text-3xl" aria-hidden="true">
              📱
            </span>
            <h2 className="text-center text-lg font-bold text-gray-900">휴대폰 본인인증</h2>
            <p className="text-center text-[13px] text-gray-500">
              본인인증을 완료하면 실명이 등록되고 서비스 신뢰도가 올라가요 (선택 사항)
            </p>
          </div>

          {identityMessage && <HelperText>{identityMessage}</HelperText>}

          <Button onClick={handleStartIdentityVerification}>PortOne 본인인증 시작하기</Button>

          <button
            type="button"
            onClick={() => setWizardStep('done')}
            className="text-center text-[13px] text-gray-500 hover:text-primary"
          >
            나중에 할게요 (건너뛰기)
          </button>
        </div>
      </AuthLayout>
    );
  }

  if (wizardStep === 'terms') {
    return (
      <AuthLayout title="회원가입" steps={buildAuthSteps(STEP_LABELS, 3)}>
        <div className="flex flex-col gap-5 px-6 pt-6 pb-8">
          <h2 className="text-left text-lg font-bold text-gray-900">약관 동의</h2>

          <div
            className="flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-gray-200 p-4"
            onClick={toggleAllAgree}
          >
            <input type="checkbox" className="h-[18px] w-[18px] shrink-0 accent-primary" checked={allAgreed} readOnly />
            <span className="text-base font-bold text-gray-900">전체 약관에 동의합니다</span>
          </div>

          <div className="flex flex-col">
            <label className="flex cursor-pointer items-center gap-2.5 py-3">
              <input
                type="checkbox"
                className="h-[18px] w-[18px] shrink-0 accent-primary"
                checked={agreeService}
                onChange={(event) => setAgreeService(event.target.checked)}
              />
              <span className="flex-1 text-sm text-gray-900">서비스 이용약관 동의</span>
              <span className="rounded-md bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary">필수</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 py-3">
              <input
                type="checkbox"
                className="h-[18px] w-[18px] shrink-0 accent-primary"
                checked={agreePrivacy}
                onChange={(event) => setAgreePrivacy(event.target.checked)}
              />
              <span className="flex-1 text-sm text-gray-900">개인정보 수집 및 이용 동의</span>
              <span className="rounded-md bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary">필수</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 py-3">
              <input
                type="checkbox"
                className="h-[18px] w-[18px] shrink-0 accent-primary"
                checked={agreeLocation}
                onChange={(event) => setAgreeLocation(event.target.checked)}
              />
              <span className="flex-1 text-sm text-gray-900">위치정보 서비스 이용 동의</span>
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">선택</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 py-3">
              <input
                type="checkbox"
                className="h-[18px] w-[18px] shrink-0 accent-primary"
                checked={agreeMarketing}
                onChange={(event) => setAgreeMarketing(event.target.checked)}
              />
              <span className="flex-1 text-sm text-gray-900">마케팅 정보 수신 동의</span>
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">선택</span>
            </label>
          </div>

          {termsError && <ErrorText>{termsError}</ErrorText>}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setWizardStep('account')}
              disabled={submittingSignup}
            >
              이전
            </Button>
            <Button className="flex-[2]" onClick={handleSignup} disabled={!canSubmitSignup || submittingSignup}>
              {submittingSignup ? '가입 처리 중...' : '동의하고 가입하기'}
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="회원가입" steps={buildAuthSteps(STEP_LABELS, 2)}>
      <EmailAccountFields step={accountStep} onNext={() => setWizardStep('terms')} />
    </AuthLayout>
  );
}

export default SignupWizardPage;
