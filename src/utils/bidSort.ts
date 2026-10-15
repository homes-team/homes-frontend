import { BidListItem } from '../types/bid';

export type BidSort = 'LATEST' | 'LOWEST_FEE' | 'HIGHEST_RATING';

export const BID_SORT_LABEL: Record<BidSort, string> = {
  LATEST: '최신순',
  LOWEST_FEE: '수수료 낮은 순',
  HIGHEST_RATING: '평점 높은 순',
};

/** 입찰자 평점. 아직 리뷰가 없으면 score가 null */
export interface BidderRating {
  score: number | null;
  count: number;
}

const byLatest = (a: BidListItem, b: BidListItem) => Date.parse(b.createdAt) - Date.parse(a.createdAt);

/** 집주인이 입찰자를 비교할 수 있게 정렬한다. 같은 값이면 최신 입찰이 먼저 온다 */
export function sortBids(bids: BidListItem[], sort: BidSort, ratings: Record<number, BidderRating>): BidListItem[] {
  const list = [...bids];

  if (sort === 'LOWEST_FEE') {
    return list.sort((a, b) => a.proposedFee - b.proposedFee || byLatest(a, b));
  }

  if (sort === 'HIGHEST_RATING') {
    // 평점이 없는(리뷰 0건·조회 실패) 입찰자는 맨 뒤로 보낸다
    const score = (bid: BidListItem) => ratings[bid.agentId]?.score ?? -1;
    const count = (bid: BidListItem) => ratings[bid.agentId]?.count ?? 0;
    return list.sort((a, b) => score(b) - score(a) || count(b) - count(a) || byLatest(a, b));
  }

  return list.sort(byLatest);
}
