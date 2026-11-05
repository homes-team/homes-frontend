import { apiGet, apiPatch } from '../client';
import { AppNotification } from '../../types/notification';
import { markChatNotificationsRead, NOTIFICATIONS_CHANGED_EVENT } from './notificationApi';

vi.mock('../client', () => ({ apiGet: vi.fn(), apiPatch: vi.fn(), BASE_URL: '' }));
vi.mock('../wsTicketApi', () => ({ issueWebSocketTicket: vi.fn() }));

const notification = (id: number, type: AppNotification['type'], referenceId: number, isRead = false): AppNotification => ({
  notificationId: id, content: '새 메시지', isRead, type, referenceId, createdAt: '2026-11-05T09:00:00',
});

beforeEach(() => vi.resetAllMocks());

describe('markChatNotificationsRead', () => {
  it('marks only the unread chat notifications of that room as read and tells the header', async () => {
    vi.mocked(apiGet).mockResolvedValue([
      notification(1, 'CHAT', 7),
      notification(2, 'CHAT', 7),
      notification(3, 'CHAT', 8),
      notification(4, 'MATCHING', 7),
      notification(5, 'CHAT', 7, true),
    ]);
    vi.mocked(apiPatch).mockResolvedValue(undefined);
    const changed = vi.fn();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, changed);

    await markChatNotificationsRead(7);

    expect(apiPatch).toHaveBeenCalledTimes(2);
    expect(apiPatch).toHaveBeenCalledWith('/users/me/notifications/1', {}, { auth: true });
    expect(apiPatch).toHaveBeenCalledWith('/users/me/notifications/2', {}, { auth: true });
    expect(changed).toHaveBeenCalledTimes(1);
    window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, changed);
  });

  it('leaves the badge alone when there is nothing to clear', async () => {
    vi.mocked(apiGet).mockResolvedValue([notification(3, 'CHAT', 8)]);
    const changed = vi.fn();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, changed);

    await markChatNotificationsRead(7);

    expect(apiPatch).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
    window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, changed);
  });

  it('does not break the chat when clearing fails', async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error('네트워크 오류'));

    await expect(markChatNotificationsRead(7)).resolves.toBeUndefined();
  });
});
