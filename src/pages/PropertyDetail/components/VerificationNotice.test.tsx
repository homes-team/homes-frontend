import { render, screen } from '@testing-library/react';
import VerificationNotice from './VerificationNotice';

describe('VerificationNotice', () => {
  it('says which verification is still missing', () => {
    render(<VerificationNotice isOwnerVerified={false} isRealtorVerified={false} />);

    expect(screen.getByText(/아직 등기부등본 인증이 안 된 매물이에요!/)).toBeInTheDocument();
    expect(screen.getByText(/중개사 현장 인증이 안 된 매물이에요!/)).toBeInTheDocument();
  });

  it('only mentions the one that is missing', () => {
    render(<VerificationNotice isOwnerVerified isRealtorVerified={false} />);

    expect(screen.queryByText(/등기부등본 인증이 안 된/)).not.toBeInTheDocument();
    expect(screen.getByText(/중개사 현장 인증이 안 된 매물이에요!/)).toBeInTheDocument();
  });

  it('stays quiet when everything is verified or the state is unknown', () => {
    const { container, rerender } = render(<VerificationNotice isOwnerVerified isRealtorVerified />);
    expect(container).toBeEmptyDOMElement();

    rerender(<VerificationNotice isOwnerVerified={null} isRealtorVerified={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
