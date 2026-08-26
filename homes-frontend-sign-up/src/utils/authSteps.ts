import { AuthStep } from '../components/auth/AuthLayout';

/**
 * 회원가입 마법사 스테퍼 상태 배열 생성.
 * @param labels 전체 단계 라벨 (예: ['가입 유형', '계정 정보', '약관 동의', '본인인증'])
 * @param activeStepNumber 현재 활성 단계 번호 (1부터 시작, labels 인덱스+1과 동일)
 */
export function buildAuthSteps(labels: string[], activeStepNumber: number): AuthStep[] {
  return labels.map((label, index) => {
    const stepNumber = index + 1;
    if (stepNumber < activeStepNumber) return { label, status: 'done' as const };
    if (stepNumber === activeStepNumber) return { label, status: 'active' as const };
    return { label, status: 'upcoming' as const };
  });
}
