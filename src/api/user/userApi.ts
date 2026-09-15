import { UpdatePasswordRequest, UserProfile, UserUpdateProfileRequest, UserUpdateProfileResult } from '../../types/auth';
import { PropertyListItem, ReportListItem } from '../../types/property';
import { apiDelete, apiGet, apiPatch } from '../client';

/** 최근 본 방 조회 (로그인 필요) — GET /users/me/recent-views */
export function fetchMyRecentViews(): Promise<PropertyListItem[]> {
  return apiGet<PropertyListItem[]>('/users/me/recent-views', { auth: true });
}

/** 내 프로필 조회 — GET /users/me */
export function fetchMyProfile(): Promise<UserProfile> {
  return apiGet<UserProfile>('/users/me', { auth: true });
}

/** 내 프로필 수정 (닉네임/이용목적, 부분 수정) — PATCH /users/me */
export function updateMyProfile(request: UserUpdateProfileRequest): Promise<UserUpdateProfileResult> {
  return apiPatch<UserUpdateProfileResult>('/users/me', request, { auth: true });
}

/** 비밀번호 변경 — PATCH /users/me/password */
export function updateMyPassword(request: UpdatePasswordRequest): Promise<void> {
  return apiPatch<void>('/users/me/password', request, { auth: true });
}

/** 회원 탈퇴 — DELETE /users/me (등록된 매물이 있으면 실패) */
export function deleteMyAccount(): Promise<void> {
  return apiDelete<void>('/users/me', { auth: true });
}

/** 내가 등록한 매물 목록 — GET /users/me/properties */
export function fetchMyProperties(): Promise<PropertyListItem[]> {
  return apiGet<PropertyListItem[]>('/users/me/properties', { auth: true });
}

/** 내가 찜한 매물 목록 — GET /users/me/favorites */
export function fetchMyFavorites(): Promise<PropertyListItem[]> {
  return apiGet<PropertyListItem[]>('/users/me/favorites', { auth: true });
}

/** 내가 신고한 매물 목록 — GET /users/me/reports */
export function fetchMyReports(): Promise<ReportListItem[]> {
  return apiGet<ReportListItem[]>('/users/me/reports', { auth: true });
}
