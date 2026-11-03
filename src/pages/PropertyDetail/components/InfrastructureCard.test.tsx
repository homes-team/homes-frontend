import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { NearbyFacilities, NearbyFacility, NearbyFacilityType } from '../../../types/property';
import InfrastructureCard from './InfrastructureCard';

const fetchNearbyFacilities = vi.hoisted(() => vi.fn());
vi.mock('../../../api/property/propertyApi', () => ({ fetchNearbyFacilities }));

let id = 1;
const at = (name: string, type: NearbyFacilityType, distanceMeters: number): NearbyFacility => ({
  id: String(id++),
  name,
  type,
  latitude: 37.55,
  longitude: 127.17,
  distanceMeters,
  address: null,
  source: type === 'SUBWAY' || type === 'BUS_STOP' ? 'NATIONWIDE_TRANSPORT_POI' : 'KAKAO_LOCAL',
});

const response = (facilities: NearbyFacility[]): NearbyFacilities => ({
  propertyId: 1,
  center: { latitude: 37.55, longitude: 127.17 },
  radiusMeters: 2000,
  facilities,
});

const renderCard = () => render(<InfrastructureCard propertyId={1} />);
const group = async (name: string) => within(await screen.findByRole('region', { name }));

beforeEach(() => vi.clearAllMocks());

describe('InfrastructureCard', () => {
  it('shows facilities from the same nearby-facilities API used by the AI report', async () => {
    fetchNearbyFacilities.mockResolvedValue(response([
      at('상일동역', 'SUBWAY', 350),
      at('이마트', 'MART', 1200),
    ]));
    renderCard();

    expect(screen.getByText('주변 인프라를 불러오는 중...')).toBeInTheDocument();
    expect(await (await group('지하철역')).findByText('상일동역')).toBeInTheDocument();
    expect((await group('지하철역')).getByText('350m · 도보 5분')).toBeInTheDocument();
    expect((await group('대형마트')).getByText('1.2km · 도보 15분')).toBeInTheDocument();
    expect(fetchNearbyFacilities).toHaveBeenCalledWith(1, expect.any(AbortSignal));
  });

  it('marks a property within 500m of a subway station as station-area', async () => {
    fetchNearbyFacilities.mockResolvedValue(response([at('상일동역', 'SUBWAY', 350)]));
    renderCard();

    expect(await screen.findByText('역세권')).toBeInTheDocument();
    expect(screen.getByText(/상일동역까지 도보 5분/)).toBeInTheDocument();
  });

  it('filters facilities outside each category display radius', async () => {
    fetchNearbyFacilities.mockResolvedValue(response([
      at('가까운 정류장', 'BUS_STOP', 300),
      at('먼 정류장', 'BUS_STOP', 800),
    ]));
    renderCard();

    const bus = await group('버스 정류장');
    expect(await bus.findByText('가까운 정류장')).toBeInTheDocument();
    expect(bus.queryByText('먼 정류장')).not.toBeInTheDocument();
    expect(bus.getByText('반경 500m 1곳')).toBeInTheDocument();
  });

  it('shows empty categories from a successful response', async () => {
    fetchNearbyFacilities.mockResolvedValue(response([]));
    renderCard();

    expect((await group('병원')).getByText('반경 1km 안에 없어요')).toBeInTheDocument();
    expect((await group('버스 정류장')).getByText('반경 500m 안에 없어요')).toBeInTheDocument();
  });

  it('shows the error and retries on request', async () => {
    fetchNearbyFacilities
      .mockRejectedValueOnce(new Error('서버에 연결할 수 없습니다.'))
      .mockResolvedValueOnce(response([at('고덕역', 'SUBWAY', 200)]));
    renderCard();

    expect(await screen.findByText(/주변 인프라를 불러오지 못했어요/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await (await group('지하철역')).findByText('고덕역')).toBeInTheDocument();
    await waitFor(() => expect(fetchNearbyFacilities).toHaveBeenCalledTimes(2));
  });
});
