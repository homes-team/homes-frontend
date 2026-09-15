import { ChangeEvent, FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signupRealtor } from '../../api/authApi';
import { ApiError } from '../../api/client';
import { saveTokens } from '../../utils/auth';
import { buildAuthSteps } from '../../utils/authSteps';
import { RealtorSignupResult } from '../../types/auth';
import { useEmailAccountStep } from '../../hooks/useEmailAccountStep';
import AuthLayout from '../../components/auth/AuthLayout';
import EmailAccountFields from '../../components/auth/EmailAccountFields';
import Button from '../../components/ui/Button';
import { Field, Label, Input, HelperText, ErrorText } from '../../components/ui/Field';
import FileDropzone from './components/FileDropzone';

type WizardStep = 'account' | 'personal' | 'office' | 'documents' | 'done';

/** RealtorSignupReqDto.businessNum 검증 규칙과 동일: XXX-XX-XXXXX */
const BUSINESS_NUM_PATTERN = /^\d{3}-\d{2}-\d{5}$/;

const STEP_LABELS = ['가입 유형', '계정 정보', '개인 정보', '중개사 정보', '서류 제출', '완료'];

/**
 * Figma `/sign_up/agent/step2~4`를 기반으로, 여기에 없던 step5(서류 제출)와
 * step6(완료)는 백엔드 RealtorSignupReqDto가 실제로 요구하는 파일 업로드에 맞춰
 * 새로 설계해 추가했다.
 * "계정 정보" 단계는 일반 사용자 마법사(SignupWizardPage)와 완전히 동일한 로직이라
 * useEmailAccountStep 훅 + EmailAccountFields 컴포넌트로 공용화했다.
 *
 * 원본 와이어프레임과 다르게 조정한 부분:
 * - step3 "생년월일"·"성별" 필드는 제거했다. RealtorSignupReqDto/Agent 엔티티 어디에도
 *   대응 컬럼이 없다. 대신 DTO가 필수로 요구하는 "대표자 실명"(name) 필드를 새로 추가했다.
 * - step4 "중개사 등록번호"는 예시가 지자체 중개업 등록번호 형식이었지만, 백엔드
 *   `businessNum`은 사업자등록번호 형식(`123-45-67890`)만 허용해서 검증/예시만 교체했다.
 * - "사무소 주소"의 "주소 검색"은 지도 API 연동이 필요해 지금은 직접 입력 텍스트필드로
 *   대체했다. officeLatitude/officeLongitude는 이번엔 전송하지 않는다 (선택값이라 안전).
 * - 이미지는 실제 파일 그대로 signupRealtor()에 넘겨 /users/realtors 멀티파트 요청의
 *   businessCertImage/agentCertImage/profileImage 파트로 전송한다 (RealtorController 참고).
 */
function SignupAgentWizardPage() {
  const navigate = useNavigate();
  const [wizardStep, setWizardStep] = useState<WizardStep>('account');
  const accountStep = useEmailAccountStep();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [officeName, setOfficeName] = useState('');
  const [businessNum, setBusinessNum] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');

  const [businessCertImage, setBusinessCertImage] = useState<File | null>(null);
  const [agentCertImage, setAgentCertImage] = useState<File | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RealtorSignupResult | null>(null);
  const [documentsError, setDocumentsError] = useState<string | null>(null);

  const canGoToOffice = name.trim().length > 0 && phone.trim().length > 0;
  const handlePersonalNext = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canGoToOffice) return;
    setWizardStep('office');
  };

  const businessNumValid = BUSINESS_NUM_PATTERN.test(businessNum);
  const canGoToDocuments = officeName.trim().length > 0 && businessNumValid;
  const handleOfficeNext = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canGoToDocuments) return;
    setWizardStep('documents');
  };

  const canSubmit = Boolean(businessCertImage) && Boolean(agentCertImage);
  const [uploadStage, setUploadStage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setDocumentsError(null);
    setSubmitting(true);
    try {
      setUploadStage('가입 정보 제출 중...');
      const signupResult = await signupRealtor({
        email: accountStep.email.trim(),
        password: accountStep.password,
        name: name.trim(),
        phone: phone.trim(),
        officeName: officeName.trim(),
        businessNum: businessNum.trim(),
        officeAddress: officeAddress.trim() || undefined,
        businessCertImage: businessCertImage as File,
        agentCertImage: agentCertImage as File,
        profileImage: profileImage ?? undefined,
      });
      const tokenDto = await login({ email: accountStep.email.trim(), password: accountStep.password });
      saveTokens(tokenDto);
      setResult(signupResult);
      setWizardStep('done');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'REALTOR400_1') {
        setDocumentsError('이미 등록된 사업자등록번호예요. 중개사무소 정보를 다시 확인해주세요.');
      } else {
        setDocumentsError(error instanceof Error ? error.message : '가입 신청에 실패했어요.');
      }
    } finally {
      setUploadStage(null);
      setSubmitting(false);
    }
  };

  function handleFileChange(setter: (file: File | null) => void) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.files?.[0] ?? null);
    };
  }

  if (wizardStep === 'done' && result) {
    return (
      <AuthLayout title="회원가입">
        <div className="flex flex-col gap-5 px-6 pt-6 pb-8">
          <div className="flex flex-col items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-[22px]" aria-hidden="true">
              ⏳
            </span>
            <h2 className="text-center text-lg font-bold text-gray-900">서류 제출 완료!</h2>
            <p className="text-center text-[13px] text-gray-500">가입 신청이 접수됐어요. 관리자 승인 후 중개사 서비스를 이용하실 수 있어요.</p>
          </div>

          <p className="rounded-lg bg-[#fff9e7] p-3.5 text-xs leading-relaxed text-[#b56b0f]">
            승인 전에는 '준비 중' 상태로 표시되며, 승인 완료 시 이메일로 안내드려요.
          </p>

          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">아이디</span>
              <span className="font-bold text-gray-900">{result.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">중개사무소</span>
              <span className="font-bold text-gray-900">{result.officeName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">승인 상태</span>
              <span className="font-bold text-primary">{result.isVerified ? '승인 완료' : '승인 대기 중'}</span>
            </div>
          </div>

          <Button onClick={() => navigate('/')}>홈으로 가기 →</Button>
        </div>
      </AuthLayout>
    );
  }

  if (wizardStep === 'documents') {
    return (
      <AuthLayout title="회원가입" steps={buildAuthSteps(STEP_LABELS, 5)}>
        <div className="flex flex-col gap-5 px-6 pt-6 pb-8">
          <h2 className="text-left text-lg font-bold text-gray-900">서류 제출</h2>

          <p className="rounded-lg bg-[#fff9e7] p-3.5 text-xs leading-relaxed text-[#b56b0f]">
            제출하신 서류는 관리자 확인 후 승인되며, 승인 전까지는 매물 등록 등 일부 기능이 제한돼요.
          </p>

          <FileDropzone
            label="사업자등록증"
            required
            helper="JPG, PNG (최대 10MB)"
            file={businessCertImage}
            onChange={handleFileChange(setBusinessCertImage)}
          />
          <FileDropzone
            label="중개사무소 등록증"
            required
            helper="JPG, PNG (최대 10MB)"
            file={agentCertImage}
            onChange={handleFileChange(setAgentCertImage)}
          />
          <FileDropzone
            label="프로필 사진"
            required={false}
            helper="중개사 프로필에 사용돼요"
            file={profileImage}
            onChange={handleFileChange(setProfileImage)}
          />

          {documentsError && <ErrorText>{documentsError}</ErrorText>}

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setWizardStep('office')} disabled={submitting}>
              이전
            </Button>
            <Button className="flex-[2]" onClick={handleSubmit} disabled={!canSubmit || submitting}>
              {submitting ? uploadStage ?? '제출 중...' : '제출하고 가입 완료'}
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (wizardStep === 'office') {
    return (
      <AuthLayout title="회원가입" steps={buildAuthSteps(STEP_LABELS, 4)}>
        <form className="flex flex-col gap-5 px-6 pt-6 pb-8" onSubmit={handleOfficeNext} noValidate>
          <h2 className="text-left text-lg font-bold text-gray-900">중개사 정보 입력</h2>
          <p className="rounded-lg bg-[#fff9e7] p-3.5 text-xs leading-relaxed text-[#b56b0f]">
            입력하신 정보는 공인중개사 자격 확인에 사용됩니다. 정확한 정보를 입력해주세요.
          </p>

          <Field>
            <Label htmlFor="officeName">사무소 상호</Label>
            <Input
              id="officeName"
              type="text"
              placeholder="OO부동산중개사무소"
              value={officeName}
              onChange={(event) => setOfficeName(event.target.value)}
              required
            />
          </Field>

          <Field>
            <Label htmlFor="businessNum">중개사 등록번호</Label>
            <Input
              id="businessNum"
              type="text"
              placeholder="123-45-67890"
              value={businessNum}
              onChange={(event) => setBusinessNum(event.target.value)}
              required
            />
            <HelperText>사업자등록번호 형식으로 입력해주세요 (예: 123-45-67890)</HelperText>
            {businessNum.length > 0 && !businessNumValid && (
              <ErrorText>형식이 올바르지 않아요. 123-45-67890 형태로 입력해주세요.</ErrorText>
            )}
          </Field>

          <Field>
            <Label htmlFor="officeAddress">사무소 주소 (선택)</Label>
            <Input
              id="officeAddress"
              type="text"
              placeholder="서울시 강남구 테헤란로 123"
              value={officeAddress}
              onChange={(event) => setOfficeAddress(event.target.value)}
            />
            <HelperText>나중에 마이페이지에서도 등록/수정할 수 있어요</HelperText>
          </Field>

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setWizardStep('personal')}>
              이전
            </Button>
            <Button type="submit" className="flex-[2]" disabled={!canGoToDocuments}>
              다음
            </Button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  if (wizardStep === 'personal') {
    return (
      <AuthLayout title="회원가입" steps={buildAuthSteps(STEP_LABELS, 3)}>
        <form className="flex flex-col gap-5 px-6 pt-6 pb-8" onSubmit={handlePersonalNext} noValidate>
          <h2 className="text-left text-lg font-bold text-gray-900">담당자 정보 입력</h2>

          <Field>
            <Label htmlFor="name">대표자 실명</Label>
            <Input
              id="name"
              type="text"
              placeholder="홍길동"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />
          </Field>

          <Field>
            <Label htmlFor="phone">휴대폰 번호</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="010-1234-5678"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
              required
            />
            <HelperText>공인중개사 자격 확인에 사용되는 대표 연락처예요</HelperText>
          </Field>

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setWizardStep('account')}>
              이전
            </Button>
            <Button type="submit" className="flex-[2]" disabled={!canGoToOffice}>
              다음
            </Button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="회원가입" steps={buildAuthSteps(STEP_LABELS, 2)}>
      <EmailAccountFields step={accountStep} onNext={() => setWizardStep('personal')} />
    </AuthLayout>
  );
}

export default SignupAgentWizardPage;
