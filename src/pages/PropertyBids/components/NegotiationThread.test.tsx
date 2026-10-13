import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createNegotiation, fetchNegotiations } from '../../../api/bid/bidApi';
import NegotiationThread from './NegotiationThread';

vi.mock('../../../api/bid/bidApi', () => ({ createNegotiation: vi.fn(), fetchNegotiations: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(fetchNegotiations).mockResolvedValue([]);
  vi.mocked(createNegotiation).mockResolvedValue();
});

it('shows negotiation fees in percent, as the backend stores them', async () => {
  vi.mocked(fetchNegotiations).mockResolvedValue([{
    negotiationId: 1, senderRole: 'AGENT', suggestedFee: 0.5, message: null, createdAt: '2026-10-09T00:00:00Z',
  }]);
  render(<NegotiationThread propertyId={21} bidId={7} />);

  expect(await screen.findByText('0.5%')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('제안 수수료 (%)')).toBeInTheDocument();
});

it('notifies the parent after saving even if refreshing negotiation history fails', async () => {
  vi.mocked(fetchNegotiations).mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('History unavailable'));
  const onChanged = vi.fn();
  render(<NegotiationThread propertyId={21} bidId={7} onChanged={onChanged} />);
  fireEvent.change(await screen.findByPlaceholderText('제안 수수료 (%)'), { target: { value: '0.4' } });
  fireEvent.click(screen.getByRole('button', { name: '역제안 보내기' }));

  await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
  expect(createNegotiation).toHaveBeenCalledWith(21, 7, { suggestedFee: 0.4, message: undefined });
  expect(await screen.findByRole('alert')).toBeInTheDocument();
});

it('does not refresh the parent when sending the counterproposal fails', async () => {
  vi.mocked(createNegotiation).mockRejectedValueOnce(new Error('Send failed'));
  const onChanged = vi.fn();
  render(<NegotiationThread propertyId={21} bidId={7} onChanged={onChanged} />);
  fireEvent.change(await screen.findByPlaceholderText('제안 수수료 (%)'), { target: { value: '0.4' } });
  fireEvent.click(screen.getByRole('button', { name: '역제안 보내기' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('역제안 전송에 실패했어요.');
  expect(onChanged).not.toHaveBeenCalled();
  expect(fetchNegotiations).toHaveBeenCalledTimes(1);
});
