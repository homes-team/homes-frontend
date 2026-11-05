import { useEffect, useState } from 'react';
import { fetchVerificationStatus } from '../api/verification/verificationApi';

interface VerificationFlags {
  isOwnerVerified?: boolean;
  isRealtorVerified?: boolean;
}

export interface PropertyVerification {
  /** null이면 아직 모르는 상태(조회 전이거나 실패) — 미인증 안내를 띄우지 않는다 */
  isOwnerVerified: boolean | null;
  isRealtorVerified: boolean | null;
}

/**
 * 매물의 인증 여부. 매물 응답에 인증 값이 들어 있으면 그것을 쓰고,
 * 없으면 GET /properties/{id}/verifications로 따로 조회한다.
 */
export function usePropertyVerification(propertyId: number, property: VerificationFlags | null): PropertyVerification {
  const [fetched, setFetched] = useState<PropertyVerification>({ isOwnerVerified: null, isRealtorVerified: null });
  const hasOwnValue = property?.isOwnerVerified !== undefined && property?.isRealtorVerified !== undefined;

  useEffect(() => {
    if (!property || hasOwnValue) return;
    let cancelled = false;
    setFetched({ isOwnerVerified: null, isRealtorVerified: null });
    fetchVerificationStatus(propertyId)
      .then((info) => {
        if (!cancelled) setFetched({ isOwnerVerified: info.isOwnerVerified, isRealtorVerified: info.isRealtorVerified });
      })
      .catch(() => {
        /* 조회 실패 시에는 마크도 안내도 보여주지 않는다 */
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId, property === null, hasOwnValue]);

  if (hasOwnValue) {
    return { isOwnerVerified: property!.isOwnerVerified ?? null, isRealtorVerified: property!.isRealtorVerified ?? null };
  }
  return fetched;
}
