import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import Button from '../../components/ui/Button';
import { Input, ErrorText } from '../../components/ui/Field';
import { connectChatSocket, fetchChatMessages, fetchChatRooms, leaveChatRoom, ChatSocketHandle } from '../../api/chat/chatApi';
import { ApiError } from '../../api/client';
import { getCurrentUser } from '../../utils/auth';
import { ChatMessage } from '../../types/chat';

/**
 * active: 대화 가능 / selfLeft: 내가 이미 나간 방(알림으로 다시 들어온 경우 등) / peerLeft: 상대가 나간 방
 * 나가기는 내 쪽 플래그만 표시하고 방은 남아 있어서, 들어올 때 목록과 대조해 상태를 판단한다.
 */
type RoomStatus = 'active' | 'selfLeft' | 'peerLeft';

function ChatRoomPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const id = Number(chatId);
  const navigate = useNavigate();
  const user = getCurrentUser();
  const myUserId = user ? Number(user.sub) : null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [roomStatus, setRoomStatus] = useState<RoomStatus>('active');

  const socketRef = useRef<ChatSocketHandle | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const open = async () => {
      // 내가 나간 방은 목록에서 빠지므로, 목록에 없으면 이미 나간 방으로 본다
      const room = (await fetchChatRooms()).find((candidate) => candidate.chatId === id);
      if (cancelled) return;
      if (!room) {
        setRoomStatus('selfLeft');
        return;
      }
      const peerLeft = myUserId === room.userId ? room.isAgentLeft : room.isUserLeft;
      setRoomStatus(peerLeft ? 'peerLeft' : 'active');

      const history = await fetchChatMessages(id);
      if (cancelled) return;
      setMessages(history);
      if (peerLeft) return;

      connectChatSocket(
        id,
        (message) => setMessages((prev) => [...prev, message]),
        () => {
          if (!cancelled) setConnectionError('실시간 연결이 끊겼어요. 새로고침해주세요.');
        },
      )
        .then((handle) => {
          if (cancelled) {
            handle.disconnect();
            return;
          }
          socketRef.current = handle;
        })
        .catch(() => {
          if (!cancelled) setConnectionError('실시간 연결에 실패했어요. 새로고침해주세요.');
        });
    };

    open()
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || !socketRef.current) return;
    socketRef.current.send(content);
    setInput('');
  };

  const handleSuggestVisitDate = () => {
    if (!socketRef.current) return;
    socketRef.current.send('방문 가능하신 날짜와 시간대를 알려주시면 일정을 조율해볼게요 📅');
  };

  const handleLeave = async () => {
    if (!window.confirm('채팅방을 나가시겠어요?')) return;
    try {
      await leaveChatRoom(id);
      navigate('/chats');
    } catch (err) {
      setConnectionError(err instanceof ApiError ? err.message : '나가기에 실패했어요.');
    }
  };

  return (
    <PageShell>
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => navigate('/chats')} className="text-[13px] font-medium text-gray-500 hover:text-primary">
          ← 채팅 목록
        </button>
        {roomStatus !== 'selfLeft' && (
          <Button variant="secondary" onClick={handleLeave}>
            나가기
          </Button>
        )}
      </div>

      {loading && <p className="py-12 text-center text-sm text-gray-500">불러오는 중...</p>}
      {!loading && error && <p className="rounded-button bg-red-50 p-4 text-sm font-medium text-danger">{error}</p>}

      {!loading && !error && roomStatus === 'selfLeft' && (
        <div className="flex flex-col items-center gap-4 rounded-card border border-gray-200 px-6 py-12 text-center">
          <p className="text-[15px] font-bold text-gray-900">이미 나간 채팅방이에요</p>
          <p className="text-sm text-gray-500">나간 채팅방에서는 더 이상 대화할 수 없어요.</p>
          <Button onClick={() => navigate('/chats')}>채팅 목록으로</Button>
        </div>
      )}

      {!loading && !error && roomStatus !== 'selfLeft' && (
        <div className="flex h-[60vh] flex-col overflow-hidden rounded-card border border-gray-200">
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
            {messages.map((message) => {
              const mine = message.senderId === myUserId;
              return (
                <div key={message.messageId} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[70%] rounded-2xl px-3.5 py-2.5 text-sm break-words ${
                      mine ? 'bg-primary text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}
            {roomStatus === 'peerLeft' && (
              <p role="status" className="my-2 text-center text-[13px] text-gray-500">
                상대가 나갔습니다.
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          {connectionError && (
            <div className="px-3">
              <ErrorText>{connectionError}</ErrorText>
            </div>
          )}

          {roomStatus === 'peerLeft' ? (
            <p className="border-t border-gray-200 p-4 text-center text-sm text-gray-500">
              상대가 나가서 더 이상 메시지를 보낼 수 없어요.
            </p>
          ) : (
            <>
              <div className="flex gap-2 border-t border-gray-200 px-3 pt-3">
                <button
                  type="button"
                  onClick={handleSuggestVisitDate}
                  className="rounded-pill border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  📅 방문 날짜 제안하기
                </button>
              </div>

              <form className="flex gap-2 p-3" onSubmit={handleSend}>
                <Input
                  className="flex-1"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="메시지를 입력해주세요"
                />
                <Button type="submit">전송</Button>
              </form>
            </>
          )}
        </div>
      )}
    </PageShell>
  );
}

export default ChatRoomPage;
