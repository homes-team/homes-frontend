import { BidStatus, ReceivedBidListItem } from '../types/bid';

export type ReceivedBidFilter = 'ALL' | 'PENDING' | 'ACCEPTED' | 'CLOSED';

export const RECEIVED_BID_FILTER_LABEL: Record<ReceivedBidFilter, string> = {
  ALL: '전체',
  PENDING: '대기 중',
  ACCEPTED: '매칭 확정',
  CLOSED: '종료',
};

/** 종료: 거절·철회·취소된 제안서 */
const CLOSED_STATUSES: BidStatus[] = ['REJECTED', 'WITHDRAWN', 'CANCELLED'];

export function filterReceivedBids(bids: ReceivedBidListItem[], filter: ReceivedBidFilter): ReceivedBidListItem[] {
  if (filter === 'ALL') return bids;
  if (filter === 'CLOSED') return bids.filter((bid) => CLOSED_STATUSES.includes(bid.status));
  return bids.filter((bid) => bid.status === filter);
}

export interface PropertyBidGroup {
  propertyId: number;
  propertyTitle: string;
  propertyAddress: string;
  bids: ReceivedBidListItem[];
}

/** 매물별로 묶는다. 목록은 최신 입찰이 있는 매물이 먼저 오고, 매물 안에서도 최신 입찰이 먼저 온다 */
export function groupByProperty(bids: ReceivedBidListItem[]): PropertyBidGroup[] {
  const newestFirst = [...bids].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const groups = new Map<number, PropertyBidGroup>();

  newestFirst.forEach((bid) => {
    const group = groups.get(bid.propertyId);
    if (group) group.bids.push(bid);
    else
      groups.set(bid.propertyId, {
        propertyId: bid.propertyId,
        propertyTitle: bid.propertyTitle,
        propertyAddress: bid.propertyAddress,
        bids: [bid],
      });
  });

  return [...groups.values()];
}
