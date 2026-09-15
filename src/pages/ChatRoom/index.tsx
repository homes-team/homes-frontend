import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import Button from '../../components/ui/Button';
import { Input, ErrorText } from '../../components/ui/Field';
import { connectChatSocket, fetchChatMessages, leaveChatRoom, ChatSocketHandle } from '../../api/chatApi';
import { ApiError } from '../../api/client';
import { getCurrentUser } from '../../utils/auth';
import { ChatMessage } from '../../types/chat';

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

  const socketRef = useRef<ChatSocketHandle | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    fetchChatMessages(id)
      .then((data) => {
        if (!cancelled) setMessages(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    connectChatSocket(
      id,
      (message) => setMessages((prev) => [...prev, message]),
      () => setConnectionError('실시간 연결이 끊겼어요. 새로고침해주세요.'),
    ).then((handle) => {
      if (cancelled) {
        handle.disconnect();
        return;
      }
      socketRef.current = handle;
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
        <Button variant="secondary" onClick={handleLeave}>
          나가기
        </Button>
      </div>

      {loading && <p className="py-12 text-center text-sm text-gray-500">불러오는 중...</p>}
      {!loading && error && <p className="rounded-button bg-red-50 p-4 text-sm font-medium text-danger">{error}</p>}

      {!loading && !error && (
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
            <div ref={bottomRef} />
          </div>

          {connectionError && (
            <div className="px-3">
              <ErrorText>{connectionError}</ErrorText>
            </div>
          )}

          <form className="flex gap-2 border-t border-gray-200 p-3" onSubmit={handleSend}>
            <Input
              className="flex-1"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="메시지를 입력해주세요"
            />
            <Button type="submit">전송</Button>
          </form>
        </div>
      )}
    </PageShell>
  );
}

export default ChatRoomPage;
