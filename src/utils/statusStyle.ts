import { BadgeVariant } from '../components/ui/Badge';
import { BidStatus } from '../types/bid';
import { PropertyStatus } from '../types/property';

/**
 * 상태별 뱃지 색. 진행 중(주황) → 확정/완료(초록) → 끝난 것(회색·빨강)이 한눈에 구분되도록 한다.
 * 같은 의미는 입찰과 매물에서 같은 색을 쓴다: 진행 중 = 주황, 성사 = 초록.
 */
export const BID_STATUS_VARIANT: Record<BidStatus, BadgeVariant> = {
  PENDING: 'warning', // 대기 중 — 아직 협상·선택 단계
  ACCEPTED: 'success', // 매칭 확정
  REJECTED: 'danger', // 집주인이 거절
  WITHDRAWN: 'default', // 중개사가 철회
  CANCELLED: 'default', // 확정 후 취소
};

export const PROPERTY_STATUS_VARIANT: Record<PropertyStatus, BadgeVariant> = {
  AVAILABLE: 'primary', // 광고 중
  MATCHED: 'warning', // 매칭 진행 중
  COMPLETED: 'success', // 거래 완료
  HIDDEN: 'default', // 숨김
  DELETED: 'danger', // 삭제됨
};
