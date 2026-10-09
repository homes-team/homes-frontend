import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createNegotiation, fetchNegotiations } from '../../api/bid/bidApi';
import { fetchMyBids } from '../../api/realtor/realtorApi';
import { MyBidListItem } from '../../types/bid';
import RealtorMyBidsPage from './index';

vi.mock('../../api/bid/bidApi', () => ({ createNegotiation: vi.fn(), fetchNegotiations: vi.fn(), cancelBid: vi.fn() }));
vi.mock('../../api/realtor/realtorApi', () => ({ fetchMyBids: vi.fn() }));
vi.mock('../../components/layout/PageShell', () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));

beforeEach(() => vi.resetAllMocks());

it('keeps percent units and displays the latest current fee after a successful counterproposal', async () => {
  const bid: MyBidListItem = {
    bidId: 7, propertyId: 21, propertyTitle: '테스트 매물', propertyAddress: '테스트 주소',
    proposedFee: 0.5, currentFee: 0.5, status: 'PENDING', createdAt: '2026-10-09T00:00:00Z',
  };
  vi.mocked(fetchMyBids).mockResolvedValueOnce([bid]).mockResolvedValueOnce([{ ...bid, currentFee: 0.4 }]);
  vi.mocked(fetchNegotiations).mockResolvedValue([{
    negotiationId: 1, senderRole: 'AGENT', suggestedFee: 0.5, message: null, createdAt: bid.createdAt,
  }]);
  let finishSending!: () => void;
  vi.mocked(createNegotiation).mockReturnValue(new Promise<void>((resolve) => { finishSending = resolve; }));
  render(<MemoryRouter><RealtorMyBidsPage /></MemoryRouter>);

  fireEvent.click(await screen.findByRole('button', { name: '제안 상세 보기' }));
  fireEvent.change(await screen.findByPlaceholderText('제안 수수료 (%)'), { target: { value: '0.4' } });
  expect(screen.getByText('0.5%')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '역제안 보내기' }));
  expect(fetchMyBids).toHaveBeenCalledTimes(1);

  await act(async () => { finishSending(); });

  expect(await screen.findByText(/현재 협상 수수료 0\.4%/)).toBeInTheDocument();
  expect(fetchMyBids).toHaveBeenCalledTimes(2);
  expect(createNegotiation).toHaveBeenCalledWith(21, 7, { suggestedFee: 0.4, message: undefined });
});
