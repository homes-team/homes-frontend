import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BidListItem, BidStatus } from '../../../types/bid';
import BidRow from './BidRow';

vi.mock('./NegotiationThread', () => ({ default: () => null }));

function renderRow(status: BidStatus) {
  const bid: BidListItem = {
    bidId: 1, agentId: 2, officeName: '홈즈부동산', profileImageUrl: null, proposedFee: 0.4,
    content: null, status, createdAt: '2026-10-01T00:00:00',
  };
  render(<MemoryRouter><BidRow propertyId={9} bid={bid} onChanged={vi.fn()} /></MemoryRouter>);
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
