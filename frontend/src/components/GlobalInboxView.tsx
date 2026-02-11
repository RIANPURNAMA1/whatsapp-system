import React, { useEffect, useState, useMemo } from 'react';
import { Search, RefreshCw, Loader2, MessageSquare, Inbox, Check, CheckCheck } from 'lucide-react';
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

  const fetchGlobalMessages = async () => {
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
  };

  // Real-time listener menggunakan Socket.io
  useEffect(() => {
    fetchGlobalMessages();
    const socket = getSocket();

    // Dengarkan setiap ada pesan baru masuk dari sesi manapun
    socket.onAny((eventName) => {
      if (eventName.startsWith('message:new:')) {
        fetchGlobalMessages();
      }
    });

    return () => {
      socket.offAny();
    };
  }, []);

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
      <div className="bg-[#202C33] px-4 py-[10px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00a884]/10 flex items-center justify-center text-[#00a884]">
            <Inbox size={22} />
          </div>
          <div>
            <h2 className="text-[#E9EDEF] text-base font-medium">Inbox Global</h2>
            <p className="text-[11px] text-[#8696A0]">Semua pesan terpusat</p>
          </div>
        </div>
        <button 
          onClick={() => { setLoading(true); fetchGlobalMessages(); }}
          className="p-2 text-[#8696A0] hover:bg-[#374248] rounded-full transition-all"
        >
          <RefreshCw size={18} className={loading ? "animate-spin text-[#00a884]" : ""} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-2">
        <div className="relative flex items-center bg-[#202C33] rounded-lg px-3 focus-within:bg-[#2A3942] transition-all">
          <Search className="w-4 h-4 text-[#8696A0]" />
          <input
            type="text"
            placeholder="Cari pengirim atau pesan..."
            className="w-full bg-transparent text-[#E9EDEF] py-2 pl-3 text-sm outline-none placeholder:text-[#8696A0]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center pt-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#00a884]" />
            <p className="text-[#8696A0] text-xs uppercase tracking-widest">Sinkronisasi...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center pt-20 px-10">
            <div className="w-16 h-16 bg-[#202C33] rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-[#3b4a54]" />
            </div>
            <p className="text-[#8696A0] text-sm">Tidak ada pesan ditemukan</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredMessages.map((msg) => (
              <GlobalInboxItem 
                key={`${msg.session_id}-${msg.id}`} 
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

/**
 * Sub-Component: GlobalInboxItem
 * Style: WhatsApp Dark Mode with Unread Badge
 */
const GlobalInboxItem: React.FC<{ msg: any, onClick: () => void }> = ({ msg, onClick }) => {
  const isGroup = isGroupJid(msg.chat_jid);
  const unreadCount = parseInt(msg.unread_count) || 0;
  const hasUnread = unreadCount > 0;

  // Nama pengirim
  const name = msg.display_name || msg.chat_jid.split('@')[0];

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 cursor-pointer hover:bg-[#202C33] active:bg-[#2A3942] transition-colors group"
    >
      <div className="py-3 relative flex-shrink-0">
        <Avatar 
          name={name} 
          imageUrl={msg.profile_pic_url} 
          size="md" 
          isGroup={isGroup} 
        />
      </div>

      <div className="flex-1 min-w-0 border-b border-[#222d34] self-stretch flex flex-col justify-center py-3 pr-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className={`text-[15px] truncate ${hasUnread ? "text-[#E9EDEF] font-bold" : "text-[#E9EDEF] font-normal"}`}>
            {name}
          </h3>
          <span className={`text-[11px] flex-shrink-0 ${hasUnread ? "text-[#00a884] font-bold" : "text-[#8696A0]"}`}>
            {formatChatTime(msg.timestamp)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            {/* Indikator "Anda:" jika pesan terakhir dari kita (is_from_me) */}
            {msg.is_from_me === 1 && (
              <span className="mr-1 text-[#8696A0]">
                 {msg.status === 'read' ? <CheckCheck size={16} className="text-[#53bdeb]" /> : <Check size={16} />}
              </span>
            )}
            
            <p className={`text-sm truncate ${hasUnread ? "text-[#E9EDEF] font-normal" : "text-[#8696A0] font-light"}`}>
              {msg.message_type !== 'text' ? (
                <span className="flex items-center gap-1 italic text-xs">
                  [{msg.message_type}] {msg.caption || ""}
                </span>
              ) : (
                truncate(msg.content || "", 40)
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2 ml-2">
            {/* Nama Device/Sesi */}
            <span className="text-[10px] text-[#00a884] bg-[#00a884]/10 px-1.5 py-0.5 rounded border border-[#00a884]/20 font-semibold uppercase">
              {msg.session_name || "Device"}
            </span>

            {/* Bulatan Unread ala WhatsApp */}
            {hasUnread && (
              <div className="min-w-[19px] h-[19px] bg-[#00a884] rounded-full flex items-center justify-center px-1">
                <span className="text-[#111B21] text-[10px] font-bold">
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