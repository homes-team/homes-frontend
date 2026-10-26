import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { fetchRealtorPublicProfile } from '../../../api/realtor/realtorApi';
import { fetchMyReceivedBids } from '../../../api/user/userApi';
import { BidStatus, ReceivedBidListItem } from '../../../types/bid';
import MyReceivedBidsPage from './index';

vi.mock('../../../api/user/userApi', () => ({ fetchMyReceivedBids: vi.fn() }));
vi.mock('../../../api/realtor/realtorApi', () => ({ fetchRealtorPublicProfile: vi.fn() }));
vi.mock('../../../api/bid/bidApi', () => ({ acceptBid: vi.fn(), rejectBid: vi.fn(), cancelBid: vi.fn(), completeBid: vi.fn() }));
vi.mock('../../../api/chat/chatApi', () => ({ createChatRoom: vi.fn() }));
vi.mock('../../PropertyBids/components/NegotiationThread', () => ({ default: () => null }));
vi.mock('../../../components/layout/PageShell', () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));

const bid = (bidId: number, propertyId: number, officeName: string, status: BidStatus, createdAt: string): ReceivedBidListItem => ({
  bidId, propertyId, propertyTitle: `매물${propertyId}`, propertyAddress: `서울 주소${propertyId}`, agentId: bidId, officeName,
  profileImageUrl: null, proposedFee: 0.4, content: null, status, createdAt,
});

const renderPage = () => render(<MemoryRouter><MyReceivedBidsPage /></MemoryRouter>);

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(fetchMyReceivedBids).mockResolvedValue([
    bid(1, 10, '가나부동산', 'PENDING', '2026-10-01T09:00:00'),
    bid(2, 20, '다라부동산', 'ACCEPTED', '2026-10-02T09:00:00'),
    bid(3, 10, '마바부동산', 'REJECTED', '2026-10-03T09:00:00'),
  ]);
  vi.mocked(fetchRealtorPublicProfile).mockImplementation(async (agentId) => ({
    agentId, officeName: '', officeAddress: null, businessNum: '', isVerified: true, successRate: null,
    averageReviewScore: agentId === 1 ? 4.5 : null, reviewCount: agentId === 1 ? 8 : 0,
  }));
});

describe('MyReceivedBidsPage', () => {
  it('groups the bids received on every property under that property', async () => {
    renderPage();

    const first = within(await screen.findByRole('region', { name: '매물10' }));
    expect(first.getByText('서울 주소10')).toBeInTheDocument();
    expect(first.getByText('가나부동산')).toBeInTheDocument();
    expect(first.getByText('마바부동산')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: '매물20' })).getByText('다라부동산')).toBeInTheDocument();
  });

  it('summarises how many bids are waiting for an answer', async () => {
    renderPage();

    expect(await screen.findByText(/전체 3건/)).toHaveTextContent('답변을 기다리는 제안 1건');
  });

  it('shows the realtor rating on each bid', async () => {
    renderPage();

    expect(await screen.findByRole('img', { name: '평점 4.5점 (8건)' })).toBeInTheDocument();
  });

  it('filters by status and says so when nothing matches', async () => {
    renderPage();
    await screen.findByRole('region', { name: '매물10' });

    fireEvent.click(screen.getByRole('button', { name: '매칭 확정' }));
    expect(screen.queryByRole('region', { name: '매물10' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: '매물20' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '종료' }));
    expect(within(screen.getByRole('region', { name: '매물10' })).getByText('마바부동산')).toBeInTheDocument();
    expect(screen.queryByText('가나부동산')).not.toBeInTheDocument();
  });

  it('shows an empty message when no bids have arrived', async () => {
    vi.mocked(fetchMyReceivedBids).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText('아직 받은 입찰 제안서가 없어요.')).toBeInTheDocument();
  });

  it('shows the error when loading fails', async () => {
    vi.mocked(fetchMyReceivedBids).mockRejectedValue(new Error('서버에 연결할 수 없습니다.'));
    renderPage();

    expect(await screen.findByText('서버에 연결할 수 없습니다.')).toBeInTheDocument();
  });
});
