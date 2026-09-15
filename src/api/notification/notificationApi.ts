import { AppNotification } from '../../types/notification';
import { apiGet, apiPatch, BASE_URL } from '../client';
import { issueWebSocketTicket } from '../wsTicketApi';

/** 내 알림 목록 (최신순) — GET /users/me/notifications */
export function fetchNotifications(): Promise<AppNotification[]> {
  return apiGet<AppNotification[]>('/users/me/notifications', { auth: true });
}

/** 전체 읽음 처리 — PATCH /users/me/notifications */
export function markAllNotificationsRead(): Promise<void> {
  return apiPatch<void>('/users/me/notifications', {}, { auth: true });
}

/** 개별 읽음 처리 — PATCH /users/me/notifications/{notificationId} */
export function markNotificationRead(notificationId: number): Promise<void> {
  return apiPatch<void>(`/users/me/notifications/${notificationId}`, {}, { auth: true });
}

/**
 * 실시간 알림 SSE 구독 — GET /users/me/notifications/stream?ticket=...
 * EventSource는 커스텀 헤더를 못 붙여서, 연결 직전에 1회용 티켓을 발급받아 쿼리로 전달한다.
 * @returns 연결을 끊는 cleanup 함수. 컴포넌트 unmount 시 반드시 호출해야 한다.
 */
export async function subscribeToNotifications(
  onNotification: (notification: AppNotification) => void,
  onError?: (error: unknown) => void,
): Promise<() => void> {
  const { ticket } = await issueWebSocketTicket();
  const source = new EventSource(`${BASE_URL}/users/me/notifications/stream?ticket=${encodeURIComponent(ticket)}`);

  source.addEventListener('notification', (event) => {
    onNotification(JSON.parse((event as MessageEvent).data) as AppNotification);
  });
  source.onerror = (event) => onError?.(event);

  return () => source.close();
}
