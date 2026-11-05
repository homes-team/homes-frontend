import { render, screen } from '@testing-library/react';
import VerificationBadges from './VerificationBadges';

describe('VerificationBadges', () => {
  it('shows the registry and on-site marks separately', () => {
    const { rerender } = render(<VerificationBadges isOwnerVerified />);
    expect(screen.getByText('✓ 등기부 인증')).toBeInTheDocument();
    expect(screen.queryByText('✓ 현장 인증')).not.toBeInTheDocument();

    rerender(<VerificationBadges isRealtorVerified />);
    expect(screen.getByText('✓ 현장 인증')).toBeInTheDocument();
    expect(screen.queryByText('✓ 등기부 인증')).not.toBeInTheDocument();
  });

  it('shows both when both are verified', () => {
    render(<VerificationBadges isOwnerVerified isRealtorVerified />);

    expect(screen.getByText('✓ 등기부 인증')).toBeInTheDocument();
    expect(screen.getByText('✓ 현장 인증')).toBeInTheDocument();
  });

  it('shows nothing while unverified or unknown', () => {
    const { container } = render(<VerificationBadges isOwnerVerified={false} isRealtorVerified={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
