// ============================================================
// notification.model.ts
// ============================================================
export type NotificationType =
  | 'message' | 'reaction' | 'file' | 'location' | 'mention' | 'system';

export interface AppNotification {
  id:            string;
  recipientId:   string;
  senderId?:     string;
  senderName?:   string;
  senderAvatar?: string;
  type:          NotificationType;
  title:         string;
  body:          string;
  icon?:         string;
  chatRoomId?:   string;
  messageId?:    string;
  routerLink?:   string;
  read:          boolean;
  createdAt:     string;
}
