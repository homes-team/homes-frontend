import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { connectChatSocket, fetchChatMessages, fetchChatRooms } from '../../api/chat/chatApi';
import { ChatRoom } from '../../types/chat';
import ChatRoomPage from './index';

vi.mock('../../api/chat/chatApi', () => ({
  connectChatSocket: vi.fn(),
  fetchChatMessages: vi.fn(),
  fetchChatRooms: vi.fn(),
  leaveChatRoom: vi.fn(),
}));
vi.mock('../../utils/auth', () => ({ getCurrentUser: () => ({ sub: '1' }) }));
vi.mock('../../components/layout/PageShell', () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));

const room = (overrides: Partial<ChatRoom> = {}): ChatRoom => ({
  chatId: 7, propertyId: 3, userId: 1, agentUserId: 2, isUserLeft: false, isAgentLeft: false, createdAt: '2026-11-01T09:00:00', ...overrides,
});

const renderRoom = () =>
  render(
    <MemoryRouter initialEntries={['/chats/7']}>
      <Routes><Route path="/chats/:chatId" element={<ChatRoomPage />} /></Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn(); // jsdom에는 없어서 스크롤 호출을 대신 막아둔다
  vi.resetAllMocks();
  vi.mocked(fetchChatMessages).mockResolvedValue([
    { messageId: 1, content: '안녕하세요', isRead: true, senderId: 2, createdAt: '2026-11-01T09:00:00' },
  ]);
  vi.mocked(connectChatSocket).mockResolvedValue({ send: vi.fn(), disconnect: vi.fn() });
});

describe('ChatRoomPage', () => {
  it('lets the members chat while nobody has left', async () => {
    vi.mocked(fetchChatRooms).mockResolvedValue([room()]);
    renderRoom();

    expect(await screen.findByPlaceholderText('메시지를 입력해주세요')).toBeInTheDocument();
    expect(connectChatSocket).toHaveBeenCalled();
    expect(screen.queryByText('상대가 나갔습니다.')).not.toBeInTheDocument();
  });

  it('blocks a room the user already left, e.g. when coming back through a notification', async () => {
    vi.mocked(fetchChatRooms).mockResolvedValue([]);
    renderRoom();

    expect(await screen.findByText('이미 나간 채팅방이에요')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('메시지를 입력해주세요')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '나가기' })).not.toBeInTheDocument();
    expect(fetchChatMessages).not.toHaveBeenCalled();
    expect(connectChatSocket).not.toHaveBeenCalled();
  });

  it('says the other side left and stops sending', async () => {
    vi.mocked(fetchChatRooms).mockResolvedValue([room({ isAgentLeft: true })]);
    renderRoom();

    expect(await screen.findByText('상대가 나갔습니다.')).toBeInTheDocument();
    expect(screen.getByText('안녕하세요')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('메시지를 입력해주세요')).not.toBeInTheDocument();
    expect(connectChatSocket).not.toHaveBeenCalled();
  });

  it('works out the other side from the caller role too', async () => {
    vi.mocked(fetchChatRooms).mockResolvedValue([room({ userId: 2, agentUserId: 1, isUserLeft: true })]);
    renderRoom();

    expect(await screen.findByText('상대가 나갔습니다.')).toBeInTheDocument();
  });
});
