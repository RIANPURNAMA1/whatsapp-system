// types/index.ts - Semua TypeScript types

export interface Session {
  id: string;
  name: string;
  phone_number: string | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'banned';
  qr_code: string | null;
  last_qr_at: string | null;
  connected_at: string | null;
  created_at: string;
  is_connected?: boolean;
}

export interface Chat {
  id: number;
  session_id: string;
  last_message_type?: string; // TAMBAHKAN INI
  jid: string;
  name: string | null;
  display_name: string | null;
  is_group: number;
  unread_count: number;
  last_message: string | null;
  last_message_time: string | null;
  last_message_from: string | null;
  pinned: number;
  archived: number;
  muted: number;
  profile_pic_url: string | null;
  created_at: string;
}

export type MessageType = 
  | 'text' | 'image' | 'video' | 'audio' | 'document' 
  | 'sticker' | 'location' | 'contact' | 'reaction' | 'deleted' | 'unknown';

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'received';

export interface Message {
  id: number;
  session_id: string;
  message_id: string;
  chat_jid: string;
  from_jid: string;
  to_jid: string | null;
  is_from_me: number;
  message_type: MessageType;
  content: string | null;
  caption: string | null;
  media_url: string | null;
  media_mime_type: string | null;
  quoted_message_id: string | null;
  quoted_content: string | null;
  status: MessageStatus;
  is_deleted: number;
  timestamp: string;
  sender_name: string | null;
  created_at: string;
}

export interface Contact {
  id: number;
  session_id: string;
  jid: string;
  name: string | null;
  push_name: string | null;
  phone_number: string | null;
  profile_pic_url: string | null;
  is_business: number;
  is_group: number;
}

export interface Stats {
  totalChats: number;
  totalMessages: number;
  unreadChats: number;
  todayMessages: number;
  isConnected: boolean;
}

export interface SocketEvents {
  qr: string;
  status: string;
  message: Message;
  chatUpdate: string;
}