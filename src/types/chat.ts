/** ChatRoomCreateReqDto.java 대응 */
export interface ChatRoomCreateRequest {
  propertyId: number;
  /** Agent의 agentId (Agent 프로필 ID, User.id 아님) */
  realtorId: number;
}

/** ChatRoomResDto.java 대응 */
export interface ChatRoom {
  chatId: number;
  propertyId: number;
  /** 집주인 계정의 User.id */
  userId: number;
  /** 중개사 계정의 User.id (Agent.agentId 아님) */
  agentUserId: number;
  isUserLeft: boolean;
  isAgentLeft: boolean;
  createdAt: string;
}

/** ChatMessageListResDto.java 대응. STOMP 실시간 수신 페이로드도 동일한 구조. */
export interface ChatMessage {
  messageId: number;
  content: string;
  isRead: boolean;
  senderId: number;
  createdAt: string;
}

/** WebSocketTicketResDto.java 대응 */
export interface WebSocketTicket {
  ticket: string;
}
