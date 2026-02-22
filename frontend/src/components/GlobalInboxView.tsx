import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, RefreshCw, Loader2, MessageSquare, Inbox, Check, CheckCheck, Camera, FileText, Mic, Image as ImageIcon } from 'lucide-react';
import useStore from '../store/useStore';
import Avatar from './Avatar';
import { isGroupJid, formatChatTime, truncate } from '../utils/helpers';
import { getSocket } from '../services/socket';

export const GlobalInboxView: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const { 
    selectChat, 
    setActiveTab, 
    setActiveSession, 
    sessions, 
    resetUnread 
  } = useStore();

  const fetchGlobalMessages = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/all-global-messages`);
      const result = await res.json();
      if (result.success) {
        setMessages(result.data);
      }
    } catch (err) {
      console.error("Fetch Global Inbox Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGlobalMessages();
    const socket = getSocket();

    const handleSocketUpdate = (eventName: string) => {
      if (eventName.startsWith('message:new:') || eventName.startsWith('message:sent:')) {
        fetchGlobalMessages();
      }
    };

    socket.onAny(handleSocketUpdate);
    return () => {
      socket.offAny(handleSocketUpdate);
    };
  }, [fetchGlobalMessages]);

  const handleChatClick = (msg: any) => {
    const targetSession = sessions.find(s => s.id === msg.session_id);
    if (targetSession) {
      setActiveSession(targetSession);
      const chatData = {
        jid: msg.chat_jid,
        name: msg.display_name,
        profile_pic_url: msg.profile_pic_url,
        session_id: msg.session_id,
        unread_count: 0
      };
      selectChat(chatData as any);
      resetUnread(msg.chat_jid);
      setActiveTab("chats");
    }
  };

  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      const search = searchTerm.toLowerCase();
      const name = (m.display_name || "").toLowerCase();
      const content = (m.content || "").toLowerCase();
      return name.includes(search) || content.includes(search);
    });
  }, [messages, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-[#111B21] border-r border-[#222d34]">
      {/* Header */}
      <div className="bg-[#202C33] px-4 h-[60px] flex-none flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00a884]/20 flex items-center justify-center text-[#00a884] ring-1 ring-[#00a884]/30">
            <Inbox size={20} />
          </div>
          <div>
            <h2 className="text-[#E9EDEF] text-[16px] font-semibold leading-tight">Global Inbox</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse" />
              <p className="text-[11px] text-[#8696A0] uppercase tracking-wider font-medium">Real-time</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => { setLoading(true); fetchGlobalMessages(); }}
          className="p-2 text-[#8696A0] hover:bg-[#374248] hover:text-[#00a884] rounded-full transition-all duration-200"
        >
          <RefreshCw size={19} className={loading ? "animate-spin text-[#00a884]" : ""} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 flex-none bg-[#111B21]">
        <div className="relative flex items-center bg-[#202C33] rounded-lg px-3 focus-within:bg-[#2A3942] transition-all border-b-2 border-transparent focus-within:border-[#00a884]">
          <Search className="w-4 h-4 text-[#8696A0]" />
          <input
            type="text"
            placeholder="Cari kontak atau pesan..."
            className="w-full bg-transparent text-[#E9EDEF] py-2 pl-3 text-sm outline-none placeholder:text-[#8696A0]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center pt-32 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#00a884] opacity-80" />
            <p className="text-[#8696A0] text-xs font-medium uppercase tracking-widest">Memuat Pesan...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center pt-32 px-10">
            <MessageSquare className="w-12 h-12 text-[#3b4a54] mx-auto mb-4" />
            <p className="text-[#8696A0] text-sm">Tidak ada pesan ditemukan</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredMessages.map((msg) => (
              <GlobalInboxItem 
                key={`${msg.session_id}-${msg.chat_jid}-${msg.timestamp}`} 
                msg={msg} 
                onClick={() => handleChatClick(msg)} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const GlobalInboxItem: React.FC<{ msg: any, onClick: () => void }> = ({ msg, onClick }) => {
  const isGroup = isGroupJid(msg.chat_jid);
  const unreadCount = parseInt(msg.unread_count) || 0;
  const hasUnread = unreadCount > 0;
  const isMe = Number(msg.is_from_me) === 1;
  const name = msg.display_name || msg.chat_jid.split('@')[0];

  // Helper untuk merender isi preview pesan agar tidak muncul [] kosong
  const renderMessagePreview = () => {
    const type = msg.message_type;
    const content = msg.content || "";
    const caption = msg.caption || "";

    if (type === 'text' || !type) {
      return truncate(content || caption || "Pesan kosong", 60);
    }

    // Penanganan Media agar lebih user-friendly
    const mediaMap: Record<string, { icon: any, label: string }> = {
      image: { icon: <ImageIcon size={14} />, label: "Foto" },
      video: { icon: <Camera size={14} />, label: "Video" },
      audio: { icon: <Mic size={14} />, label: "Pesan suara" },
      document: { icon: <FileText size={14} />, label: "Dokumen" },
      sticker: { icon: null, label: "Stiker 🍦" },
    };

    const media = mediaMap[type] || { icon: null, label: type };

    return (
      <span className="flex items-center gap-1 italic">
        {media.icon}
        <span>{media.label}{caption ? `: ${truncate(caption, 30)}` : ""}</span>
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 cursor-pointer hover:bg-[#202C33] active:bg-[#111B21] transition-all group"
    >
      <div className="py-3 relative flex-shrink-0">
        <Avatar name={name} imageUrl={msg.profile_pic_url} size="md" isGroup={isGroup} />
      </div>

      <div className="flex-1 min-w-0 border-b border-[#222d34]/50 self-stretch flex flex-col justify-center py-3 pr-1 group-last:border-none">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className={`text-[16px] truncate leading-tight ${hasUnread ? "text-[#E9EDEF] font-bold" : "text-[#E9EDEF] font-normal"}`}>
            {name}
          </h3>
          <span className={`text-[11px] flex-shrink-0 ml-2 ${hasUnread ? "text-[#00a884] font-bold" : "text-[#8696A0]"}`}>
            {formatChatTime(msg.timestamp)}
          </span>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center flex-1 min-w-0">
            {isMe && (
              <div className="mr-1.5 flex-shrink-0">
                {msg.status === 'read' ? (
                  <CheckCheck size={15} className="text-[#53bdeb]" />
                ) : (
                  <Check size={15} className="text-[#8696A0]" />
                )}
              </div>
            )}
            
            <div className={`text-[14px] truncate leading-5 ${hasUnread ? "text-[#E9EDEF] font-medium" : "text-[#8696A0] font-light"}`}>
              {renderMessagePreview()}
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[9px] text-[#8696A0] bg-[#202C33] px-1.5 py-0.5 rounded border border-[#222d34] uppercase font-medium">
              {msg.session_name || "Device"}
            </span>

            {hasUnread && (
              <div className="min-w-[20px] h-[20px] bg-[#00a884] rounded-full flex items-center justify-center px-1">
                <span className="text-[#111B21] text-[11px] font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalInboxView;