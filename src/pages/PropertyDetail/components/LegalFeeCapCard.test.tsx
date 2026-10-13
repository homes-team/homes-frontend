import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FeeCapSubject } from '../../../utils/legalFeeCap';
import LegalFeeCapCard from './LegalFeeCapCard';

const JEONSE: FeeCapSubject = { tradeType: 'JEONSE', propertyType: 'APARTMENT', deposit: 10000, monthlyRent: 0 };
const SALE_LIMITED: FeeCapSubject = { tradeType: 'SALE', propertyType: 'HOUSE', deposit: 19000, monthlyRent: 0 };

const renderCard = (property: FeeCapSubject, proposedRate?: number) =>
  render(
    <MemoryRouter>
      <LegalFeeCapCard property={property} proposedRate={proposedRate} />
    </MemoryRouter>,
  );

describe('LegalFeeCapCard', () => {
  it('shows the cap rate and the most the realtor can charge on this property', () => {
    renderCard(JEONSE);

    expect(screen.getByText('0.3%')).toBeInTheDocument();
    expect(screen.getByText(/약 30만원/)).toBeInTheDocument();
    expect(screen.queryByText(/입찰 가능한 최대 요율/)).not.toBeInTheDocument();
  });

  it('explains the lower effective rate when the 한도액 limits the fee', () => {
    renderCard(SALE_LIMITED);

    expect(screen.getByText(/한도 80만원/)).toBeInTheDocument();
    expect(screen.getByText('입찰 가능한 최대 요율')).toBeInTheDocument();
    expect(screen.getByText(/0\.42%/)).toBeInTheDocument();
  });

  it('confirms a proposed rate that is within the cap', () => {
    renderCard(JEONSE, 0.25);

    expect(screen.getByRole('status')).toHaveTextContent('입력한 0.25%는 약 25만원 · 법정 상한 안이에요');
    expect(screen.getByRole('status')).toHaveClass('bg-success-50');
  });

  it('warns about a proposed rate above the cap', () => {
    renderCard(JEONSE, 0.5);

    expect(screen.getByRole('status')).toHaveTextContent('법정 상한(30만원)을 넘어요');
    expect(screen.getByRole('status')).toHaveClass('bg-red-50');
  });

  it('shows no verdict until something is typed', () => {
    renderCard(JEONSE);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('links to the calculator with this property prefilled', () => {
    renderCard(JEONSE);

    expect(screen.getByRole('link', { name: '계산기로 자세히 보기' })).toHaveAttribute(
      'href',
      '/calculator?tab=commission&trade=jeonse&price=10000',
    );
  });

  it('renders nothing when there is no trade amount', () => {
    const { container } = renderCard({ ...JEONSE, deposit: 0 });

    expect(container).toBeEmptyDOMElement();
  });
});
