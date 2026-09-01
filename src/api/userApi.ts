import { PropertyListItem } from '../types/property';
import { apiGet } from './client';

/** 최근 본 방 조회 (로그인 필요) — GET /users/me/recent-views */
export function fetchMyRecentViews(): Promise<PropertyListItem[]> {
  return apiGet<PropertyListItem[]>('/users/me/recent-views', { auth: true });
}
