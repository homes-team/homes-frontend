import { RouteObject } from 'react-router-dom';
import ChatListPage from '../pages/ChatList';
import ChatRoomPage from '../pages/ChatRoom';

export const chatRoutes: RouteObject[] = [
  { path: '/chats', element: <ChatListPage /> },
  { path: '/chats/:chatId', element: <ChatRoomPage /> },
];
