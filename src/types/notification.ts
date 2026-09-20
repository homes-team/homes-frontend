/** NotificationType.java 대응 */
export type NotificationType = 'CHAT' | 'MATCHING' | 'SAFE_TRADE';

/**
 * NotificationResDto.java 대응.
 * referenceId 의미: CHAT → chatId, MATCHING/SAFE_TRADE → propertyId
 */
export interface AppNotification {
  notificationId: number;
  content: string;
  isRead: boolean;
  type: NotificationType;
  referenceId: number;
  createdAt: string;
}
