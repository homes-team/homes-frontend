import { render, screen, within } from '@testing-library/react';
import MaintenanceFeeCard from './MaintenanceFeeCard';

describe('MaintenanceFeeCard', () => {
  it('renders nothing when there is neither a fee nor any items', () => {
    const { container } = render(<MaintenanceFeeCard maintenanceFee={0} items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists the included items with amounts, "포함" and the remaining 기타 amount', () => {
    render(
      <MaintenanceFeeCard
        maintenanceFee={10}
        items={[
          { type: 'ELECTRICITY', amount: 3 },
          { type: 'INTERNET', amount: 2 },
          { type: 'WATER', amount: null },
        ]}
      />,
    );

    expect(screen.getByText('10만원')).toBeInTheDocument();
    const rows = screen.getAllByRole('listitem').map((row) => row.textContent);
    expect(rows).toEqual(['인터넷2만원', '수도포함', '전기3만원', '기타5만원']);
    expect(screen.getByText(/항목별 금액은 적지 않은 항목/)).toBeInTheDocument();
  });

  it('explains that the breakdown is missing when only the total is known', () => {
    render(<MaintenanceFeeCard maintenanceFee={7} />);
    expect(screen.getByText('7만원')).toBeInTheDocument();
    expect(screen.getByText(/포함된 항목이 아직 등록되지 않았어요/)).toBeInTheDocument();
  });

  it('shows the items even when the total amount is not entered', () => {
    render(<MaintenanceFeeCard maintenanceFee={null} items={[{ type: 'WATER', amount: 1 }]} />);
    expect(screen.getByText('금액 미기재')).toBeInTheDocument();
    expect(within(screen.getByRole('list')).getByText('1만원')).toBeInTheDocument();
  });
});
