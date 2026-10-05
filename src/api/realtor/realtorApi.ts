import {
  AgentDashboardStats,
  AgentProfile,
  AgentUpdateProfileRequest,
  NearbyProperty,
  RealtorPublicProfile,
  ReviewCreateRequest,
  ReviewListItem,
} from '../../types/realtor';
import { MyBidListItem } from '../../types/bid';
import { apiGet, apiPatch, apiPost } from '../client';

/** 내(중개사) 프로필 조회 — GET /realtors/me */
export function fetchMyAgentProfile(): Promise<AgentProfile> {
  return apiGet<AgentProfile>('/realtors/me', { auth: true });
}

/** 내(중개사) 프로필 수정 — PATCH /realtors/me (부분 수정) */
export function updateMyAgentProfile(request: AgentUpdateProfileRequest): Promise<AgentProfile> {
  return apiPatch<AgentProfile>('/realtors/me', request, { auth: true });
}

/** 사무소 근처 매물 (거리순, 상위 20) — GET /realtors/me/properties/nearby */
export function fetchNearbyProperties(): Promise<NearbyProperty[]> {
  return apiGet<NearbyProperty[]>('/realtors/me/properties/nearby', { auth: true });
}

/** 아직 입찰 안 한 근처 매물 — GET /realtors/me/bids/available */
export function fetchAvailableBidProperties(): Promise<NearbyProperty[]> {
  return apiGet<NearbyProperty[]>('/realtors/me/bids/available', { auth: true });
}

/** 대시보드 통계 (이번 달 완료건수, 매물타입별 평균 확정수수료) — GET /realtors/me/stats */
export function fetchAgentDashboardStats(): Promise<AgentDashboardStats> {
  return apiGet<AgentDashboardStats>('/realtors/me/stats', { auth: true });
}

/**
 * ⚠️ 백엔드 미구현 — GET /realtors/me/bids
 * 내가 제출한 입찰 제안서 목록(상태/매물 정보 포함)을 조회한다. 백엔드팀에 API 스펙을
 * 별도로 전달해야 한다 (하단 docs/api-requests/realtor-my-bids.md 참고).
 */
export function fetchMyBids(): Promise<MyBidListItem[]> {
  return apiGet<MyBidListItem[]>('/realtors/me/bids', { auth: true });
}

/** 유저가 보는 중개사 공개 프로필 — GET /realtors/{realtorId} */
export function fetchRealtorPublicProfile(realtorId: number): Promise<RealtorPublicProfile> {
  return apiGet<RealtorPublicProfile>(`/realtors/${realtorId}`, { auth: true });
}

/** 중개사 리뷰 목록 (최신순) — GET /realtors/{realtorId}/reviews */
export function fetchRealtorReviews(realtorId: number): Promise<ReviewListItem[]> {
  return apiGet<ReviewListItem[]>(`/realtors/${realtorId}/reviews`, { auth: true });
}

/** 중개사 리뷰 작성 — POST /realtors/{realtorId}/reviews (일반 유저만, 본인당 1회) */
export function createRealtorReview(realtorId: number, request: ReviewCreateRequest): Promise<void> {
  return apiPost<void>(`/realtors/${realtorId}/reviews`, request, { auth: true });
}
