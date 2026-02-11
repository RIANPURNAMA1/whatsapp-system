import React, { useEffect } from 'react';
import {
  Search, Plus, MoreVertical, BellOff,
  Users, MessageSquare, LogOut, Loader2, QrCode
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
    chats, selectedChat, chatSearch, isLoadingChats, activeSession,
    setChatSearch, fetchChats, selectChat, setShowQRModal, setShowNewChatModal,
  } = useStore();

  // Load chats saat sessionId berubah atau saat pencarian dilakukan
  useEffect(() => {
    if (sessionId) fetchChats(sessionId);
  }, [sessionId, fetchChats]);

  const handleLogout = async () => {
    if (!confirm('Logout dari WhatsApp?')) return;
    try {
      await sessionApi.logout(sessionId);
      toast.success('Berhasil logout');
      window.location.reload();
    } catch {
      toast.error('Gagal logout');
    }
  };

  /**
   * LOGIKA PENGURUTAN (SORTING):
   * 1. Filter berdasarkan teks pencarian (jika ada).
   * 2. Urutkan: Pinned Chat (paling atas) -> Pesan Terbaru (Descending).
   */
  const processedChats = React.useMemo(() => {
    // Filter
    const filtered = chats.filter(c => {
      if (!chatSearch) return true;
      const name = getDisplayName(c).toLowerCase();
      const search = chatSearch.toLowerCase();
      return name.includes(search) || c.jid.includes(search);
    });

    // Sort
    return [...filtered].sort((a, b) => {
      // Prioritaskan yang di-pin
      if (a.pinned !== b.pinned) {
        return (b.pinned || 0) - (a.pinned || 0);
      }
      
      // Bandingkan waktu pesan terakhir
      const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
      const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
      
      return timeB - timeA; // Terbaru di atas
    });
  }, [chats, chatSearch]);

  return (
    <div className="flex flex-col h-full bg-[#111B21] border-r border-[#222d34]">
      {/* Header Profil Sesi */}
      <div className="bg-[#202C33] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            name={activeSession?.phone_number || 'W'}
            size="sm"
            className="ring-1 ring-[#3b4a54]"
          />
          <div className="flex flex-col">
            <span className="text-[#E9EDEF] text-xs font-medium truncate max-w-[120px]">
              {activeSession?.phone_number ? `+${activeSession.phone_number}` : 'WhatsApp'}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#8696A0]">
              <span className={`w-1.5 h-1.5 rounded-full ${activeSession?.status === 'connected' ? 'bg-[#25D366]' : 'bg-orange-400'}`} />
              {activeSession?.status === 'connected' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {activeSession?.status !== 'connected' && (
            <button onClick={() => setShowQRModal(true)} className="p-2 text-orange-400 hover:bg-[#374248] rounded-full transition-colors" title="Hubungkan">
              <QrCode className="w-5 h-5" />
            </button>
          )}
          <button onClick={() => setShowNewChatModal(true)} className="p-2 text-[#8696A0] hover:bg-[#374248] rounded-full transition-colors" title="Chat Baru">
            <Plus className="w-5 h-5" />
          </button>
          <div className="relative group">
            <button className="p-2 text-[#8696A0] hover:bg-[#374248] rounded-full transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-44 bg-[#233138] rounded-lg shadow-2xl hidden group-focus-within:block z-50 py-1 border border-[#3b4a54]">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-[#182229] text-sm transition-colors">
                <LogOut className="w-4 h-4" /> Keluar Sesi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Pencarian */}
      <div className="px-3 py-2">
        <div className="relative flex items-center bg-[#202C33] rounded-lg px-3 group focus-within:bg-[#111B21] focus-within:ring-1 focus-within:ring-[#00a884] transition-all">
          <Search className="w-4 h-4 text-[#8696A0] group-focus-within:text-[#00a884]" />
          <input
            type="text"
            placeholder="Cari chat..."
            value={chatSearch}
            onChange={e => setChatSearch(e.target.value)}
            className="w-full bg-transparent text-[#E9EDEF] py-2 pl-3 text-sm outline-none placeholder:text-[#8696A0]"
          />
        </div>
      </div>

      {/* Daftar Chat Terurut */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoadingChats && chats.length === 0 ? (
          <div className="flex flex-col items-center pt-20 gap-3 opacity-60">
            <Loader2 className="w-6 h-6 animate-spin text-[#00a884]" />
            <span className="text-[10px] text-[#8696A0] uppercase tracking-widest font-bold">Sinkronisasi Chat...</span>
          </div>
        ) : processedChats.length === 0 ? (
          <div className="text-center pt-20 px-10">
            <div className="w-16 h-16 bg-[#202C33] rounded-full flex items-center justify-center mx-auto mb-4">
               <MessageSquare className="w-8 h-8 text-[#3b4a54]" />
            </div>
            <p className="text-[#8696A0] text-sm font-light">
              {chatSearch ? 'Chat tidak ditemukan.' : 'Belum ada percakapan.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1E2A30]/30">
            {processedChats.map((chat) => (
              <ChatListItem
                key={chat.jid}
                chat={chat}
                isSelected={selectedChat?.jid === chat.jid}
                onClick={() => selectChat(chat)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Komponen Item Chat Individual
 */
const ChatListItem: React.FC<{ chat: Chat; isSelected: boolean; onClick: () => void }> = ({ chat, isSelected, onClick }) => {
  const displayName = getDisplayName(chat);
  const isGroup = isGroupJid(chat.jid);
  
  // Pratinjau pesan terakhir
  const preview = chat.last_message 
    ? truncate(formatMessagePreview(chat.last_message_type || 'text', chat.last_message), 40) 
    : 'Mulai kirim pesan...';

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150 relative ${
        isSelected ? 'bg-[#2A3942]' : 'hover:bg-[#1E2A30]'
      }`}
    >
      {/* Indikator terpilih (Garis hijau di samping) */}
      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00a884]" />}

      <div className="relative flex-shrink-0">
        <Avatar name={displayName} imageUrl={chat.profile_pic_url} size="md" isGroup={isGroup} />
        {chat.unread_count > 0 && (
          <div className="absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#00a884] rounded-full flex items-center justify-center border-2 border-[#111B21] px-1">
             <span className="text-[10px] text-[#111B21] font-bold">{chat.unread_count}</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="text-[#E9EDEF] text-[15px] font-normal truncate flex items-center gap-1.5 leading-tight">
            {isGroup && <Users className="w-3.5 h-3.5 text-[#8696A0]" />}
            {displayName}
          </h3>
          <span className={`text-[11px] flex-shrink-0 ${chat.unread_count > 0 ? 'text-[#00a884] font-semibold' : 'text-[#8696A0]'}`}>
            {formatChatTime(chat.last_message_time)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <p className={`text-xs truncate leading-4 flex-1 ${chat.unread_count > 0 ? 'text-[#E9EDEF] font-medium' : 'text-[#8696A0] font-light'}`}>
            {preview}
          </p>
          
          {chat.pinned === 1 && (
            <svg className="w-3.5 h-3.5 text-[#8696A0] rotate-45 ml-1 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatList;