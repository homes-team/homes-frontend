import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fetchBidsForProperty } from '../../api/bid/bidApi';
import { fetchRealtorPublicProfile } from '../../api/realtor/realtorApi';
import { BidListItem } from '../../types/bid';
import PropertyBidsPage from './index';

vi.mock('../../api/bid/bidApi', () => ({
  fetchBidsForProperty: vi.fn(),
  acceptBid: vi.fn(),
  rejectBid: vi.fn(),
  cancelBid: vi.fn(),
  completeBid: vi.fn(),
}));
vi.mock('../../api/realtor/realtorApi', () => ({ fetchRealtorPublicProfile: vi.fn() }));
vi.mock('../../api/chat/chatApi', () => ({ createChatRoom: vi.fn() }));
vi.mock('./components/NegotiationThread', () => ({ default: () => null }));
vi.mock('../../components/layout/PageShell', () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));

const bid = (bidId: number, agentId: number, officeName: string, proposedFee: number, createdAt: string): BidListItem => ({
  bidId, agentId, officeName, profileImageUrl: null, proposedFee, content: null, status: 'PENDING', createdAt,
});

const RATINGS: Record<number, { averageReviewScore: number | null; reviewCount: number }> = {
  1: { averageReviewScore: 3.5, reviewCount: 4 },
  2: { averageReviewScore: 4.8, reviewCount: 30 },
  3: { averageReviewScore: null, reviewCount: 0 },
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/properties/9/bids']}>
      <Routes><Route path="/properties/:propertyId/bids" element={<PropertyBidsPage />} /></Routes>
    </MemoryRouter>,
  );

/** 화면에 보이는 입찰 카드의 중개사 이름 순서 */
const officeOrder = () => screen.getAllByRole('button', { name: /부동산$/ }).map((button) => button.textContent);

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(fetchBidsForProperty).mockResolvedValue([
    bid(11, 1, '가나부동산', 0.3, '2026-10-01T00:00:00'),
    bid(12, 2, '다라부동산', 0.5, '2026-10-02T00:00:00'),
    bid(13, 3, '마바부동산', 0.4, '2026-10-03T00:00:00'),
  ]);
  vi.mocked(fetchRealtorPublicProfile).mockImplementation(async (agentId) => ({
    agentId, officeName: '', officeAddress: null, businessNum: '', isVerified: true, successRate: null, ...RATINGS[agentId],
  }));
});

describe('PropertyBidsPage', () => {
  it('shows each bidder rating beside the bid so bidders can be compared', async () => {
    renderPage();

    expect(await screen.findByRole('img', { name: '평점 4.8점 (30건)' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '평점 3.5점 (4건)' })).toBeInTheDocument();
    expect(await screen.findByText('아직 받은 평점이 없어요')).toBeInTheDocument();
  });

  it('lists the newest bid first and lets the homeowner sort by fee or rating', async () => {
    renderPage();
    await screen.findByRole('img', { name: '평점 4.8점 (30건)' });
    expect(officeOrder()).toEqual(['마바부동산', '다라부동산', '가나부동산']);

    const sort = within(screen.getByRole('combobox', { name: '입찰 정렬' }));
    expect(sort.getAllByRole('option').map((option) => option.textContent)).toEqual(['최신순', '수수료 낮은 순', '평점 높은 순']);

    fireEvent.change(screen.getByRole('combobox', { name: '입찰 정렬' }), { target: { value: 'LOWEST_FEE' } });
    expect(officeOrder()).toEqual(['가나부동산', '마바부동산', '다라부동산']);

    fireEvent.change(screen.getByRole('combobox', { name: '입찰 정렬' }), { target: { value: 'HIGHEST_RATING' } });
    expect(officeOrder()).toEqual(['다라부동산', '가나부동산', '마바부동산']);
  });

  it('hides the sort control when there is only one bid', async () => {
    vi.mocked(fetchBidsForProperty).mockResolvedValue([bid(11, 1, '가나부동산', 0.5, '2026-10-01T00:00:00')]);
    renderPage();

    await screen.findByText('가나부동산');
    expect(screen.queryByRole('combobox', { name: '입찰 정렬' })).not.toBeInTheDocument();
  });
});
