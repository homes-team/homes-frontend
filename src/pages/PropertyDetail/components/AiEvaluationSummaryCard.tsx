import Card from '../../../components/ui/Card';
import { AiEvaluation } from '../../../types/property';
import AiRadarChart from './AiRadarChart';

interface Props {
  evaluation: AiEvaluation | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onDetails: () => void;
}

function AiEvaluationSummaryCard({ evaluation, loading, error, onRetry, onDetails }: Props) {
  return (
    <Card className="overflow-hidden p-0 shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <p className="text-sm font-bold text-gray-900">✧ AI 매물 다면평가</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">입지와 매물 정보를 여섯 관점으로 살펴봤어요.</p>
      </div>

      {loading && <p className="px-5 py-10 text-center text-sm text-gray-500">평가를 불러오는 중...</p>}
      {!loading && (error || !evaluation) && (
        <div className="px-5 py-8 text-center text-sm text-danger">
          <p>{error ?? 'AI 다면평가를 불러오지 못했어요.'}</p>
          <button type="button" className="mt-2 font-semibold underline" onClick={onRetry}>다시 시도</button>
        </div>
      )}
      {!loading && evaluation && (
        <>
          <div className="px-5 pb-2 pt-5 text-center">
            <p className="text-xs font-medium text-primary">종합 AI 평점</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {evaluation.overall.displayScore?.toFixed(1) ?? '-'}
              <span className="ml-1 text-sm font-medium text-gray-400">/ 5.0</span>
            </p>
          </div>
          <div className="px-4"><AiRadarChart categories={evaluation.categories ?? []} /></div>
          <div className="px-5 pb-5">
            <button
              type="button"
              onClick={onDetails}
              className="w-full rounded-button bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              자세히 보기
            </button>
          </div>
        </>
      )}
    </Card>
  );
}

export default AiEvaluationSummaryCard;
