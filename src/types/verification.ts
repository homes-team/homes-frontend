/** VerificationStatus.java 대응 */
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';

/** VerificationStatusRespDto.java 대응 — 한 매물의 집주인·중개사 인증 현황 */
export interface VerificationStatusInfo {
  isOwnerVerified: boolean;
  /** 집주인 서류 인증 상세 상태. 아직 서류를 낸 적이 없으면 null */
  ownerStatus: VerificationStatus | null;
  isRealtorVerified: boolean;
  realtorStatus: VerificationStatus | null;
}
