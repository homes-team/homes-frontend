import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../../api/notificationApi';
import { formatRelativeTime } from '../../utils/format';
import { AppNotification } from '../../types/notification';

function notificationLink(notification: AppNotification): string {
  if (notification.type === 'CHAT') return `/chats/${notification.referenceId}`;
  return `/properties/${notification.referenceId}`;
}

function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications()
      .then(setNotifications)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClickNotification = async (notification: AppNotification) => {
    if (!notification.isRead) {
      await markNotificationRead(notification.notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === notification.notificationId ? { ...n, isRead: true } : n)),
      );
    }
    navigate(notificationLink(notification));
  };

  return (
    <PageShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">알림</h1>
        <Button variant="secondary" onClick={handleMarkAll}>
          전체 읽음 처리
        </Button>
      </div>

      {loading && <p className="py-12 text-center text-sm text-gray-500">불러오는 중...</p>}
      {!loading && error && <p className="rounded-button bg-red-50 p-4 text-sm font-medium text-danger">{error}</p>}
      {!loading && !error && notifications.length === 0 && (
        <p className="py-12 text-center text-sm text-gray-500">알림이 없어요.</p>
      )}

      {!loading && !error && notifications.length > 0 && (
        <div className="flex flex-col gap-3">
          {notifications.map((notification) => (
            <button key={notification.notificationId} type="button" onClick={() => handleClickNotification(notification)}>
              <Card className="flex items-center justify-between text-left">
                <p className={notification.isRead ? 'font-normal' : 'font-bold'}>{notification.content}</p>
                <span className="text-[13px] text-gray-400">{formatRelativeTime(notification.createdAt)}</span>
              </Card>
            </button>
          ))}
        </div>
      )}
    </PageShell>
  );
}

export default NotificationsPage;
