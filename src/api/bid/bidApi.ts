import { BidCreateRequest, BidListItem, NegotiationListItem, NegotiationRequest } from '../../types/bid';
import { apiGet, apiPost } from '../client';

/** 입찰서 제출 — POST /properties/{propertyId}/bids (중개사 전용) */
export function createBid(propertyId: number, request: BidCreateRequest): Promise<void> {
  return apiPost<void>(`/properties/${propertyId}/bids`, request, { auth: true });
}

/** 매물에 들어온 입찰서 목록 조회 — GET /properties/{propertyId}/bids (집주인 전용) */
export function fetchBidsForProperty(propertyId: number): Promise<BidListItem[]> {
  return apiGet<BidListItem[]>(`/properties/${propertyId}/bids`, { auth: true });
}

/** 입찰서의 협상(역제안) 내역 조회 — GET /properties/{propertyId}/bids/{bidId}/negotiations */
export function fetchNegotiations(propertyId: number, bidId: number): Promise<NegotiationListItem[]> {
  return apiGet<NegotiationListItem[]>(`/properties/${propertyId}/bids/${bidId}/negotiations`, { auth: true });
}

/** 협상(역제안) 등록 — POST /properties/{propertyId}/bids/{bidId}/negotiations */
export function createNegotiation(
  propertyId: number,
  bidId: number,
  request: NegotiationRequest,
): Promise<void> {
  return apiPost<void>(`/properties/${propertyId}/bids/${bidId}/negotiations`, request, { auth: true });
}

/** 입찰 수락(매칭 확정) — POST /properties/{propertyId}/bids/{bidId}/accept (집주인 전용) */
export function acceptBid(propertyId: number, bidId: number): Promise<void> {
  return apiPost<void>(`/properties/${propertyId}/bids/${bidId}/accept`, {}, { auth: true });
}

/** 매칭 취소 — POST /properties/{propertyId}/bids/{bidId}/cancel (집주인/매칭된 중개사) */
export function cancelBid(propertyId: number, bidId: number): Promise<void> {
  return apiPost<void>(`/properties/${propertyId}/bids/${bidId}/cancel`, {}, { auth: true });
}

/** 거래 완료 처리 — POST /properties/{propertyId}/bids/{bidId}/complete (집주인 전용) */
export function completeBid(propertyId: number, bidId: number): Promise<void> {
  return apiPost<void>(`/properties/${propertyId}/bids/${bidId}/complete`, {}, { auth: true });
}
