import { act, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { fetchAiEvaluation, fetchPropertyDetail } from '../../api/property/propertyApi';
import { AiEvaluation, PropertyDetail } from '../../types/property';
import AiEvaluationReportPage from './index';

vi.mock('../../api/property/propertyApi', () => ({ fetchAiEvaluation: vi.fn(), fetchPropertyDetail: vi.fn() }));
vi.mock('../../components/layout/PageShell', () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));

const evaluation = (propertyId: number): AiEvaluation => ({
  propertyId,
  overall: { rawScore: 80, displayScore: 4, evaluatedCategoryCount: 0, totalCategoryCount: 6, completeness: 0 },
  categories: [],
  report: { summary: `평가 ${propertyId}`, strengths: [], weaknesses: [], notice: null },
  scoreVersion: 'V3', reportModelVersion: 'V1', generatedAt: '',
});
const property = (propertyId: number) => ({ propertyId, title: `제목 ${propertyId}` }) as PropertyDetail;
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
beforeEach(() => vi.resetAllMocks());

it('ends loading for an invalid ID without making requests', () => {
  setup('invalid');
  expect(screen.getByText('유효하지 않은 매물 ID입니다.')).toBeInTheDocument();
  expect(screen.queryByText(/불러오는 중/)).not.toBeInTheDocument();
  expect(fetchAiEvaluation).not.toHaveBeenCalled();
  expect(fetchPropertyDetail).not.toHaveBeenCalled();
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
