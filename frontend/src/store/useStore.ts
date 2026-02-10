// store/useStore.ts - Global State dengan Zustand
import { create } from 'zustand';
import type { Session, Chat, Message, Stats } from '../types';
import { sessionApi, chatApi, statsApi } from '../services/api';

interface AppState {
  // Session
  sessions: Session[];
  activeSession: Session | null;
  isLoadingSessions: boolean;

  // Chats
  chats: Chat[];
  selectedChat: Chat | null;
  isLoadingChats: boolean;
  chatSearch: string;

  // Messages
  messages: Message[];
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  replyTo: Message | null;

  // UI
  showQRModal: boolean;
  showNewChatModal: boolean;
  sidebarOpen: boolean;
  stats: Stats | null;

  // Actions - Session
  fetchSessions: () => Promise<void>;
  setActiveSession: (session: Session | null) => void;
  updateSession: (session: Partial<Session> & { id: string }) => void;
  setShowQRModal: (show: boolean) => void;

  // Actions - Chat
  fetchChats: (sessionId: string) => Promise<void>;
  selectChat: (chat: Chat | null) => void;
  setChatSearch: (search: string) => void;
  updateChat: (chatJid: string, updates: Partial<Chat>) => void;
  incrementUnread: (chatJid: string) => void;
  resetUnread: (chatJid: string) => void;

  // Actions - Messages
  fetchMessages: (sessionId: string, chatJid: string, loadMore?: boolean) => Promise<void>;
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: string) => void;
  setReplyTo: (message: Message | null) => void;

  // Actions - Stats
  fetchStats: (sessionId: string) => Promise<void>;

  // Actions - UI
  setShowNewChatModal: (show: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
}

const useStore = create<AppState>((set, get) => ({
  // Initial state
  sessions: [],
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

  // ============================================
  // Session Actions
  // ============================================
  fetchSessions: async () => {
    set({ isLoadingSessions: true });
    try {
      const sessions = await sessionApi.getAll();
      set({ sessions, isLoadingSessions: false });

      // Set active session ke yang connected, atau pertama
      const connected = sessions.find(s => s.status === 'connected');
      const first = sessions[0];
      const current = get().activeSession;

      if (!current && (connected || first)) {
        set({ activeSession: connected || first });
      }
    } catch (err) {
      set({ isLoadingSessions: false });
    }
  },

  setActiveSession: (session) => {
    set({ activeSession: session, chats: [], selectedChat: null, messages: [] });
  },

  updateSession: (updates) => {
    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === updates.id ? { ...s, ...updates } : s
      ),
      activeSession: state.activeSession?.id === updates.id
        ? { ...state.activeSession, ...updates }
        : state.activeSession,
    }));
  },

  setShowQRModal: (show) => set({ showQRModal: show }),

  // ============================================
  // Chat Actions
  // ============================================
  fetchChats: async (sessionId: string) => {
    set({ isLoadingChats: true });
    try {
      const search = get().chatSearch;
      const chats = await chatApi.getAll(sessionId, search);
      set({ chats, isLoadingChats: false });
    } catch (err) {
      set({ isLoadingChats: false });
    }
  },

  selectChat: (chat) => {
    set({ selectedChat: chat, messages: [], hasMoreMessages: true, replyTo: null });
  },

  setChatSearch: (search) => set({ chatSearch: search }),

  updateChat: (chatJid, updates) => {
    set(state => ({
      chats: state.chats.map(c =>
        c.jid === chatJid ? { ...c, ...updates } : c
      ).sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        const aTime = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
        const bTime = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
        return bTime - aTime;
      }),
    }));
  },

  incrementUnread: (chatJid) => {
    set(state => ({
      chats: state.chats.map(c =>
        c.jid === chatJid ? { ...c, unread_count: c.unread_count + 1 } : c
      ),
    }));
  },

  resetUnread: (chatJid) => {
    set(state => ({
      chats: state.chats.map(c =>
        c.jid === chatJid ? { ...c, unread_count: 0 } : c
      ),
    }));
  },

  // ============================================
  // Message Actions
  // ============================================
  fetchMessages: async (sessionId, chatJid, loadMore = false) => {
    set({ isLoadingMessages: true });
    try {
      const current = get().messages;
      const before = loadMore && current.length > 0
        ? current[0].timestamp : undefined;

      const newMessages = await chatApi.getMessages(sessionId, chatJid, before);

      set(state => ({
        messages: loadMore ? [...newMessages, ...state.messages] : newMessages,
        isLoadingMessages: false,
        hasMoreMessages: newMessages.length === 30,
      }));
    } catch (err) {
      set({ isLoadingMessages: false });
    }
  },

  addMessage: (message) => {
    set(state => {
      // Cek apakah sudah ada (hindari duplikat)
      const exists = state.messages.some(m => m.message_id === message.message_id);
      if (exists) return state;

      const selectedChat = state.selectedChat;
      const isCurrentChat = selectedChat?.jid === message.chat_jid;

      return {
        messages: isCurrentChat ? [...state.messages, message] : state.messages,
      };
    });
  },

  updateMessageStatus: (messageId, status) => {
    set(state => ({
      messages: state.messages.map(m =>
        m.message_id === messageId ? { ...m, status: status as any } : m
      ),
    }));
  },

  setReplyTo: (message) => set({ replyTo: message }),

  // ============================================
  // Stats Actions
  // ============================================
  fetchStats: async (sessionId) => {
    try {
      const stats = await statsApi.get(sessionId);
      set({ stats });
    } catch {}
  },

  // ============================================
  // UI Actions
  // ============================================
  setShowNewChatModal: (show) => set({ showNewChatModal: show }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));

export default useStore;