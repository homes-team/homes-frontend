import Badge from '../../../components/ui/Badge';
import Card from '../../../components/ui/Card';
import { AiEvaluation } from '../../../types/property';

interface AiEvaluationCardProps {
  evaluation: AiEvaluation | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function formatScore(score: number | null) {
  return score === null ? '-' : score.toFixed(1);
}

function AiEvaluationCard({ evaluation, loading, error, onRetry }: AiEvaluationCardProps) {
  if (loading) {
    return <p className="text-sm text-gray-500">AI 다면평가를 불러오는 중...</p>;
  }

  if (error || !evaluation) {
    return (
      <div className="rounded-button bg-red-50 p-4 text-sm text-danger">
        <p>{error ?? 'AI 다면평가를 불러오지 못했어요.'}</p>
        <button type="button" className="mt-2 font-semibold underline" onClick={onRetry}>
          다시 시도
        </button>
      </div>
    );
  }

  const { overall, report } = evaluation;
  const categories = Array.isArray(evaluation.categories) ? evaluation.categories : [];

  return (
    <Card className="flex flex-col gap-6">
      <div className="grid gap-5 md:grid-cols-[180px_1fr] md:items-center">
        <div className="rounded-card bg-primary-50 p-5 text-center">
          <p className="text-xs font-medium text-gray-500">종합 점수</p>
          <p className="mt-1 text-4xl font-bold text-primary">
            {formatScore(overall.displayScore)}
            <span className="ml-1 text-base font-medium text-gray-500">/ 5.0</span>
          </p>
          <p className="mt-2 text-xs text-gray-500">
            데이터 완성도 {overall.completeness.toFixed(1)}%
          </p>
        </div>

        <div>
          <p className="text-base font-semibold text-gray-900">{report.summary}</p>
          {report.notice && <p className="mt-2 text-sm text-gray-500">{report.notice}</p>}
          <div className="mt-3 h-2 overflow-hidden rounded-pill bg-gray-100" aria-label={`데이터 완성도 ${overall.completeness}%`}>
            <div className="h-full rounded-pill bg-primary" style={{ width: `${overall.completeness}%` }} />
          </div>
          <p className="mt-1 text-right text-xs text-gray-500">
            {overall.evaluatedCategoryCount}/{overall.totalCategoryCount}개 항목 평가 완료
          </p>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const available = category.status === 'AVAILABLE' && category.displayScore !== null;
          return (
            <li key={category.key} className="rounded-card border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-gray-900">{category.label}</p>
                {available ? (
                  <strong className="text-primary">{formatScore(category.displayScore)} / 5.0</strong>
                ) : (
                  <Badge>수집 대기</Badge>
                )}
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-pill bg-gray-100">
                <div
                  className="h-full rounded-pill bg-primary"
                  style={{ width: `${available ? (category.displayScore! / 5) * 100 : 0}%` }}
                />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">{category.description}</p>
            </li>
          );
        })}
      </ul>

      {(report.strengths.length > 0 || report.weaknesses.length > 0) && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">강점</h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {report.strengths.map((strength) => <li key={strength}>• {strength}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">확인할 점</h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {report.weaknesses.map((weakness) => <li key={weakness}>• {weakness}</li>)}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}

export default AiEvaluationCard;
