import { PropertyListItem, PropertyType, TradeType } from './property';

/** AgentProfileResDto.java 대응 — 중개사 본인 마이페이지 */
export interface AgentProfile {
  agentId: number;
  userId: number;
  email: string;
  officeName: string;
  officeAddress: string | null;
  businessNum: string;
  isVerified: boolean;
}

/** AgentUpdateProfileReqDto.java 대응 (부분 수정) */
export interface AgentUpdateProfileRequest {
  officeName?: string;
  officeAddress?: string;
  officeLatitude?: number;
  officeLongitude?: number;
}

/** NearbyPropertyResDto.java 대응 */
export interface NearbyProperty {
  propertyId: number;
  address: string;
  detailAddress: string;
  tradeType: TradeType;
  deposit: number;
  monthlyRent: number;
  desiredBrokerageFee: number | null;
  distanceInMeters: number;
}

/** AgentDashboardStatsResDto.java 대응 */
export interface AgentDashboardStats {
  thisMonthCompletedDealsCount: number;
  averageFeesByPropertyType: {
    propertyType: PropertyType;
    averageFee: number;
  }[];
}

/** RealtorPublicProfileResDto.java 대응 — 일반 유저가 보는 중개사 프로필 */
export interface RealtorPublicProfile {
  agentId: number;
  officeName: string;
  officeAddress: string | null;
  businessNum: string;
  isVerified: boolean;
  successRate: number | null;
  averageReviewScore: number | null;
  reviewCount: number;
}

/** ReviewCreateReqDto.java 대응 */
export interface ReviewCreateRequest {
  score: number;
  content?: string;
}

/** ReviewListRespDto.java 대응 */
export interface ReviewListItem {
  reviewId: number;
  score: number;
  content: string | null;
  reviewerNickname: string;
  createdAt: string;
}

/** PropertyRealtorInfoResDto.AgentSummaryResDto 대응 — 매물 상세에 보여주는 담당 중개사 */
export interface PropertyRealtor {
  agentId: number;
  officeName: string;
  officeAddress: string | null;
  isVerified: boolean;
  /**
   * (백엔드 미구현, 제안 스펙) 중개사 대표 연락처. 내려오기 전에는 undefined라서
   * 화면은 "전화번호 준비 중"으로 보여준다. docs/api-requests/realtor-contact.md 참고.
   */
  phone?: string | null;
}

/** PropertyRealtorInfoResDto.java 대응 — 아직 매칭된 중개사가 없으면 agent가 null */
export interface PropertyRealtorInfo {
  agent: PropertyRealtor | null;
  otherProperties: PropertyListItem[];
}
