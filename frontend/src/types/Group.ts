// types/group.ts
// FILE BARU — tidak mengubah types/index.ts yang sudah ada

export interface GroupChat {
  id: number;
  session_id: string;
  jid: string;
  name: string | null;
  is_group: number;
  unread_count: number;
  last_message: string | null;
  last_message_time: string | null;
  last_message_from: string | null;
  last_message_type?: string; // Tambahkan ini
  pinned: number;
  archived: number;
  muted: number;
  created_at: string;

  // Field tambahan dari JOIN wa_groups
  group_subject: string | null;
  group_description: string | null;
  group_owner: string | null;
  participant_count: number | null;
  profile_pic_url: string | null;

  // Computed field dari COALESCE di SQL
  display_name: string | null;
}

export interface GroupMessage {
  id: number;
  session_id: string;
  message_id: string;
  chat_jid: string;
  from_jid: string;
  to_jid: string | null;
  is_from_me: number;
  message_type: string;
  content: string | null;
  caption: string | null;
  media_url: string | null;
  media_mime_type: string | null;
  quoted_message_id: string | null;
  quoted_content: string | null;
  status: string;
  is_deleted: number;
  timestamp: string;
  created_at: string;

  // Dari JOIN wa_contacts
  sender_name: string | null;
  sender_pic: string | null;
}

export interface GroupParticipant {
  jid: string;
  role: "member" | "admin" | "superadmin";
  display_name: string | null;
  profile_pic_url: string | null;
}