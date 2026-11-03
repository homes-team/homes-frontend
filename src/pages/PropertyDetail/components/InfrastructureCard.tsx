import { useEffect, useMemo, useState } from 'react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { fetchNearbyFacilities } from '../../../api/property/propertyApi';
import { NearbyFacilities, NearbyFacility, NearbyFacilityType } from '../../../types/property';
import { formatDistance, STATION_AREA_METERS, walkingMinutes } from '../../../utils/infrastructure';

interface InfrastructureCardProps {
  propertyId: number;
}

const FACILITY_CONFIG: Array<{
  type: NearbyFacilityType;
  label: string;
  icon: string;
  radius: number;
}> = [
  { type: 'SUBWAY', label: '지하철역', icon: '🚇', radius: 1500 },
  { type: 'BUS_STOP', label: '버스 정류장', icon: '🚌', radius: 500 },
  { type: 'MART', label: '대형마트', icon: '🛒', radius: 1500 },
  { type: 'HOSPITAL', label: '병원', icon: '🏥', radius: 1000 },
  { type: 'SCHOOL', label: '학교', icon: '🏫', radius: 1000 },
  { type: 'PARK', label: '공원', icon: '🌳', radius: 1000 },
  { type: 'CULTURE', label: '문화시설', icon: '🎭', radius: 1500 },
];

const NEARBY_LIMIT = 3;

const formatRadius = (meters: number) => (meters >= 1000 ? `${meters / 1000}km` : `${meters}m`);

function groupFacilities(data: NearbyFacilities | null) {
  return FACILITY_CONFIG.map((config) => {
    const byName = new Map<string, NearbyFacility>();
    data?.facilities
      .filter((facility) => facility.type === config.type && facility.distanceMeters <= config.radius)
      .forEach((facility) => {
        const existing = byName.get(facility.name);
        if (!existing || facility.distanceMeters < existing.distanceMeters) byName.set(facility.name, facility);
      });
    const sorted = [...byName.values()].sort((left, right) => left.distanceMeters - right.distanceMeters);
    return { ...config, nearest: sorted.slice(0, NEARBY_LIMIT), total: sorted.length };
  });
}

/** 매물 상세의 "주변 인프라" — 지하철·버스·마트·병원·학교·공원·문화시설까지의 거리와 도보 시간 */
function InfrastructureCard({ propertyId }: InfrastructureCardProps) {
  const [facilities, setFacilities] = useState<NearbyFacilities | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setFacilities(null);
    setError(null);

    fetchNearbyFacilities(propertyId, controller.signal)
      .then(setFacilities)
      .catch((err: Error) => {
        if (!controller.signal.aborted) setError(err.message);
      });

    return () => controller.abort();
  }, [propertyId, attempt]);

  const groups = useMemo(() => groupFacilities(facilities), [facilities]);
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

  if (!facilities) {
    return (
      <Card>
        <p className="py-6 text-center text-sm text-gray-500">주변 인프라를 불러오는 중...</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-5">
      {stationNearby && stationNearby.distanceMeters <= STATION_AREA_METERS && (
        <div className="flex items-center gap-2">
          <Badge variant="primary">역세권</Badge>
          <p className="text-sm text-gray-700">
            {stationNearby.name}까지 도보 {walkingMinutes(stationNearby.distanceMeters)}분 ({formatDistance(stationNearby.distanceMeters)})
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
        {groups.map((group) => (
          <section key={group.type} aria-label={group.label}>
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="text-[15px] font-bold text-gray-900">
                <span aria-hidden="true">{group.icon}</span> {group.label}
              </h3>
              <span className="text-xs text-gray-500">
                반경 {formatRadius(group.radius)} {group.total}곳
              </span>
            </div>

            {group.nearest.length === 0 ? (
              <p className="rounded-lg bg-gray-50 px-3 py-2.5 text-[13px] text-gray-500">반경 {formatRadius(group.radius)} 안에 없어요</p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {group.nearest.map((facility) => (
                  <li key={facility.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[14px]">
                    <span className="truncate text-gray-900">{facility.name}</span>
                    <span className="shrink-0 text-[13px] text-gray-500">
                      {formatDistance(facility.distanceMeters)} · 도보 {walkingMinutes(facility.distanceMeters)}분
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
