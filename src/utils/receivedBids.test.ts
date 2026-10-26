import { BidStatus, ReceivedBidListItem } from '../types/bid';
import { filterReceivedBids, groupByProperty } from './receivedBids';

const bid = (bidId: number, propertyId: number, status: BidStatus, createdAt: string): ReceivedBidListItem => ({
  bidId, propertyId, propertyTitle: `매물${propertyId}`, propertyAddress: `주소${propertyId}`, agentId: bidId, officeName: `중개사${bidId}`,
  profileImageUrl: null, proposedFee: 0.4, content: null, status, createdAt,
});

const bids = [
  bid(1, 10, 'PENDING', '2026-10-01T09:00:00'),
  bid(2, 20, 'ACCEPTED', '2026-10-02T09:00:00'),
  bid(3, 10, 'REJECTED', '2026-10-03T09:00:00'),
  bid(4, 20, 'WITHDRAWN', '2026-10-04T09:00:00'),
  bid(5, 30, 'CANCELLED', '2026-10-05T09:00:00'),
];
const ids = (list: ReceivedBidListItem[]) => list.map((item) => item.bidId);

describe('filterReceivedBids', () => {
  it('keeps everything for ALL', () => {
    expect(ids(filterReceivedBids(bids, 'ALL'))).toEqual([1, 2, 3, 4, 5]);
  });

  it('filters one status', () => {
    expect(ids(filterReceivedBids(bids, 'PENDING'))).toEqual([1]);
    expect(ids(filterReceivedBids(bids, 'ACCEPTED'))).toEqual([2]);
  });

  it('treats rejected, withdrawn and cancelled as closed', () => {
    expect(ids(filterReceivedBids(bids, 'CLOSED'))).toEqual([3, 4, 5]);
  });
});

describe('groupByProperty', () => {
  it('groups bids by property, newest bid first inside and newest property first overall', () => {
    const groups = groupByProperty(bids);

    expect(groups.map((group) => group.propertyId)).toEqual([30, 20, 10]);
    expect(ids(groups[1].bids)).toEqual([4, 2]);
    expect(ids(groups[2].bids)).toEqual([3, 1]);
  });

  it('carries the property title and address for the group header', () => {
    expect(groupByProperty(bids)[2]).toMatchObject({ propertyTitle: '매물10', propertyAddress: '주소10' });
  });

  it('returns nothing for no bids', () => {
    expect(groupByProperty([])).toEqual([]);
  });
});
