import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import Card from '../../components/ui/Card';
import { fetchChatRooms } from '../../api/chatApi';
import { fetchPropertyDetail } from '../../api/propertyApi';
import { getCurrentUser } from '../../utils/auth';
import { formatRelativeTime } from '../../utils/format';
import { ChatRoom } from '../../types/chat';

interface ChatRoomRow extends ChatRoom {
  propertyTitle?: string;
}

function ChatListPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const myUserId = user ? Number(user.sub) : null;

  const [rooms, setRooms] = useState<ChatRoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchChatRooms()
      .then(async (list) => {
        if (cancelled) return;
        setRooms(list);
        setLoading(false);
        // 각 방의 매물 제목은 부수적으로 채운다 — 실패해도 방 목록 자체는 이미 보여준 상태
        list.forEach((room) => {
          fetchPropertyDetail(room.propertyId)
            .then((detail) => {
              if (cancelled) return;
              setRooms((prev) =>
                prev.map((r) => (r.chatId === room.chatId ? { ...r, propertyTitle: detail.title } : r)),
              );
            })
            .catch(() => {
              /* 제목 못 가져와도 무시 */
            });
        });
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell>
      <h1 className="mb-4 text-xl font-bold text-gray-900">채팅</h1>

      {loading && <p className="py-12 text-center text-sm text-gray-500">불러오는 중...</p>}
      {!loading && error && <p className="rounded-button bg-red-50 p-4 text-sm font-medium text-danger">{error}</p>}
      {!loading && !error && rooms.length === 0 && (
        <p className="py-12 text-center text-sm text-gray-500">아직 시작된 채팅방이 없어요.</p>
      )}

      {!loading && !error && rooms.length > 0 && (
        <div className="flex flex-col gap-3">
          {rooms.map((room) => {
            const isSelfLeft = myUserId === room.userId ? room.isUserLeft : room.isAgentLeft;
            return (
              <button key={room.chatId} type="button" onClick={() => navigate(`/chats/${room.chatId}`)}>
                <Card className="flex items-center justify-between text-left">
                  <div>
                    <p className="font-bold">{room.propertyTitle ?? `매물 #${room.propertyId}`}</p>
                    <p className="text-[13px] text-gray-500">{isSelfLeft ? '채팅방을 나갔어요' : '대화 중'}</p>
                  </div>
                  <span className="text-[13px] text-gray-400">{formatRelativeTime(room.createdAt)}</span>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

export default ChatListPage;
