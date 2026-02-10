// components/ChatList.tsx - Daftar Chat Sidebar
import React, { useEffect, useRef } from 'react';
import {
  Search, Plus, MoreVertical, Archive, BellOff,
  Users, MessageSquare, LogOut, Loader2
} from 'lucide-react';
import useStore from '../store/useStore';
import Avatar from './Avatar';
import {
  getDisplayName, formatChatTime, formatMessagePreview,
  truncate, isGroupJid
} from '../utils/helpers';
import type { Chat } from '../types';
import { sessionApi } from '../services/api';
import toast from 'react-hot-toast';

interface ChatListProps {
  sessionId: string;
}

export const ChatList: React.FC<ChatListProps> = ({ sessionId }) => {
  const {
    chats,
    selectedChat,
    chatSearch,
    isLoadingChats,
    activeSession,
    setChatSearch,
    fetchChats,
    selectChat,
    setShowQRModal,
    setShowNewChatModal,
  } = useStore();

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sessionId) fetchChats(sessionId);
  }, [sessionId, chatSearch]);

  const handleChatClick = (chat: Chat) => {
    selectChat(chat);
  };

  const handleLogout = async () => {
    if (!confirm('Yakin ingin logout dari WhatsApp?')) return;
    try {
      await sessionApi.logout(sessionId);
      toast.success('Berhasil logout');
      window.location.reload();
    } catch {
      toast.error('Gagal logout');
    }
  };

  const filteredChats = chatSearch
    ? chats.filter(c => {
        const name = getDisplayName(c).toLowerCase();
        const search = chatSearch.toLowerCase();
        return name.includes(search) || c.jid.includes(search);
      })
    : chats;

  return (
    <div className="flex flex-col h-full bg-[#111B21]">
      {/* Header */}
      <div className="bg-[#202C33] px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          {/* Profile & Status */}
          <div className="flex items-center gap-3">
            <Avatar
              name={activeSession?.phone_number || 'W'}
              size="md"
              className="cursor-pointer hover:opacity-80 transition-opacity"
            />
            <div>
              <p className="text-[#E9EDEF] text-sm font-semibold">
                {activeSession?.phone_number
                  ? `+${activeSession.phone_number}`
                  : activeSession?.name || 'WhatsApp'}
              </p>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  activeSession?.status === 'connected' ? 'bg-[#25D366]' :
                  activeSession?.status === 'connecting' ? 'bg-yellow-400' :
                  'bg-gray-500'
                }`} />
                <span className="text-[#8696A0] text-xs capitalize">
                  {activeSession?.status === 'connected' ? 'Online' :
                   activeSession?.status === 'connecting' ? 'Menghubungkan...' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {activeSession?.status !== 'connected' && (
              <button
                onClick={() => setShowQRModal(true)}
                className="p-2 text-[#8696A0] hover:text-[#25D366] hover:bg-[#2A3942] rounded-full transition-all"
                title="Scan QR untuk terhubung"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 4h4m-4-8h4M4 8h4m-4 4h.01M20 4h.01M4 4h.01" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 text-[#8696A0] hover:text-white hover:bg-[#2A3942] rounded-full transition-all"
              title="Chat baru"
            >
              <Plus className="w-5 h-5" />
            </button>
            <div className="relative group">
              <button className="p-2 text-[#8696A0] hover:text-white hover:bg-[#2A3942] rounded-full transition-all">
                <MoreVertical className="w-5 h-5" />
              </button>
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-1 w-44 bg-[#233138] rounded-lg shadow-xl hidden group-focus-within:block z-10 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[#E9EDEF] hover:bg-[#2A3942] text-sm transition-colors"
                >
                  <LogOut className="w-4 h-4 text-[#8696A0]" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8696A0]" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Cari atau mulai chat baru"
            value={chatSearch}
            onChange={e => setChatSearch(e.target.value)}
            className="w-full bg-[#2A3942] text-[#E9EDEF] placeholder-[#8696A0] rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-[#25D366] transition-all"
          />
          {chatSearch && (
            <button
              onClick={() => setChatSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8696A0] hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoadingChats && chats.length === 0 ? (
          <div className="flex items-center justify-center h-32 gap-3">
            <Loader2 className="w-5 h-5 text-[#25D366] animate-spin" />
            <span className="text-[#8696A0] text-sm">Memuat chat...</span>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 px-6">
            <MessageSquare className="w-12 h-12 text-[#2A3942]" />
            <p className="text-[#8696A0] text-sm text-center">
              {chatSearch ? 'Chat tidak ditemukan' : 'Belum ada chat. Mulai percakapan baru!'}
            </p>
          </div>
        ) : (
          <div>
            {filteredChats.map((chat) => (
              <ChatListItem
                key={chat.jid}
                chat={chat}
                isSelected={selectedChat?.jid === chat.jid}
                onClick={() => handleChatClick(chat)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Chat List Item Component
// ============================================================
interface ChatListItemProps {
  chat: Chat;
  isSelected: boolean;
  onClick: () => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ chat, isSelected, onClick }) => {
  const displayName = getDisplayName(chat);
  const isGroup = isGroupJid(chat.jid);
  const lastMsg = chat.last_message
    ? truncate(formatMessagePreview('text', chat.last_message), 45)
    : '';

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-[#1E2A30]
        ${isSelected ? 'bg-[#2A3942]' : 'hover:bg-[#1E2A30]'}
      `}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar
          name={displayName}
          imageUrl={chat.profile_pic_url}
          size="md"
          isGroup={isGroup}
        />
        {chat.muted === 1 && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#111B21] rounded-full flex items-center justify-center">
            <BellOff className="w-2.5 h-2.5 text-[#8696A0]" />
          </div>
        )}
      </div>

      {/* Chat Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            {isGroup && <Users className="w-3 h-3 text-[#8696A0] flex-shrink-0" />}
            <span className="text-[#E9EDEF] text-sm font-medium truncate">
              {displayName}
            </span>
          </div>
          <span className={`text-[10px] flex-shrink-0 ml-2 ${
            chat.unread_count > 0 ? 'text-[#25D366]' : 'text-[#8696A0]'
          }`}>
            {formatChatTime(chat.last_message_time)}
          </span>
        </div>

        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[#8696A0] text-xs truncate flex-1">
            {lastMsg || <span className="italic">Mulai percakapan</span>}
          </p>

          <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
            {chat.pinned === 1 && (
              <svg className="w-2.5 h-2.5 text-[#8696A0]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
              </svg>
            )}
            {chat.unread_count > 0 && (
              <span className={`
                text-[10px] font-bold text-white rounded-full flex items-center justify-center min-w-[18px] h-[18px] px-1
                ${chat.muted === 1 ? 'bg-[#8696A0]' : 'bg-[#25D366]'}
              `}>
                {chat.unread_count > 99 ? '99+' : chat.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatList;