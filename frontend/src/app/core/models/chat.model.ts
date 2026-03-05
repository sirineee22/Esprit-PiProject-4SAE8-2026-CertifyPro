// ============================================================
// chat.model.ts — Vos interfaces existantes + types avancés
// ============================================================

export interface GroupUser {
  roomId: string;
  name:   string;
  unread: string;
}

export interface ChatUser {
  roomId: string;
  userId: string;
  image:  string;
  name:   string;
  status: string;
  unread: string;
}

// ── NOUVEAUX : Type de message & Réaction ─────────────────
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'location';

export interface Reaction {
  emoji:   string;
  count:   number;
  userIds: string[];
}

// ── ChatMessage — vos champs existants + champs avancés ───
export interface ChatMessage {
  id?:          string;
  chatRoomId?:  string;
  senderId?:    string;
  name?:        string;
  profile?:     string | null;
  message?:     string;
  time?:        string;
  align?:       'left' | 'right';
  image?:       string[];
  replayName?:  string;
  replaymsg?:   string;
  replyToId?:   string;

  // ── Avancé (nouveaux) ──────────────────────────────────
  type?:         MessageType;
  fileUrl?:      string;
  fileName?:     string;
  fileSize?:     string;
  fileMimeType?: string;
  latitude?:     number;
  longitude?:    number;
  locationUrl?:  string;
  mapThumb?:     string;
  reactions?:    Reaction[];
    pinned?: boolean;

}

// ── MessageRequest — vos champs existants + champs avancés
export interface MessageRequest {
  chatRoomId:   string;
  senderId:     string;
  name:         string;
  profile:      string;
  message:      string;
  align:        string;
  image?:       string[];
  replyToId?:   string;
  type?:        MessageType;
  fileUrl?:     string;
  fileName?:    string;
  fileSize?:    string;
  latitude?:    number;
  longitude?:   number;
  locationUrl?: string;
}

// ── NOUVEAU : Réponse upload ──────────────────────────────
export interface FileUploadResponse {
  id:           string;
  url:          string;
  fileName:     string;
  fileSize:     string;
  fileMimeType: string;
  type:         string;
}

// ── Vos interfaces existantes inchangées ─────────────────
export interface ContactModel {
  title: string;
  contacts: Array<{
    userId:  string;
    name:    string;
    profile: string;
  }>;
}

export interface ConnectRequest {
  userId:  string;
  roomId?: string;
  name?:   string;
  image?:  string;
  email?:  string;
}

export interface AddContactRequest  { targetUserId: string; }
export interface CreateGroupRequest { groupName: string; memberIds: string[]; description?: string; }

// ── NOUVEAUX ─────────────────────────────────────────────
export interface ReactionRequest { emoji: string; userId: string; }
export interface LocationRequest {
  chatRoomId: string;
  senderId:   string;
  name:       string;
  profile:    string;
  latitude:   number;
  longitude:  number;
}
