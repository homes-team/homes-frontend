import { PropertyListItem } from '../types/property';
import { apiGet } from './client';

/** 전체 매물 리스트 조회 (최신 등록순) — GET /properties */
export function fetchAllProperties(): Promise<PropertyListItem[]> {
  return apiGet<PropertyListItem[]>('/properties');
}

/** 실시간 급상승 랭킹 조회 — GET /properties/surge-rankings */
export function fetchSurgeRankings(): Promise<PropertyListItem[]> {
  return apiGet<PropertyListItem[]>('/properties/surge-rankings', { auth: true });
}
