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
  /**
   * (백엔드 미구현, 제안 스펙) 프로필 사진 URL. 내려오기 전에는 undefined라서
   * 화면은 사무소명 첫 글자 아바타로 보여준다. docs/api-requests/realtor-profile-photo.md 참고.
   */
  profileImageUrl?: string | null;
}

/** AgentUpdateProfileReqDto.java 대응 (부분 수정) */
export interface AgentUpdateProfileRequest {
  officeName?: string;
  officeAddress?: string;
  /** (백엔드 미구현, 제안 스펙) presigned URL로 S3에 올린 사진의 최종 URL */
  profileImageUrl?: string;
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
