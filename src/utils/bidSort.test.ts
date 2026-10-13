import { BidListItem } from '../types/bid';
import { BidderRating, sortBids } from './bidSort';

const bid = (bidId: number, agentId: number, proposedFee: number, createdAt: string): BidListItem => ({
  bidId, agentId, officeName: `중개사${agentId}`, profileImageUrl: null, proposedFee, content: null, status: 'PENDING', createdAt,
});

const bids = [
  bid(1, 10, 0.4, '2026-10-01T09:00:00'),
  bid(2, 20, 0.3, '2026-10-03T09:00:00'),
  bid(3, 30, 0.3, '2026-10-02T09:00:00'),
  bid(4, 40, 0.5, '2026-10-04T09:00:00'),
];
const ratings: Record<number, BidderRating> = {
  10: { score: 4.5, count: 8 },
  20: { score: 4.5, count: 20 },
  30: { score: null, count: 0 },
  // 40번은 조회에 실패해 평점 정보 자체가 없다
};
const ids = (list: BidListItem[]) => list.map((item) => item.bidId);

describe('sortBids', () => {
  it('puts the newest bid first by default', () => {
    expect(ids(sortBids(bids, 'LATEST', ratings))).toEqual([4, 2, 3, 1]);
  });

  it('orders by the lowest fee and breaks a tie with the newer bid', () => {
    expect(ids(sortBids(bids, 'LOWEST_FEE', ratings))).toEqual([2, 3, 1, 4]);
  });

  it('orders by rating, then review count, and sends unrated bidders last', () => {
    expect(ids(sortBids(bids, 'HIGHEST_RATING', ratings))).toEqual([2, 1, 4, 3]);
  });

  it('does not reorder the list it was given', () => {
    const before = ids(bids);
    sortBids(bids, 'LOWEST_FEE', ratings);

    expect(ids(bids)).toEqual(before);
  });
});
