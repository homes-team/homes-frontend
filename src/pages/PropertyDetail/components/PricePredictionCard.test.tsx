import { fireEvent, render, screen } from '@testing-library/react';
import { PropertyPricePrediction } from '../../../types/property';
import PricePredictionCard from './PricePredictionCard';

const prediction: PropertyPricePrediction = {
  propertyId: 21,
  status: 'AVAILABLE',
  tradeType: 'SALE',
  predictedPrice: 41900,
  minimumPrice: 39800,
  maximumPrice: 45200,
  confidence: 'HIGH',
  comparisonScope: 'SAME_COMPLEX',
  sampleCount: 11,
  referenceFrom: '2025-06',
  referenceTo: '2026-09',
  representativeTrades: [{
    apartmentName: '벽산아파트1',
    legalDongName: '방학동',
    areaSquareMeters: 63.38,
    floor: 5,
    buildYear: 1991,
    priceTenThousandWon: 42900,
    contractDate: '2026-06-10',
  }],
  method: 'COMPARABLE_WEIGHTED_MEDIAN_V2',
  description: '최근 동일 단지 유사 거래 11건을 기준으로 계산했습니다.',
};

describe('PricePredictionCard', () => {
  it('renders the predicted range, evidence scope, and representative trades', () => {
    render(<PricePredictionCard prediction={prediction} loading={false} error={null} onRetry={() => {}} />);

    expect(screen.getByText('4억 1,900만 원')).toBeInTheDocument();
    expect(screen.getByText(/3억 9,800만 원/)).toBeInTheDocument();
    expect(screen.getByText('신뢰도 높음')).toBeInTheDocument();
    expect(screen.getByText('동일 단지')).toBeInTheDocument();
    expect(screen.getByText('11건')).toBeInTheDocument();

    fireEvent.click(screen.getByText('대표 실거래 보기'));
    expect(screen.getByText('벽산아파트1')).toBeInTheDocument();
    expect(screen.getByText('4억 2,900만 원')).toBeInTheDocument();
  });

  it('shows an explanatory state without rendering null prices as zero', () => {
    render(
      <PricePredictionCard
        prediction={{ ...prediction, status: 'INSUFFICIENT_DATA', predictedPrice: null, minimumPrice: null, maximumPrice: null }}
        loading={false}
        error={null}
        onRetry={() => {}}
      />,
    );

    expect(screen.getByText('가격을 예측하기 위한 유사 거래가 부족합니다.')).toBeInTheDocument();
    expect(screen.queryByText(/0만 원/)).not.toBeInTheDocument();
  });

  it('offers retry for network and provider failures', () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <PricePredictionCard prediction={null} loading={false} error="요청 실패" onRetry={onRetry} />,
    );
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    rerender(
      <PricePredictionCard
        prediction={{ ...prediction, status: 'PROVIDER_UNAVAILABLE', predictedPrice: null, minimumPrice: null, maximumPrice: null }}
        loading={false}
        error={null}
        onRetry={onRetry}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('announces loading without showing stale prediction content', () => {
    render(<PricePredictionCard prediction={prediction} loading error={null} onRetry={() => {}} />);
    expect(screen.getByText('매물 가격 예측').parentElement?.parentElement?.nextElementSibling)
      .toHaveAttribute('aria-live', 'polite');
    expect(screen.queryByText('4억 1,900만 원')).not.toBeInTheDocument();
  });
});
