import { act, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import {
  fetchAiEvaluation,
  fetchNearbyFacilities,
  fetchPropertyDetail,
  fetchPropertyIsochrone,
} from '../../api/property/propertyApi';
import { AiEvaluation, NearbyFacilities, PropertyDetail, PropertyIsochrone } from '../../types/property';
import AiEvaluationReportPage from './index';

vi.mock('../../api/property/propertyApi', () => ({
  fetchAiEvaluation: vi.fn(),
  fetchNearbyFacilities: vi.fn(),
  fetchPropertyDetail: vi.fn(),
  fetchPropertyIsochrone: vi.fn(),
}));
vi.mock('../../components/layout/PageShell', () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('./components/AiInfrastructureMap', () => ({
  default: ({
    loading,
    error,
    onRetry,
    isochronesLoading,
    isochronesError,
    onRetryIsochrones,
  }: {
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    isochronesLoading: boolean;
    isochronesError: string | null;
    onRetryIsochrones: () => void;
  }) => (
    <div>
      <span>{loading ? '시설 로딩' : error ?? '시설 지도'}</span>
      {error && <button type="button" onClick={onRetry}>시설 다시 시도</button>}
      <span>{isochronesLoading ? '생활권 로딩' : isochronesError ?? '생활권 지도'}</span>
      {isochronesError && <button type="button" onClick={onRetryIsochrones}>생활권 다시 시도</button>}
    </div>
  ),
}));

const evaluation = (propertyId: number): AiEvaluation => ({
  propertyId,
  overall: { rawScore: 80, displayScore: 4, evaluatedCategoryCount: 0, totalCategoryCount: 6, completeness: 0 },
  categories: [],
  report: { summary: `평가 ${propertyId}`, strengths: [], weaknesses: [], notice: null },
  scoreVersion: 'V3', reportModelVersion: 'V1', generatedAt: '',
});
const property = (propertyId: number) => ({ propertyId, title: `제목 ${propertyId}` }) as PropertyDetail;
const facilities = (propertyId: number): NearbyFacilities => ({
  propertyId,
  center: { latitude: 37.5, longitude: 127 },
  radiusMeters: 2000,
  facilities: [],
});
const isochrone = (propertyId: number, mode: 'walk' | 'drive', time: 5 | 10): PropertyIsochrone => ({
  propertyId,
  mode,
  travelTimeMinutes: time,
  center: { latitude: 37.5, longitude: 127 },
  geometry: { type: 'Polygon', coordinates: [[[127, 37.5], [127.01, 37.5], [127, 37.5]]] },
  metadata: {
    estimatedDistanceMeters: 400,
    totalAreaSquareMeters: 1,
    calculationMethod: 'VIRTUAL_RADIAL_POLYGON',
    dataSource: 'PROPERTY_COORDINATE',
    cached: false,
    generatedAt: '',
  },
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
function setup(id: string) {
  const router = createMemoryRouter([{ path: '/properties/:propertyId/report', element: <AiEvaluationReportPage /> }], {
    initialEntries: [`/properties/${id}/report`],
  });
  render(<RouterProvider router={router} />);
  return router;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(fetchNearbyFacilities).mockImplementation((propertyId) => Promise.resolve(facilities(propertyId)));
  vi.mocked(fetchPropertyIsochrone).mockImplementation((propertyId, mode, time) => (
    Promise.resolve(isochrone(propertyId, mode, time))
  ));
});

it('ends loading for an invalid ID without making requests', () => {
  setup('invalid');
  expect(screen.getByText('유효하지 않은 매물 ID입니다.')).toBeInTheDocument();
  expect(screen.queryByText(/불러오는 중/)).not.toBeInTheDocument();
  expect(fetchAiEvaluation).not.toHaveBeenCalled();
  expect(fetchNearbyFacilities).not.toHaveBeenCalled();
  expect(fetchPropertyDetail).not.toHaveBeenCalled();
  expect(fetchPropertyIsochrone).not.toHaveBeenCalled();
});

it('shows evaluation without waiting for details and keeps the default title if details fail', async () => {
  const details = deferred<PropertyDetail>();
  vi.mocked(fetchAiEvaluation).mockResolvedValue(evaluation(1));
  vi.mocked(fetchPropertyDetail).mockReturnValue(details.promise);
  setup('1');
  expect(await screen.findByText('평가 1')).toBeInTheDocument();
  await act(async () => details.reject(new Error('제목 실패')));
  expect(screen.getByText('매물')).toBeInTheDocument();
  expect(screen.getByText('평가 1')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument();
});

it('clears the previous property on navigation and allows retry after evaluation failure', async () => {
  vi.mocked(fetchAiEvaluation).mockResolvedValueOnce(evaluation(1)).mockRejectedValueOnce(new Error('평가 실패')).mockResolvedValueOnce(evaluation(2));
  vi.mocked(fetchPropertyDetail).mockResolvedValueOnce(property(1)).mockRejectedValue(new Error('제목 실패'));
  const router = setup('1');
  expect(await screen.findByText('평가 1')).toBeInTheDocument();
  expect(await screen.findByText('제목 1')).toBeInTheDocument();
  await act(async () => { await router.navigate('/properties/2/report'); });
  expect(await screen.findByText('평가 실패')).toBeInTheDocument();
  expect(screen.queryByText('제목 1')).not.toBeInTheDocument();
  expect(screen.queryByText('평가 1')).not.toBeInTheDocument();
  expect(screen.getByText('매물')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
  expect(await screen.findByText('평가 2')).toBeInTheDocument();
});

it('ignores late responses from a previous ID even when the transport does not abort', async () => {
  const oldEvaluation = deferred<AiEvaluation>();
  const oldProperty = deferred<PropertyDetail>();
  vi.mocked(fetchAiEvaluation).mockReturnValueOnce(oldEvaluation.promise).mockResolvedValueOnce(evaluation(2));
  vi.mocked(fetchPropertyDetail).mockReturnValueOnce(oldProperty.promise).mockResolvedValueOnce(property(2));
  const router = setup('1');
  await act(async () => { await router.navigate('/properties/2/report'); });
  expect(await screen.findByText('평가 2')).toBeInTheDocument();
  expect(vi.mocked(fetchAiEvaluation).mock.calls[0][1]?.aborted).toBe(true);
  await act(async () => { oldEvaluation.resolve(evaluation(1)); oldProperty.resolve(property(1)); });
  expect(screen.getByText('평가 2')).toBeInTheDocument();
  expect(screen.getByText('제목 2')).toBeInTheDocument();
  expect(screen.queryByText('평가 1')).not.toBeInTheDocument();
  expect(screen.queryByText('제목 1')).not.toBeInTheDocument();
});

it('does not render an evaluation belonging to a different property', async () => {
  vi.mocked(fetchAiEvaluation).mockResolvedValue(evaluation(99));
  vi.mocked(fetchPropertyDetail).mockResolvedValue(property(1));
  setup('1');
  expect(await screen.findByRole('button', { name: '다시 시도' })).toBeInTheDocument();
  expect(screen.queryByText('평가 99')).not.toBeInTheDocument();
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});

it('keeps the evaluation report available when nearby facilities fail', async () => {
  vi.mocked(fetchAiEvaluation).mockResolvedValue(evaluation(1));
  vi.mocked(fetchPropertyDetail).mockResolvedValue(property(1));
  vi.mocked(fetchNearbyFacilities).mockRejectedValue(new Error('시설 조회 실패'));
  setup('1');
  expect(await screen.findByText('평가 1')).toBeInTheDocument();
  expect(await screen.findByText('시설 조회 실패')).toBeInTheDocument();
});

it('retries only nearby facilities while keeping the evaluation report', async () => {
  vi.mocked(fetchAiEvaluation).mockResolvedValue(evaluation(1));
  vi.mocked(fetchPropertyDetail).mockResolvedValue(property(1));
  vi.mocked(fetchNearbyFacilities)
    .mockRejectedValueOnce(new Error('시설 조회 실패'))
    .mockResolvedValueOnce(facilities(1));
  setup('1');

  expect(await screen.findByText('평가 1')).toBeInTheDocument();
  expect(await screen.findByText('시설 조회 실패')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '시설 다시 시도' }));

  expect(await screen.findByText('시설 지도')).toBeInTheDocument();
  expect(screen.getByText('평가 1')).toBeInTheDocument();
  expect(fetchNearbyFacilities).toHaveBeenCalledTimes(2);
  expect(fetchAiEvaluation).toHaveBeenCalledTimes(1);
  expect(fetchPropertyDetail).toHaveBeenCalledTimes(1);
});

it('loads walk and drive isochrones for 5 and 10 minutes', async () => {
  vi.mocked(fetchAiEvaluation).mockResolvedValue(evaluation(1));
  vi.mocked(fetchPropertyDetail).mockResolvedValue(property(1));
  setup('1');

  expect(await screen.findByText('생활권 지도')).toBeInTheDocument();
  expect(fetchPropertyIsochrone).toHaveBeenCalledTimes(4);
  expect(fetchPropertyIsochrone).toHaveBeenCalledWith(1, 'walk', 5, expect.any(AbortSignal));
  expect(fetchPropertyIsochrone).toHaveBeenCalledWith(1, 'walk', 10, expect.any(AbortSignal));
  expect(fetchPropertyIsochrone).toHaveBeenCalledWith(1, 'drive', 5, expect.any(AbortSignal));
  expect(fetchPropertyIsochrone).toHaveBeenCalledWith(1, 'drive', 10, expect.any(AbortSignal));
});
