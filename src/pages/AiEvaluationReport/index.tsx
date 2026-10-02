import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchAiEvaluation, fetchPropertyDetail } from '../../api/property/propertyApi';
import PageShell from '../../components/layout/PageShell';
import { AiEvaluation } from '../../types/property';
import AiEvaluationCard from '../PropertyDetail/components/AiEvaluationCard';
import AiRadarChart from '../PropertyDetail/components/AiRadarChart';

function AiEvaluationReportPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const id = Number(propertyId);
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState<AiEvaluation | null>(null);
  const [propertyTitle, setPropertyTitle] = useState<{ propertyId: number; title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const title = propertyTitle?.propertyId === id ? propertyTitle.title : '매물';
  const currentEvaluation = evaluation?.propertyId === id ? evaluation : null;

  useEffect(() => {
    setPropertyTitle(null);
    setEvaluation(null);
    if (!Number.isFinite(id)) {
      setLoading(false);
      setError('유효하지 않은 매물 ID입니다.');
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchAiEvaluation(id, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setEvaluation(result);
      })
      .catch((reason: Error) => {
        if (!controller.signal.aborted) setError(reason.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    fetchPropertyDetail(id, controller.signal)
      .then((property) => {
        if (!controller.signal.aborted) setPropertyTitle({ propertyId: id, title: property.title });
      })
      .catch(() => {
        // The title is optional; keep the default when property details are unavailable.
      });
    return () => controller.abort();
  }, [id, version]);

  return (
    <PageShell>
      <button type="button" onClick={() => navigate(`/properties/${id}`)} className="mb-5 text-sm text-gray-500 hover:text-primary">
        ← 매물로 돌아가기
      </button>
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">{title}</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">AI 매물 다면평가 리포트</h1>
        <p className="mt-2 text-sm text-gray-500">여섯 가지 관점의 균형과 주변 환경을 한눈에 확인해 보세요.</p>
      </div>

      {currentEvaluation && !loading && !error && (
        <div className="mb-8 rounded-card border border-primary-100 bg-primary-50 p-5">
          <div className="mx-auto max-w-[320px] text-center">
            <p className="text-sm font-semibold text-primary">종합 {currentEvaluation.overall.displayScore?.toFixed(1) ?? '-'} / 5.0</p>
            <AiRadarChart categories={currentEvaluation.categories ?? []} />
          </div>
        </div>
      )}

      <AiEvaluationCard
        evaluation={currentEvaluation}
        loading={loading}
        error={error}
        onRetry={() => setVersion((current) => current + 1)}
      />
    </PageShell>
  );
}

export default AiEvaluationReportPage;
