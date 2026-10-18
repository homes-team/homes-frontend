import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchAiEvaluation,
  fetchNearbyFacilities,
  fetchPropertyDetail,
  fetchPropertyIsochrone,
} from '../../api/property/propertyApi';
import PageShell from '../../components/layout/PageShell';
import {
  AiEvaluation,
  IsochroneMode,
  IsochroneTravelTime,
  NearbyFacilities,
  PropertyDirection,
  PropertyIsochrone,
} from '../../types/property';
import AiEvaluationCard from '../PropertyDetail/components/AiEvaluationCard';
import AiRadarChart from '../PropertyDetail/components/AiRadarChart';
import AiInfrastructureMap from './components/AiInfrastructureMap';

const ISOCHRONE_TIMES: IsochroneTravelTime[] = [5, 10];

function AiEvaluationReportPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const id = Number(propertyId);
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState<AiEvaluation | null>(null);
  const [facilities, setFacilities] = useState<NearbyFacilities | null>(null);
  const [isochrones, setIsochrones] = useState<PropertyIsochrone[]>([]);
  const [propertyMeta, setPropertyMeta] = useState<{
    propertyId: number;
    title: string;
    direction: PropertyDirection;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [facilitiesError, setFacilitiesError] = useState<string | null>(null);
  const [isochronesLoading, setIsochronesLoading] = useState(true);
  const [isochronesError, setIsochronesError] = useState<string | null>(null);
  const [isochronesCompletedTimes, setIsochronesCompletedTimes] = useState<IsochroneTravelTime[]>([]);
  const [isochroneMode, setIsochroneMode] = useState<IsochroneMode>('walk');
  const [version, setVersion] = useState(0);
  const [facilitiesVersion, setFacilitiesVersion] = useState(0);
  const [isochronesVersion, setIsochronesVersion] = useState(0);
  const title = propertyMeta?.propertyId === id ? propertyMeta.title : '매물';
  const direction = propertyMeta?.propertyId === id ? propertyMeta.direction : null;
  const currentEvaluation = evaluation?.propertyId === id ? evaluation : null;
  const currentFacilities = facilities?.propertyId === id ? facilities : null;
  const currentIsochrones = isochrones.filter((isochrone) => isochrone.propertyId === id);

  useEffect(() => {
    setPropertyMeta(null);
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
        if (!controller.signal.aborted) {
          setPropertyMeta({ propertyId: id, title: property.title, direction: property.direction });
        }
      })
      .catch(() => {
        // The title is optional; keep the default when property details are unavailable.
      });
    return () => controller.abort();
  }, [id, version]);

  useEffect(() => {
    setFacilities(null);
    if (!Number.isFinite(id)) {
      setFacilitiesLoading(false);
      setFacilitiesError(null);
      return;
    }
    const controller = new AbortController();
    setFacilitiesLoading(true);
    setFacilitiesError(null);
    fetchNearbyFacilities(id, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setFacilities(result);
      })
      .catch((reason: Error) => {
        if (!controller.signal.aborted) setFacilitiesError(reason.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setFacilitiesLoading(false);
      });
    return () => controller.abort();
  }, [facilitiesVersion, id]);

  useEffect(() => {
    setIsochrones((current) => current.filter((isochrone) => (
      isochrone.propertyId === id && isochrone.mode !== isochroneMode
    )));
    if (!Number.isFinite(id)) {
      setIsochronesLoading(false);
      setIsochronesError(null);
      return;
    }
    const controller = new AbortController();
    setIsochronesLoading(true);
    setIsochronesError(null);
    setIsochronesCompletedTimes([]);
    const requests = ISOCHRONE_TIMES.map((time) => (
      fetchPropertyIsochrone(id, isochroneMode, time, controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) {
            setIsochrones((current) => [
              ...current.filter((isochrone) => !(
                isochrone.propertyId === id
                && isochrone.mode === isochroneMode
                && isochrone.travelTimeMinutes === time
              )),
              result,
            ]);
            setIsochronesCompletedTimes((current) => (
              current.includes(time) ? current : [...current, time]
            ));
          }
          return result;
        })
    ));
    Promise.allSettled(requests)
      .then((results) => {
        if (controller.signal.aborted) return;
        const failure = results.find((result) => result.status === 'rejected');
        if (failure?.status === 'rejected') {
          const reason = failure.reason;
          setIsochronesError(reason instanceof Error ? reason.message : '생활권 계산에 실패했습니다.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsochronesLoading(false);
      });
    return () => controller.abort();
  }, [id, isochroneMode, isochronesVersion]);

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

      <AiInfrastructureMap
        evaluation={currentEvaluation}
        facilities={currentFacilities}
        direction={direction}
        loading={facilitiesLoading}
        error={facilitiesError}
        onRetry={() => setFacilitiesVersion((current) => current + 1)}
        isochrones={currentIsochrones}
        isochronesLoading={isochronesLoading}
        isochronesError={isochronesError}
        isochronesCompletedTimes={isochronesCompletedTimes}
        isochroneMode={isochroneMode}
        onIsochroneModeChange={setIsochroneMode}
        onRetryIsochrones={() => setIsochronesVersion((current) => current + 1)}
      />

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
