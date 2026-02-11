import axios from "axios";
import type { GroupChat, GroupMessage, GroupParticipant } from "../types/Group";

const BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:3001/api";

const http = axios.create({ baseURL: BASE_URL, timeout: 30000 });

http.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err.response?.data?.message || err.message || "Error";
    return Promise.reject(new Error(msg));
  }
);

export const groupApi = {
  // Ambil daftar semua grup untuk sebuah sesi/device
  getGroups: async (sessionId: string, search = ""): Promise<GroupChat[]> => {
    const r = await http.get<{ data: GroupChat[] }>(
      `/sessions/${sessionId}/groups`,
      { params: { search } }
    );
    return r.data.data;
  },

  // Ambil pesan di dalam sebuah grup
  getMessages: async (
    sessionId: string,
    groupJid: string,
    before?: string
  ): Promise<GroupMessage[]> => {
    const r = await http.get<{ data: GroupMessage[] }>(
      `/sessions/${sessionId}/groups/${encodeURIComponent(groupJid)}/messages`,
      { params: { before, limit: 40 } }
    );
    return r.data.data;
  },

  // Kirim pesan teks ke grup
  sendMessage: async (
    sessionId: string,
    groupJid: string,
    text: string,
    quotedMsgId?: string | null
  ): Promise<void> => {
    await http.post(
      `/sessions/${sessionId}/groups/${encodeURIComponent(groupJid)}/messages`,
      { text, quotedMsgId: quotedMsgId || undefined }
    );
  },

  // Kirim media ke grup — menggunakan endpoint media yang sudah ada
  sendMedia: async (
    sessionId: string,
    groupJid: string,
    file: File,
    caption = ""
  ): Promise<void> => {
    const fd = new FormData();
    fd.append("to", groupJid);
    fd.append("caption", caption);
    fd.append("file", file);
    await http.post(`/sessions/${sessionId}/messages/media`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Tandai pesan grup sebagai sudah dibaca
  markRead: async (sessionId: string, groupJid: string): Promise<void> => {
    await http.put(
      `/sessions/${sessionId}/groups/${encodeURIComponent(groupJid)}/read`
    );
  },

  // Ambil daftar anggota grup
  getParticipants: async (
    sessionId: string,
    groupJid: string
  ): Promise<GroupParticipant[]> => {
    const r = await http.get<{ data: GroupParticipant[] }>(
      `/sessions/${sessionId}/groups/${encodeURIComponent(groupJid)}/participants`
    );
    return r.data.data;
  },
};