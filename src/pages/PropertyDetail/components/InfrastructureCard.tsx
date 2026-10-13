import { useEffect, useMemo, useState } from 'react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { fetchInfrastructure } from '../../../api/property/infrastructureApi';
import { INFRA_RADIUS_METERS, INFRA_TYPE_ICON, INFRA_TYPE_LABEL, InfrastructureItem } from '../../../types/infrastructure';
import {
  boundsAround,
  formatDistance,
  groupNearby,
  STATION_AREA_METERS,
  walkingMinutes,
} from '../../../utils/infrastructure';

interface InfrastructureCardProps {
  latitude: number;
  longitude: number;
}

/** 모든 카테고리 반경을 덮는 조회 영역 (가장 넓은 반경 기준) */
const FETCH_RADIUS_METERS = Math.max(...Object.values(INFRA_RADIUS_METERS));

const formatRadius = (meters: number) => (meters >= 1000 ? `${meters / 1000}km` : `${meters}m`);

/** 매물 상세의 "주변 인프라" — 지하철·버스·마트·병원·학교·공원·문화시설까지의 거리와 도보 시간 */
function InfrastructureCard({ latitude, longitude }: InfrastructureCardProps) {
  const [items, setItems] = useState<InfrastructureItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setItems(null);
    setError(null);

    fetchInfrastructure(boundsAround({ lat: latitude, lng: longitude }, FETCH_RADIUS_METERS), undefined, controller.signal)
      .then(setItems)
      .catch((err: Error) => {
        if (!controller.signal.aborted) setError(err.message);
      });

    return () => controller.abort();
  }, [latitude, longitude, attempt]);

  const groups = useMemo(() => (items ? groupNearby(items, { lat: latitude, lng: longitude }) : []), [items, latitude, longitude]);
  const stationNearby = groups.find((group) => group.type === 'SUBWAY')?.nearest[0];

  if (error) {
    return (
      <Card className="flex flex-col items-start gap-3">
        <p className="text-sm text-gray-600">주변 인프라를 불러오지 못했어요. {error}</p>
        <button type="button" onClick={() => setAttempt((prev) => prev + 1)} className="text-sm font-bold text-primary underline">
          다시 시도
        </button>
      </Card>
    );
  }

  if (!items) {
    return (
      <Card>
        <p className="py-6 text-center text-sm text-gray-500">주변 인프라를 불러오는 중...</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-5">
      {stationNearby && stationNearby.distance <= STATION_AREA_METERS && (
        <div className="flex items-center gap-2">
          <Badge variant="primary">역세권</Badge>
          <p className="text-sm text-gray-700">
            {stationNearby.item.name}까지 도보 {walkingMinutes(stationNearby.distance)}분 ({formatDistance(stationNearby.distance)})
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
        {groups.map((group) => (
          <section key={group.type} aria-label={INFRA_TYPE_LABEL[group.type]}>
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="text-[15px] font-bold text-gray-900">
                <span aria-hidden="true">{INFRA_TYPE_ICON[group.type]}</span> {INFRA_TYPE_LABEL[group.type]}
              </h3>
              <span className="text-xs text-gray-500">
                반경 {formatRadius(group.radius)} {group.total}곳
              </span>
            </div>

            {group.nearest.length === 0 ? (
              <p className="rounded-lg bg-gray-50 px-3 py-2.5 text-[13px] text-gray-500">반경 {formatRadius(group.radius)} 안에 없어요</p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {group.nearest.map(({ item, distance }) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[14px]">
                    <span className="truncate text-gray-900">{item.name}</span>
                    <span className="shrink-0 text-[13px] text-gray-500">
                      {formatDistance(distance)} · 도보 {walkingMinutes(distance)}분
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <p className="text-xs leading-relaxed text-gray-500">
        직선거리 기준이고, 도보 시간은 1분에 80m로 계산한 값이에요. 실제 길 경로와는 다를 수 있어요. 편의점·카페 정보는 아직 제공되지 않아요.
      </p>
    </Card>
  );
}

export default InfrastructureCard;
