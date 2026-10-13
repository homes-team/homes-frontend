import { InfraType, InfrastructureItem } from '../../types/infrastructure';
import { Bounds } from '../../utils/infrastructure';
import { apiGet } from '../client';

/** 영역 안의 주변 인프라 — GET /properties/infrastructure (로그인 불필요). infraType을 주면 그 종류만 */
export function fetchInfrastructure(
  bounds: Bounds,
  infraType?: InfraType,
  signal?: AbortSignal,
): Promise<InfrastructureItem[]> {
  const params = new URLSearchParams({
    minLat: String(bounds.minLat),
    minLon: String(bounds.minLon),
    maxLat: String(bounds.maxLat),
    maxLon: String(bounds.maxLon),
  });
  if (infraType) params.set('infraType', infraType);
  return apiGet<InfrastructureItem[]>(`/properties/infrastructure?${params.toString()}`, { signal });
}
