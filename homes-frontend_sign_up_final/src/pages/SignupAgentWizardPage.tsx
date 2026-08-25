import { ChangeEvent, FormEvent, useState } from 'react';
import { login, signupRealtor } from '../api/authApi';
import { ApiError } from '../api/client';
import { saveTokens } from '../utils/auth';
import { buildAuthSteps } from '../utils/authSteps';
import { RealtorSignupResult } from '../types/auth';
import { useEmailAccountStep } from '../hooks/useEmailAccountStep';
import AuthLayout from '../components/auth/AuthLayout';
import EmailAccountFields from '../components/auth/EmailAccountFields';
import formStyles from '../components/auth/AuthForm.module.css';

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
 *   대응 컬럼이 없다. 대신 DTO가 필수로 요구하는 "대표자 실명"(name) 필드를 새로 추가했다
 *   (일반 사용자 가입과 달리, 중개사는 실명을 PortOne 인증 없이 신고 형태로 직접 입력받는다).
 * - step4 "중개사 등록번호"는 예시가 "11350-2024-00001"(지자체 중개업 등록번호 형식)였지만,
 *   백엔드 `businessNum`은 사업자등록번호 형식(`123-45-67890`, 정규식 `\d{3}-\d{2}-\d{5}`)만
 *   허용한다. 라벨은 그대로 두고, 형식 검증과 안내 문구만 실제 백엔드 규칙에 맞게 바꿨다.
 * - "사무소 주소"의 "주소 검색" 버튼은 Kakao/Daum 우편번호 API 연동이 필요한데 아직 키가
 *   없어서, 지금은 그냥 직접 입력하는 텍스트 필드로 대체했다. officeLatitude/officeLongitude는
 *   지도 API 없이는 값을 만들 수 없어 이번엔 전송하지 않는다 (백엔드에서도 선택 값이라
 *   비워도 가입에는 문제없다).
 */
function SignupAgentWizardPage() {
  const [wizardStep, setWizardStep] = useState<WizardStep>('account');
  const accountStep = useEmailAccountStep();

  // 개인 정보
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // 중개사 정보
  const [officeName, setOfficeName] = useState('');
  const [businessNum, setBusinessNum] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');

  // 서류 제출
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

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setDocumentsError(null);
    setSubmitting(true);
    try {
      const signupResult = await signupRealtor(
        {
          email: accountStep.email.trim(),
          password: accountStep.password,
          name: name.trim(),
          phone: phone.trim(),
          officeName: officeName.trim(),
          businessNum: businessNum.trim(),
          officeAddress: officeAddress.trim() || undefined,
        },
        {
          businessCertImage: businessCertImage as File,
          agentCertImage: agentCertImage as File,
          profileImage: profileImage ?? undefined,
        }
      );
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
      setSubmitting(false);
    }
  };

  function handleFileChange(setter: (file: File | null) => void) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.files?.[0] ?? null);
    };
  }

  function FileDropzone({
    label,
    required,
    helper,
    file,
    onChange,
  }: {
    label: string;
    required: boolean;
    helper: string;
    file: File | null;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  }) {
    return (
      <div className={formStyles.field}>
        <label className={formStyles.label}>{required ? `${label} *` : `${label} (선택)`}</label>
        <label className={`${formStyles.dropzone} ${file ? formStyles.dropzoneFilled : ''}`}>
          <span aria-hidden="true">📄</span>
          {file ? (
            <span className={formStyles.dropzoneFileName}>{file.name}</span>
          ) : (
            <span className={formStyles.dropzoneLabel}>클릭해서 이미지 업로드</span>
          )}
          <span className={formStyles.dropzoneHelper}>{helper}</span>
          <input type="file" accept="image/*" onChange={onChange} style={{ display: 'none' }} />
        </label>
      </div>
    );
  }

  if (wizardStep === 'done' && result) {
    return (
      <AuthLayout title="회원가입">
        <div className={formStyles.form}>
          <div className={formStyles.intro}>
            <span className={formStyles.iconCircle} aria-hidden="true">
              ⏳
            </span>
            <h2 className={formStyles.introTitle}>서류 제출 완료!</h2>
            <p className={formStyles.introSubtitle}>가입 신청이 접수됐어요. 관리자 승인 후 중개사 서비스를 이용하실 수 있어요.</p>
          </div>

          <p className={formStyles.noticeBox}>승인 전에는 '준비 중' 상태로 표시되며, 승인 완료 시 이메일로 안내드려요.</p>

          <div className={formStyles.summaryBox}>
            <div className={formStyles.summaryRow}>
              <span className={formStyles.summaryLabel}>아이디</span>
              <span className={formStyles.summaryValue}>{result.email}</span>
            </div>
            <div className={formStyles.summaryRow}>
              <span className={formStyles.summaryLabel}>중개사무소</span>
              <span className={formStyles.summaryValue}>{result.officeName}</span>
            </div>
            <div className={formStyles.summaryRow}>
              <span className={formStyles.summaryLabel}>승인 상태</span>
              <span className={formStyles.summaryStatusPending}>
                {result.isVerified ? '승인 완료' : '승인 대기 중'}
              </span>
            </div>
          </div>

          <a href="/" className={formStyles.submit} style={{ textAlign: 'center' }}>
            홈으로 가기 →
          </a>
        </div>
      </AuthLayout>
    );
  }

  if (wizardStep === 'documents') {
    return (
      <AuthLayout title="회원가입" steps={buildAuthSteps(STEP_LABELS, 5)}>
        <div className={formStyles.form}>
          <h2 className={formStyles.introTitle} style={{ textAlign: 'left' }}>
            서류 제출
          </h2>

          <p className={formStyles.noticeBox}>
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

          {documentsError && (
            <p className={formStyles.errorMessage} role="alert">
              {documentsError}
            </p>
          )}

          <div className={formStyles.stepNav}>
            <button
              type="button"
              className={formStyles.buttonSecondary}
              onClick={() => setWizardStep('office')}
              disabled={submitting}
            >
              이전
            </button>
            <button
              type="button"
              className={`${formStyles.submit} ${formStyles.stepNavPrimary}`}
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
            >
              {submitting ? '제출 중...' : '제출하고 가입 완료'}
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (wizardStep === 'office') {
    return (
      <AuthLayout title="회원가입" steps={buildAuthSteps(STEP_LABELS, 4)}>
        <form className={formStyles.form} onSubmit={handleOfficeNext} noValidate>
          <h2 className={formStyles.introTitle} style={{ textAlign: 'left' }}>
            중개사 정보 입력
          </h2>
          <p className={formStyles.noticeBox}>입력하신 정보는 공인중개사 자격 확인에 사용됩니다. 정확한 정보를 입력해주세요.</p>

          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="officeName">
              사무소 상호
            </label>
            <input
              id="officeName"
              type="text"
              className={formStyles.input}
              placeholder="OO부동산중개사무소"
              value={officeName}
              onChange={(event) => setOfficeName(event.target.value)}
              required
            />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="businessNum">
              중개사 등록번호
            </label>
            <input
              id="businessNum"
              type="text"
              className={formStyles.input}
              placeholder="123-45-67890"
              value={businessNum}
              onChange={(event) => setBusinessNum(event.target.value)}
              required
            />
            <p className={formStyles.helperText}>사업자등록번호 형식으로 입력해주세요 (예: 123-45-67890)</p>
            {businessNum.length > 0 && !businessNumValid && (
              <p className={formStyles.errorMessage} style={{ marginTop: 0 }}>
                형식이 올바르지 않아요. 123-45-67890 형태로 입력해주세요.
              </p>
            )}
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="officeAddress">
              사무소 주소 (선택)
            </label>
            <input
              id="officeAddress"
              type="text"
              className={formStyles.input}
              placeholder="서울시 강남구 테헤란로 123"
              value={officeAddress}
              onChange={(event) => setOfficeAddress(event.target.value)}
            />
            <p className={formStyles.helperText}>나중에 마이페이지에서도 등록/수정할 수 있어요</p>
          </div>

          <div className={formStyles.stepNav}>
            <button type="button" className={formStyles.buttonSecondary} onClick={() => setWizardStep('personal')}>
              이전
            </button>
            <button
              type="submit"
              className={`${formStyles.submit} ${formStyles.stepNavPrimary}`}
              disabled={!canGoToDocuments}
            >
              다음
            </button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  if (wizardStep === 'personal') {
    return (
      <AuthLayout title="회원가입" steps={buildAuthSteps(STEP_LABELS, 3)}>
        <form className={formStyles.form} onSubmit={handlePersonalNext} noValidate>
          <h2 className={formStyles.introTitle} style={{ textAlign: 'left' }}>
            담당자 정보 입력
          </h2>

          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="name">
              대표자 실명
            </label>
            <input
              id="name"
              type="text"
              className={formStyles.input}
              placeholder="홍길동"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="phone">
              휴대폰 번호
            </label>
            <input
              id="phone"
              type="tel"
              className={formStyles.input}
              placeholder="010-1234-5678"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
              required
            />
            <p className={formStyles.helperText}>공인중개사 자격 확인에 사용되는 대표 연락처예요</p>
          </div>

          <div className={formStyles.stepNav}>
            <button type="button" className={formStyles.buttonSecondary} onClick={() => setWizardStep('account')}>
              이전
            </button>
            <button
              type="submit"
              className={`${formStyles.submit} ${formStyles.stepNavPrimary}`}
              disabled={!canGoToOffice}
            >
              다음
            </button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  // wizardStep === 'account'
  return (
    <AuthLayout title="회원가입" steps={buildAuthSteps(STEP_LABELS, 2)}>
      <EmailAccountFields step={accountStep} onNext={() => setWizardStep('personal')} />
    </AuthLayout>
  );
}

export default SignupAgentWizardPage;
