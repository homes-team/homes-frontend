import { render, screen } from '@testing-library/react';
import PricePredictionTrendChart from './PricePredictionTrendChart';

const trades = [
  {
    apartmentName: '벽산아파트1', legalDongName: '방학동', areaSquareMeters: 63.38,
    floor: 2, buildYear: 1991, priceTenThousandWon: 44800, contractDate: '2026-09-28',
  },
  {
    apartmentName: '벽산아파트1', legalDongName: '방학동', areaSquareMeters: 63.38,
    floor: 5, buildYear: 1991, priceTenThousandWon: 42900, contractDate: '2026-06-10',
  },
  {
    apartmentName: '벽산아파트1', legalDongName: '방학동', areaSquareMeters: 63.38,
    floor: 4, buildYear: 1991, priceTenThousandWon: 40000, contractDate: '2026-01-02',
  },
];

describe('PricePredictionTrendChart', () => {
  it('renders past trades in chronological order and a distinct future point', () => {
    render(<PricePredictionTrendChart trades={trades} predictedPrice={41900} />);

    expect(screen.getByRole('img', { name: /대표 실거래 가격 추이 3건, 미래 예상가 4억 1,900만 원/ }))
      .toBeInTheDocument();
    expect(screen.getByText('01.02')).toBeInTheDocument();
    expect(screen.getByText('09.28')).toBeInTheDocument();
    expect(screen.getByText('미래 예상')).toBeInTheDocument();
    expect(screen.getByText(/점선 구간은 실거래가 아닌 모델 예상치/)).toBeInTheDocument();
  });

  it('does not render a misleading trend with fewer than two trades', () => {
    const { container } = render(<PricePredictionTrendChart trades={trades.slice(0, 1)} predictedPrice={41900} />);
    expect(container).toBeEmptyDOMElement();
  });
});
