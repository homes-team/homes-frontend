/** BidStatus.java 대응 */
export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export const BID_STATUS_LABEL: Record<BidStatus, string> = {
  PENDING: '대기 중',
  ACCEPTED: '매칭 확정',
  REJECTED: '거절됨',
  CANCELLED: '취소됨',
};

/** BidCreateReqDto.java 대응 */
export interface BidCreateRequest {
  proposedFee: number;
  content?: string;
}

/** BidListRespDto.java 대응 */
export interface BidListItem {
  bidId: number;
  agentId: number;
  officeName: string;
  profileImageUrl: string | null;
  proposedFee: number;
  content: string | null;
  status: BidStatus;
  createdAt: string;
}

/** NegotiationReqDto.java 대응 */
export interface NegotiationRequest {
  suggestedFee: number;
  message?: string;
}

/** NegotiationListResDto.java 대응 */
export interface NegotiationListItem {
  negotiationId: number;
  senderRole: 'USER' | 'AGENT';
  suggestedFee: number;
  message: string | null;
  createdAt: string;
}
