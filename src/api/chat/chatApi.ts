import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { ChatMessage, ChatRoom, ChatRoomCreateRequest } from '../../types/chat';
import { apiDelete, apiGet, apiPost, WS_BASE_URL } from '../client';
import { issueWebSocketTicket } from '../wsTicketApi';

export interface ChatSocketHandle {
  /** SEND /app/chats/{chatId}/send */
  send: (content: string) => void;
  /** 구독 해제 + 연결 종료. 컴포넌트 unmount 시 반드시 호출해야 한다. */
  disconnect: () => void;
}

/** 채팅방 생성(또는 기존 방 재오픈) — POST /chats (일반 유저 전용) */
export function createChatRoom(request: ChatRoomCreateRequest): Promise<ChatRoom> {
  return apiPost<ChatRoom>('/chats', request, { auth: true });
}

/** 내가 참여 중인 채팅방 목록 — GET /chats */
export function fetchChatRooms(): Promise<ChatRoom[]> {
  return apiGet<ChatRoom[]>('/chats', { auth: true });
}

/** 채팅방 메시지 목록 (오래된순, 조회 시 상대 메시지 읽음처리) — GET /chats/{chatId}/messages */
export function fetchChatMessages(chatId: number): Promise<ChatMessage[]> {
  return apiGet<ChatMessage[]>(`/chats/${chatId}/messages`, { auth: true });
}

/** 채팅방 나가기 — DELETE /chats/{chatId}/members/me */
export function leaveChatRoom(chatId: number): Promise<void> {
  return apiDelete<void>(`/chats/${chatId}/members/me`, { auth: true });
}

/**
 * 채팅방 하나에 실시간(STOMP) 연결을 붙인다.
 * 연결 직전에 1회용 티켓을 새로 발급받아 `?ticket=` 쿼리로 핸드셰이크한다(Authorization 헤더를
 * 웹소켓에 못 붙이기 때문 — WebSocketTicketController 참고).
 *
 * @returns send/disconnect 핸들. 컴포넌트 unmount 시 반드시 disconnect()를 호출해야 한다.
 */
export async function connectChatSocket(
  chatId: number,
  onMessage: (message: ChatMessage) => void,
  onError?: (error: unknown) => void,
): Promise<ChatSocketHandle> {
  const { ticket } = await issueWebSocketTicket();

  let subscription: StompSubscription | null = null;
  const client = new Client({
    brokerURL: `${WS_BASE_URL}/ws/chats?ticket=${encodeURIComponent(ticket)}`,
    reconnectDelay: 0, // 티켓이 1회용이라 자동 재연결이 불가능함 — 실패 시 상위에서 다시 connectChatSocket을 불러야 함
    onConnect: () => {
      subscription = client.subscribe(`/topic/chats/${chatId}`, (frame: IMessage) => {
        onMessage(JSON.parse(frame.body) as ChatMessage);
      });
    },
    onStompError: (frame) => onError?.(new Error(frame.headers.message ?? 'STOMP 오류')),
    onWebSocketError: (event) => onError?.(event),
  });

  client.activate();

  return {
    send: (content: string) => {
      client.publish({
        destination: `/app/chats/${chatId}/send`,
        body: JSON.stringify({ content }),
      });
    },
    disconnect: () => {
      subscription?.unsubscribe();
      client.deactivate();
    },
  };
}
