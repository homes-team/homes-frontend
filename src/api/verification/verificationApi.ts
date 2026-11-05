import { VerificationStatusInfo } from '../../types/verification';
import { apiGet, apiPost } from '../client';

/** 매물의 인증 현황 — GET /properties/{propertyId}/verifications */
export function fetchVerificationStatus(propertyId: number): Promise<VerificationStatusInfo> {
  return apiGet<VerificationStatusInfo>(`/properties/${propertyId}/verifications`);
}

/**
 * 집주인 등기부등본 인증 요청 — POST /properties/{propertyId}/verifications/owner (매물 등록자, 실명인증 완료 필요).
 * 등기부등본 이미지는 먼저 owner/presigned-url로 S3에 올리고 그 URL(documentUrl)을 넘긴다.
 * 서버가 비동기로 OCR 검증하므로 요청은 곧바로 끝나고, 결과는 fetchVerificationStatus로 확인한다.
 */
export function requestOwnerVerification(propertyId: number, documentUrl: string): Promise<string> {
  return apiPost<string>(`/properties/${propertyId}/verifications/owner`, { documentUrl }, { auth: true });
}
