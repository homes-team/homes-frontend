import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { InfrastructureItem } from '../../../types/infrastructure';
import InfrastructureCard from './InfrastructureCard';

const fetchInfrastructure = vi.hoisted(() => vi.fn());
vi.mock('../../../api/property/infrastructureApi', () => ({ fetchInfrastructure }));

const LAT = 37.55;
const LNG = 127.17;
let id = 1;
const at = (name: string, infraType: InfrastructureItem['infraType'], meters: number): InfrastructureItem => ({
  id: id++, name, infraType, lat: LAT + meters / 111_195, lon: LNG,
});

const renderCard = () => render(<InfrastructureCard latitude={LAT} longitude={LNG} />);
/** 해당 카테고리 영역이 화면에 나타날 때까지 기다린 뒤 그 안에서 찾는다 */
const group = async (name: string) => within(await screen.findByRole('region', { name }));

beforeEach(() => vi.clearAllMocks());

describe('InfrastructureCard', () => {
  it('shows a loading message, then the nearest facilities with distance and walking time', async () => {
    fetchInfrastructure.mockResolvedValue([at('상일동역', 'SUBWAY', 350), at('이마트', 'MART', 1200)]);
    renderCard();

    expect(screen.getByText('주변 인프라를 불러오는 중...')).toBeInTheDocument();
    const subway = await group('지하철역');
    expect(await subway.findByText('상일동역')).toBeInTheDocument();
    expect(subway.getByText('350m · 도보 5분')).toBeInTheDocument();
    expect((await group('대형마트')).getByText('1.2km · 도보 15분')).toBeInTheDocument();
  });

  it('marks a property within 500m of a subway station as station-area', async () => {
    fetchInfrastructure.mockResolvedValue([at('상일동역', 'SUBWAY', 350)]);
    renderCard();

    expect(await screen.findByText('역세권')).toBeInTheDocument();
    expect(screen.getByText(/상일동역까지 도보 5분/)).toBeInTheDocument();
  });

  it('does not claim station-area for a farther station', async () => {
    fetchInfrastructure.mockResolvedValue([at('상일동역', 'SUBWAY', 900)]);
    renderCard();

    expect(await (await group('지하철역')).findByText('상일동역')).toBeInTheDocument();
    expect(screen.queryByText('역세권')).not.toBeInTheDocument();
  });

  it('says so when a category has nothing within its radius', async () => {
    fetchInfrastructure.mockResolvedValue([at('상일동역', 'SUBWAY', 350)]);
    renderCard();

    await (await group('지하철역')).findByText('상일동역');
    expect((await group('병원')).getByText('반경 1km 안에 없어요')).toBeInTheDocument();
    expect((await group('버스 정류장')).getByText('반경 500m 안에 없어요')).toBeInTheDocument();
  });

  it('asks the API for the area around the property', async () => {
    fetchInfrastructure.mockResolvedValue([]);
    renderCard();

    await waitFor(() => expect(fetchInfrastructure).toHaveBeenCalledTimes(1));
    const [bounds] = fetchInfrastructure.mock.calls[0];
    expect(bounds.minLat).toBeLessThan(LAT);
    expect(bounds.maxLat).toBeGreaterThan(LAT);
    expect(bounds.minLon).toBeLessThan(LNG);
    expect(bounds.maxLon).toBeGreaterThan(LNG);
  });

  it('shows the error and retries on request', async () => {
    fetchInfrastructure
      .mockRejectedValueOnce(new Error('서버에 연결할 수 없습니다.'))
      .mockResolvedValueOnce([at('고덕역', 'SUBWAY', 200)]);
    renderCard();

    expect(await screen.findByText(/주변 인프라를 불러오지 못했어요/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await (await group('지하철역')).findByText('고덕역')).toBeInTheDocument();
    expect(fetchInfrastructure).toHaveBeenCalledTimes(2);
  });
});
