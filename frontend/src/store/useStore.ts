import { create } from 'zustand';
import type { Session, Chat, Message, Stats, PresenceData } from '../types';
import { sessionApi, chatApi, statsApi } from '../services/api';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  role_type: string;
}

interface AppState {
  sessions: Session[];
  user: User | null;
  activeSession: Session | null;
  isLoadingSessions: boolean;
  chats: Chat[];
  selectedChat: Chat | null;
  isLoadingChats: boolean;
  chatSearch: string;
  messages: Message[];
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  replyTo: Message | null;
  showQRModal: boolean;
  showNewChatModal: boolean;
  sidebarOpen: boolean;
  stats: Stats | null;
  groups: Chat[];
  activeTab: string;
  presences: Record<string, PresenceData>;
  
  // --- STATE TEMA ---
  isDarkMode: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setActiveTab: (tab: string) => void;
  deleteSession: (sessionId: string) => Promise<void>;
  removeSession: (sessionId: string) => void;
  fetchSessions: () => Promise<void>;
  setActiveSession: (session: Session | null) => void;
  updateSession: (session: Partial<Session> & { id: string }) => void;
  setShowQRModal: (show: boolean) => void;
  fetchChats: (sessionId: string) => Promise<void>;
  selectChat: (chat: Chat | null) => void;
  setChatSearch: (search: string) => void;
  updateChat: (chatJid: string, updates: Partial<Chat>) => void;
  incrementUnread: (chatJid: string) => void;
  resetUnread: (chatJid: string) => void;
  fetchMessages: (sessionId: string, chatJid: string, loadMore?: boolean) => Promise<void>;
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: string) => void;
  setReplyTo: (message: Message | null) => void;
  fetchStats: (sessionId: string) => Promise<void>;
  setShowNewChatModal: (show: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  fetchGroups: (sessionId: string) => Promise<void>;
  setPresence: (data: PresenceData) => void;
  
  // --- ACTION TEMA ---
  toggleDarkMode: () => void;
}

const useStore = create<AppState>((set, get) => ({
  sessions: [],
  user: null,
  activeSession: null,
  isLoadingSessions: false,
  chats: [],
  selectedChat: null,
  isLoadingChats: false,
  chatSearch: '',
  messages: [],
  isLoadingMessages: false,
  hasMoreMessages: true,
  replyTo: null,
  showQRModal: false,
  showNewChatModal: false,
  sidebarOpen: true,
  stats: null,
  groups: [],
  activeTab: 'dashboard',
  presences: {},

  // Initial Value Tema dari LocalStorage
  isDarkMode: localStorage.getItem("theme") ? localStorage.getItem("theme") === "dark" : true,

  // Implementasi Actions
  setUser: (user) => set({ user }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleDarkMode: () => set((state) => {
    const newMode = !state.isDarkMode;
    localStorage.setItem("theme", newMode ? "dark" : "light");
    return { isDarkMode: newMode };
  }),

  fetchGroups: async (sessionId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/sessions/${sessionId}/groups`); 
      if (res.data.success) {
        set({ groups: res.data.data });
      }
    } catch (err) {
      console.error("Gagal ambil grup:", err);
    }
  },

  deleteSession: async (sessionId: string) => {
    try {
      await sessionApi.delete(sessionId); 
      get().removeSession(sessionId);
    } catch (error) {
      console.error("Gagal menghapus sesi:", error);
      throw error;
    }
  },

  removeSession: (sessionId: string) => {
    set(state => ({
      sessions: state.sessions.filter(s => s.id !== sessionId),
      activeSession: state.activeSession?.id === sessionId ? null : state.activeSession,
    }));
  },

  fetchSessions: async () => {
    set({ isLoadingSessions: true });
    try {
      const sessions = await sessionApi.getAll();
      set({ sessions, isLoadingSessions: false });
      if (!get().activeSession && sessions.length > 0) {
        const connected = sessions.find(s => s.status === 'connected');
        set({ activeSession: connected || sessions[0] });
      }
    } catch { set({ isLoadingSessions: false }); }
  },

  setActiveSession: (session) => set({ activeSession: session, chats: [], selectedChat: null, messages: [] }),

  updateSession: (updates) => set(state => ({
    sessions: state.sessions.map(s => s.id === updates.id ? { ...s, ...updates } : s),
    activeSession: state.activeSession?.id === updates.id ? { ...state.activeSession, ...updates } : state.activeSession,
  })),

  setShowQRModal: (show) => set({ showQRModal: show }),

  fetchChats: async (sessionId: string) => {
    set({ isLoadingChats: true });
    try {
      const chats = await chatApi.getAllWithLabels(sessionId, get().chatSearch || '', 1);
      const sortedChats = [...chats].sort((a, b) => {
        const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
        const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
        return timeB - timeA;
      });
      set({ chats: sortedChats, isLoadingChats: false });
    } catch (err) {
      console.error("Fetch chats failed:", err);
      set({ isLoadingChats: false });
    }
  },

  selectChat: (chat) => set({ selectedChat: chat, messages: [], hasMoreMessages: true, replyTo: null }),
  setChatSearch: (search) => set({ chatSearch: search }),

  updateChat: (chatJid, updates) => set(state => {
    const updatedChats = state.chats.map(c => c.jid === chatJid ? { ...c, ...updates } : c);
    updatedChats.sort((a, b) => {
      const timeA = new Date(a.last_message_time || 0).getTime();
      const timeB = new Date(b.last_message_time || 0).getTime();
      return timeB - timeA;
    });
    return { chats: updatedChats };
  }),

  incrementUnread: (chatJid) => set(state => ({
    chats: state.chats.map(c => c.jid === chatJid ? { ...c, unread_count: (c.unread_count || 0) + 1 } : c)
  })),

  resetUnread: (chatJid) => set(state => ({
    chats: state.chats.map(c => c.jid === chatJid ? { ...c, unread_count: 0 } : c)
  })),

  fetchMessages: async (sessionId, chatJid, loadMore = false) => {
    set({ isLoadingMessages: true });
    try {
      const current = get().messages;
      const before = loadMore && current.length > 0 ? current[0].timestamp : undefined;
      const newMsgs = await chatApi.getMessages(sessionId, chatJid, before);
      set(state => ({
        messages: loadMore ? [...newMsgs, ...state.messages] : newMsgs,
        isLoadingMessages: false,
        hasMoreMessages: newMsgs.length === 30,
      }));
    } catch { set({ isLoadingMessages: false }); }
  },

  addMessage: (message) => set(state => {
    if (!message || !message.message_id) return state;
    
    const isDuplicate = state.messages.some(m => m.message_id === message.message_id);
    if (isDuplicate) return state;
    
    const currentJid = state.selectedChat?.jid?.toLowerCase()?.trim() || '';
    const messageJid = message.chat_jid?.toLowerCase()?.trim() || '';
    
    // Add message if JIDs match or if selectedChat is null (fallback for AI replies)
    if (!currentJid || !messageJid || currentJid === messageJid) {
      return { messages: [...state.messages, message] };
    }
    return state;
  }),

  updateMessageStatus: (id, status) => set(state => ({
    messages: state.messages.map(m => m.message_id === id ? { ...m, status: status as any } : m)
  })),

  setReplyTo: (msg) => set({ replyTo: msg }),
  fetchStats: async (sid) => { try { const s = await statsApi.get(sid); set({ stats: s }); } catch { } },
  setShowNewChatModal: (show) => set({ showNewChatModal: show }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setPresence: (data) => set(state => ({
    presences: {
      ...state.presences,
      [data.jid]: {
        ...data,
        timestamp: Date.now(),
      },
    },
  })),
}));

export default useStore;