import { AppNotification } from '../../types/notification';
import { apiGet, apiPatch, BASE_URL } from '../client';
import { issueWebSocketTicket } from '../wsTicketApi';

/** 알림이 읽음 처리돼 헤더의 안 읽은 알림 수를 다시 가져와야 할 때 보내는 이벤트 */
export const NOTIFICATIONS_CHANGED_EVENT = 'homes:notifications-changed';

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
 * 채팅방에 들어왔을 때 그 방과 관련된 안 읽은 알림을 모두 읽음 처리한다.
 * 백엔드에는 채팅방 단위 읽음 API가 없어서 목록에서 골라 하나씩 처리하고, 끝나면 헤더 배지를 갱신시킨다.
 * 실패해도 채팅 사용에는 영향이 없어야 하므로 오류는 무시한다.
 */
export async function markChatNotificationsRead(chatId: number): Promise<void> {
  try {
    const unread = (await fetchNotifications()).filter(
      (notification) => notification.type === 'CHAT' && notification.referenceId === chatId && !notification.isRead,
    );
    if (unread.length === 0) return;
    await Promise.all(unread.map((notification) => markNotificationRead(notification.notificationId)));
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
  } catch {
    /* 알림 정리 실패는 조용히 무시 */
  }
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
