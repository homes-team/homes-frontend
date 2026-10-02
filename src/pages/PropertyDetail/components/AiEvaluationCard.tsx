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

function formatEvidenceValue(value: string, unit: string | null) {
  return `${value}${unit ?? ''}`;
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
          <p className="text-xs font-medium text-gray-500">근거 기반 종합 점수</p>
          <p className="mt-1 text-4xl font-bold text-primary">
            {formatScore(overall.displayScore)}
            <span className="ml-1 text-base font-medium text-gray-500">/ 5.0</span>
          </p>
        </div>

        <div>
          <p className="text-base font-semibold text-gray-900">{report.summary}</p>
          {report.notice && <p className="mt-2 text-sm text-gray-500">{report.notice}</p>}
        </div>
      </div>

      <ul className="grid gap-4 lg:grid-cols-2">
        {categories.map((category) => {
          const available = category.status === 'AVAILABLE' && category.displayScore !== null;
          const evidence = Array.isArray(category.evidence) ? category.evidence : [];
          return (
            <li key={category.key} className="rounded-card border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-gray-900">{category.label}</p>
                {available ? (
                  <strong className="text-primary">{formatScore(category.displayScore)} / 5.0</strong>
                ) : (
                  <Badge>평가 근거 없음</Badge>
                )}
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-pill bg-gray-100">
                <div
                  className="h-full rounded-pill bg-primary"
                  style={{ width: `${available ? (category.displayScore! / 5) * 100 : 0}%` }}
                />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{category.description}</p>

              {available && evidence.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <dl className="space-y-2">
                    {evidence.map((item) => {
                      return (
                        <div key={item.code} className="flex items-start justify-between gap-3 rounded-button bg-gray-50 px-3 py-2.5">
                          <dt className="shrink-0 text-xs font-medium text-gray-500">{item.label}</dt>
                          <dd className="min-w-0 flex-1 break-words text-right text-sm font-semibold text-gray-900">
                            {formatEvidenceValue(item.value, item.unit)}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              )}
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
