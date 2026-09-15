import { WebSocketTicket } from '../types/chat';
import { apiPost } from './client';

/**
 * 웹소켓(STOMP)/SSE 연결용 1회용 티켓 발급 — POST /ws/tickets
 * 30초 내 미사용 시 만료, 소비되는 즉시 삭제되므로 연결 직전에 매번 새로 받아야 한다.
 */
export function issueWebSocketTicket(): Promise<WebSocketTicket> {
  return apiPost<WebSocketTicket>('/ws/tickets', {}, { auth: true });
}
