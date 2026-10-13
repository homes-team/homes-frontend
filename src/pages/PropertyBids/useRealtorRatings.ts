import { useEffect, useMemo, useState } from 'react';
import { fetchRealtorPublicProfile } from '../../api/realtor/realtorApi';
import { BidListItem } from '../../types/bid';
import { BidderRating } from '../../utils/bidSort';

/**
 * 입찰자(agentId)별 평점.
 * 백엔드가 입찰 목록에 평점을 내려주면 그 값을 쓰고(docs/api-requests/bid-list-realtor-rating.md),
 * 아직 없으면 입찰자마다 중개사 프로필을 조회해 채운다. 조회에 실패한 입찰자는 평점 없이 둔다.
 */
export function useRealtorRatings(bids: BidListItem[]): Record<number, BidderRating> {
  const [fetched, setFetched] = useState<Record<number, BidderRating>>({});

  const missingAgentIds = [...new Set(bids.filter((bid) => bid.averageReviewScore === undefined).map((bid) => bid.agentId))]
    .sort((a, b) => a - b)
    .join(',');

  useEffect(() => {
    if (!missingAgentIds) return;
    let cancelled = false;

    Promise.all(
      missingAgentIds.split(',').map((agentId) =>
        fetchRealtorPublicProfile(Number(agentId))
          .then((profile): [number, BidderRating] => [Number(agentId), { score: profile.averageReviewScore, count: profile.reviewCount }])
          .catch(() => null),
      ),
    ).then((entries) => {
      if (cancelled) return;
      const loaded = entries.filter((entry): entry is [number, BidderRating] => entry !== null);
      setFetched((prev) => ({ ...prev, ...Object.fromEntries(loaded) }));
    });

    return () => {
      cancelled = true;
    };
  }, [missingAgentIds]);

  return useMemo(() => {
    const ratings = { ...fetched };
    bids.forEach((bid) => {
      if (bid.averageReviewScore !== undefined) {
        ratings[bid.agentId] = { score: bid.averageReviewScore, count: bid.reviewCount ?? 0 };
      }
    });
    return ratings;
  }, [bids, fetched]);
}
