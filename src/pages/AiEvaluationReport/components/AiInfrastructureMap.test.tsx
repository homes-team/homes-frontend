import { fireEvent, render, screen } from '@testing-library/react';
import { useKakaoMap } from '../../../hooks/useKakaoMap';
import { NearbyFacility } from '../../../types/property';
import AiInfrastructureMap, {
  createSunlightSectorCoordinates,
  filterFacilities,
  getDirectionBearing,
  getSunlightLayerStyle,
} from './AiInfrastructureMap';

vi.mock('../../../hooks/useKakaoMap', () => ({
  useKakaoMap: vi.fn(),
}));


const facilities: NearbyFacility[] = [
  {
    id: 'subway-1',
    type: 'SUBWAY',
    name: '테스트역',
    latitude: 37.5,
    longitude: 127,
    distanceMeters: 300,
    address: null,
    source: 'NATIONWIDE_TRANSPORT_POI',
  },
  {
    id: 'park-1',
    type: 'PARK',
    name: '테스트공원',
    latitude: 37.51,
    longitude: 127.01,
    distanceMeters: 500,
    address: '서울시 테스트구',
    source: 'KAKAO_LOCAL',
  },
];

const defaultProps = {
  evaluation: null,
  facilities: null,
  direction: null,
  loading: false,
  error: null,
  onRetry: vi.fn(),
  isochrones: [],
  isochronesLoading: false,
  isochronesError: null,
  isochronesCompletedTimes: [],
  isochroneMode: 'walk' as const,
  onIsochroneModeChange: vi.fn(),
  onRetryIsochrones: vi.fn(),
};

describe('AI 인프라 지도 도우미', () => {
  beforeEach(() => {
    vi.mocked(useKakaoMap).mockReturnValue({ map: null, error: null });
  });

  it('일조 점수를 단계별 색상과 문구로 변환한다', () => {
    expect(getSunlightLayerStyle(4.2)).toEqual({ color: '#16a34a', label: '우수' });
    expect(getSunlightLayerStyle(3)).toEqual({ color: '#eab308', label: '양호' });
    expect(getSunlightLayerStyle(2.5)).toEqual({ color: '#f97316', label: '보통' });
    expect(getSunlightLayerStyle(1.5)).toEqual({ color: '#dc2626', label: '낮음' });
    expect(getSunlightLayerStyle(null)).toEqual({ color: '#94a3b8', label: '데이터 부족' });
  });

  it('선택한 시설 유형만 반환하고 전체 선택은 원본을 유지한다', () => {
    expect(filterFacilities(facilities, 'PARK')).toEqual([facilities[1]]);
    expect(filterFacilities(facilities, 'ALL')).toEqual(facilities);
  });

  it('매물 방향을 지도 방위각으로 변환한다', () => {
    expect(getDirectionBearing('NORTH')).toBe(0);
    expect(getDirectionBearing('SOUTHEAST')).toBe(135);
    expect(getDirectionBearing('WEST')).toBe(270);
    expect(getDirectionBearing('UNKNOWN')).toBeNull();
    expect(getDirectionBearing(null)).toBeNull();
  });

  it('매물 위치에서 해당 방향을 향하는 부채꼴 좌표를 만든다', () => {
    const south = createSunlightSectorCoordinates(37.5, 127, 180);
    expect(south).toHaveLength(12);
    expect(south[0]).toEqual({ latitude: 37.5, longitude: 127 });
    expect(south[6].latitude).toBeLessThan(37.5);
  });

  it('SDK 로드 오류에는 동작하지 않는 재시도 버튼 대신 새로 고침 안내를 표시한다', () => {
    vi.mocked(useKakaoMap).mockReturnValue({ map: null, error: '지도 SDK 로드 실패' });

    render(
      <AiInfrastructureMap
        {...defaultProps}
      />,
    );

    expect(screen.getByText('페이지를 새로 고침해 주세요.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument();
  });

  it('시설 조회 오류에는 기존 재시도 버튼을 유지한다', () => {
    const onRetry = vi.fn();
    render(
      <AiInfrastructureMap
        {...defaultProps}
        error="시설 조회 실패"
        onRetry={onRetry}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('도보와 차량 생활권 선택을 제공한다', () => {
    const onIsochroneModeChange = vi.fn();
    render(
      <AiInfrastructureMap
        {...defaultProps}
        onIsochroneModeChange={onIsochroneModeChange}
      />,
    );

    const walkButton = screen.getByRole('button', { name: '🚶 도보' });
    const driveButton = screen.getByRole('button', { name: '🚗 차량' });
    expect(walkButton).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(driveButton);
    expect(onIsochroneModeChange).toHaveBeenCalledWith('drive');
    expect(screen.getByRole('link', { name: '© OpenStreetMap contributors' }))
      .toHaveAttribute('href', 'https://www.openstreetmap.org/copyright');
  });

  it('완료된 생활권 계산 건수로 정확한 진행률을 표시한다', () => {
    render(
      <AiInfrastructureMap
        {...defaultProps}
        isochronesLoading
        isochronesCompletedTimes={[5]}
      />,
    );

    expect(screen.getByText('1/2 완료 · 50%')).toBeInTheDocument();
    expect(screen.getByText('5분 영역 계산 완료')).toBeInTheDocument();
    expect(screen.getByText('10분 영역 경로 계산 중')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: '생활권 계산 진행률' }))
      .toHaveAttribute('aria-valuenow', '50');
  });
});
