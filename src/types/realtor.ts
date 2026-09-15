import { PropertyType, TradeType } from './property';

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
