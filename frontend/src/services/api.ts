// services/api.ts - HTTP API Service
import axios from 'axios';
import type { Session, Chat, Message, Contact, Stats } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor untuk error handling global
// ⭐ TAMBAHKAN INI: Interceptor untuk menyisipkan Token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Ambil token yang disimpan saat login
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor untuk error handling global (kode lama Anda)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ⭐ TIPS: Jika error 401, otomatis arahkan ke login
    if (error.response?.status === 401) {
       console.error("Sesi habis, silakan login ulang");
       // window.location.href = '/login'; // Opsional: redirect otomatis
    }
    const message = error.response?.data?.message || error.message || 'Terjadi kesalahan';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);




// ===============================================
// SESSION API
// ===============================================
export const sessionApi = {
  getAll: () => api.get<{ data: Session[] }>('/sessions').then(r => r.data.data),
  getOne: (id: string) => api.get<{ data: Session }>(`/sessions/${id}`).then(r => r.data.data),
  delete: async (sessionId: string) => {
    const response = await api.delete(`/sessions/${sessionId}`);
    return response.data;
  },
  create: (sessionId: string, name: string) =>
    api.post('/sessions', { sessionId, name }).then(r => r.data),
  logout: (id: string) => api.delete(`/sessions/${id}`).then(r => r.data),
  getQR: (id: string) =>
    api.get<{ data: { qr: string | null; status: string } }>(`/sessions/${id}/qr`).then(r => r.data.data),
  rename: (id: string, name: string) =>
    api.put(`/sessions/${id}/name`, { name }).then(r => r.data),
};

// ===============================================
// CHAT API
// ===============================================
export const chatApi = {
  getAll: (sessionId: string, search = '', page = 1) =>
    api.get<{ data: Chat[] }>(`/sessions/${sessionId}/chats`, {
      params: { search, page, limit: 50 }
    }).then(r => r.data.data),

  getMessages: (sessionId: string, chatJid: string, before?: string) =>
    api.get<{ data: Message[] }>(
      `/sessions/${sessionId}/chats/${encodeURIComponent(chatJid)}/messages`,
      { params: { before, limit: 30 } }
    ).then(r => r.data.data),

  markRead: (sessionId: string, chatJid: string) =>
    api.put(`/sessions/${sessionId}/chats/${encodeURIComponent(chatJid)}/read`).then(r => r.data),
  // services/api.ts — tambahkan di dalam chatApi = { ... }

  getAllWithLabels: async (sessionId: string, search = '', page = 1) => {
    try {
      const res = await api.get<{ success: boolean; data: Chat[] }>(
        `/sessions/${sessionId}/chats`,
        {
          params: { search, page, limit: 50, with_labels: true }  // flag opsional
        }
      );
      return res.data.data;
    } catch (err) {
      console.error("Gagal fetch chats with labels:", err);
      throw err;
    }
  },
};

// ===============================================
// MESSAGE API
// ===============================================
// ===============================================
// MESSAGE API
// ===============================================
export const messageApi = {
  sendText: (sessionId: string, to: string, text: string, quotedMsgId?: string) =>
    api.post(`/sessions/${sessionId}/messages/text`, { to, text, quotedMsgId }).then(r => r.data),

  // ⭐ PERBAIKAN DI SINI:
  // Tambahkan parameter 'type' agar sinkron dengan ChatWindow (total 5 param)
  sendMedia: (sessionId: string, to: string, file: File, type: string, caption = '') => {
    const formData = new FormData();
    formData.append('to', to);
    formData.append('type', type); // Menambahkan tipe (image/document)
    formData.append('caption', caption); // Ini akan berisi file.name jika dikirim dari frontend
    formData.append('file', file);
    
    return api.post(`/sessions/${sessionId}/messages/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  delete: (sessionId: string, messageId: string, chatJid: string, forEveryone = false) =>
    api.delete(`/sessions/${sessionId}/messages/${messageId}`, {
      data: { chatJid, forEveryone }
    }).then(r => r.data),
};

// ===============================================
// CONTACT API
// ===============================================
export const contactApi = {
  getAll: (sessionId: string, search = '') =>
    api.get<{ data: Contact[] }>(`/sessions/${sessionId}/contacts`, {
      params: { search }
    }).then(r => r.data.data),
};

// ===============================================
// STATS API
// ===============================================
export const statsApi = {
  get: (sessionId: string) =>
    api.get<{ data: Stats }>(`/sessions/${sessionId}/stats`).then(r => r.data.data),
};

export default api;