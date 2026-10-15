import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BidListItem, BidStatus } from '../../../types/bid';
import { BidderRating } from '../../../utils/bidSort';
import BidRow from './BidRow';

vi.mock('./NegotiationThread', () => ({ default: () => null }));

function renderRow(status: BidStatus, rating?: BidderRating) {
  const bid: BidListItem = {
    bidId: 1, agentId: 2, officeName: '홈즈부동산', profileImageUrl: null, proposedFee: 0.4,
    content: null, status, createdAt: '2026-10-01T00:00:00',
  };
  render(<MemoryRouter><BidRow propertyId={9} bid={bid} onChanged={vi.fn()} rating={rating} /></MemoryRouter>);
}

describe('BidRow status badge', () => {
  it.each([
    ['PENDING', '대기 중', 'bg-warning-50'],
    ['ACCEPTED', '매칭 확정', 'bg-success-50'],
    ['REJECTED', '거절됨', 'bg-red-50'],
    ['WITHDRAWN', '철회됨', 'bg-gray-100'],
    ['CANCELLED', '취소됨', 'bg-gray-100'],
  ] as const)('shows %s as "%s" with its own color', (status, label, colorClass) => {
    renderRow(status);
    expect(screen.getByText(label)).toHaveClass(colorClass);
  });
});

describe('BidRow fee and rating', () => {
  it('shows the proposed fee in percent', () => {
    renderRow('PENDING');

    expect(screen.getByText(/제안 수수료 0\.4% ·/)).toBeInTheDocument();
  });

  it('shows the realtor rating with the review count', () => {
    renderRow('PENDING', { score: 4.5, count: 12 });

    expect(screen.getByRole('img', { name: '평점 4.5점 (12건)' })).toBeInTheDocument();
  });

  it('says so when the realtor has no reviews yet', () => {
    renderRow('PENDING', { score: null, count: 0 });

    expect(screen.getByText('아직 받은 평점이 없어요')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows nothing about ratings while they are still loading', () => {
    renderRow('PENDING');

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText('아직 받은 평점이 없어요')).not.toBeInTheDocument();
  });
});
