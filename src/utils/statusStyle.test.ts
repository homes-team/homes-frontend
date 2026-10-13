import { BID_STATUS_LABEL, BidStatus } from '../types/bid';
import { PROPERTY_STATUS_LABEL, PropertyStatus } from '../types/property';
import { BID_STATUS_VARIANT, PROPERTY_STATUS_VARIANT } from './statusStyle';

describe('status badge colors', () => {
  it('has a color for every bid and property status', () => {
    expect(Object.keys(BID_STATUS_VARIANT).sort()).toEqual(Object.keys(BID_STATUS_LABEL).sort());
    expect(Object.keys(PROPERTY_STATUS_VARIANT).sort()).toEqual(Object.keys(PROPERTY_STATUS_LABEL).sort());
  });

  it('separates a pending bid (in progress) from a confirmed match', () => {
    expect(BID_STATUS_VARIANT.PENDING).toBe('warning');
    expect(BID_STATUS_VARIANT.ACCEPTED).toBe('success');
    expect(BID_STATUS_VARIANT.REJECTED).toBe('danger');
  });

  it('uses the same color for the same meaning on bids and properties', () => {
    // 진행 중 = 주황, 성사 = 초록
    expect(PROPERTY_STATUS_VARIANT.MATCHED).toBe(BID_STATUS_VARIANT.PENDING);
    expect(PROPERTY_STATUS_VARIANT.COMPLETED).toBe(BID_STATUS_VARIANT.ACCEPTED);
  });

  it('keeps matching-in-progress and completed properties visually distinct', () => {
    const matched: PropertyStatus = 'MATCHED';
    const completed: PropertyStatus = 'COMPLETED';
    expect(PROPERTY_STATUS_VARIANT[matched]).not.toBe(PROPERTY_STATUS_VARIANT[completed]);
  });

  it('gives each active bid status its own color', () => {
    const active: BidStatus[] = ['PENDING', 'ACCEPTED', 'REJECTED'];
    expect(new Set(active.map((status) => BID_STATUS_VARIANT[status])).size).toBe(active.length);
  });
});
