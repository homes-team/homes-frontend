import { renderHook, waitFor } from '@testing-library/react';
import { fetchRealtorPublicProfile } from '../../api/realtor/realtorApi';
import { BidListItem } from '../../types/bid';
import { useRealtorRatings } from './useRealtorRatings';

vi.mock('../../api/realtor/realtorApi', () => ({ fetchRealtorPublicProfile: vi.fn() }));

const bid = (bidId: number, agentId: number, rating?: Pick<BidListItem, 'averageReviewScore' | 'reviewCount'>): BidListItem => ({
  bidId, agentId, officeName: `중개사${agentId}`, profileImageUrl: null, proposedFee: 0.4, content: null,
  status: 'PENDING', createdAt: '2026-10-01T00:00:00', ...rating,
});

const profile = (agentId: number, averageReviewScore: number | null, reviewCount: number) => ({
  agentId, officeName: '', officeAddress: null, businessNum: '', isVerified: true, successRate: null, averageReviewScore, reviewCount,
});

beforeEach(() => vi.resetAllMocks());

describe('useRealtorRatings', () => {
  it('fills ratings from each bidder profile when the bid list has none', async () => {
    vi.mocked(fetchRealtorPublicProfile).mockImplementation(async (id) => profile(id, id === 1 ? 4.5 : null, id === 1 ? 8 : 0));
    const bids = [bid(1, 1), bid(2, 2)];
    const { result } = renderHook(() => useRealtorRatings(bids));

    await waitFor(() => expect(result.current).toEqual({ 1: { score: 4.5, count: 8 }, 2: { score: null, count: 0 } }));
  });

  it('asks once per realtor even when the realtor bid twice', async () => {
    vi.mocked(fetchRealtorPublicProfile).mockResolvedValue(profile(1, 5, 1));
    const bids = [bid(1, 1), bid(2, 1)];
    const { result } = renderHook(() => useRealtorRatings(bids));

    await waitFor(() => expect(result.current[1]).toEqual({ score: 5, count: 1 }));
    expect(fetchRealtorPublicProfile).toHaveBeenCalledTimes(1);
  });

  it('uses the rating the bid list already carries without any request', () => {
    const bids = [bid(1, 1, { averageReviewScore: 3.5, reviewCount: 2 }), bid(2, 2, { averageReviewScore: null, reviewCount: 0 })];
    const { result } = renderHook(() => useRealtorRatings(bids));

    expect(result.current).toEqual({ 1: { score: 3.5, count: 2 }, 2: { score: null, count: 0 } });
    expect(fetchRealtorPublicProfile).not.toHaveBeenCalled();
  });

  it('leaves a realtor unrated when the profile cannot be loaded', async () => {
    vi.mocked(fetchRealtorPublicProfile).mockImplementation(async (id) => {
      if (id === 2) throw new Error('boom');
      return profile(id, 4, 3);
    });
    const bids = [bid(1, 1), bid(2, 2)];
    const { result } = renderHook(() => useRealtorRatings(bids));

    await waitFor(() => expect(result.current[1]).toEqual({ score: 4, count: 3 }));
    expect(result.current[2]).toBeUndefined();
  });
});
