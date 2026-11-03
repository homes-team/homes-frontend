import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NearbyProperty } from '../../../types/realtor';
import NearbyPropertyRow from './NearbyPropertyRow';

const property: NearbyProperty = {
  propertyId: 21,
  address: '서울특별시 도봉구 방학동',
  detailAddress: '벽산아파트 101동',
  tradeType: 'SALE',
  deposit: 41900,
  monthlyRent: 0,
  desiredBrokerageFee: 0.4,
  distanceInMeters: 123.6,
};

function renderRow(data: NearbyProperty = property) {
  return render(
    <MemoryRouter>
      <NearbyPropertyRow property={data} />
    </MemoryRouter>,
  );
}

describe('NearbyPropertyRow', () => {
  it('shows the desired brokerage fee returned by the nearby property API', () => {
    renderRow();

    expect(screen.getByText('희망 중개수수료율 0.4%')).toBeInTheDocument();
  });

  it('shows negotiation when the desired brokerage fee is unavailable', () => {
    renderRow({ ...property, desiredBrokerageFee: null });

    expect(screen.getByText('희망 중개수수료율 협의')).toBeInTheDocument();
  });
});
