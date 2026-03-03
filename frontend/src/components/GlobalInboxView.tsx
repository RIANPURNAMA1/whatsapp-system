import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Loader2,
  MessageSquare,
  Inbox,
  Check,
  CheckCheck,
  Camera,
  FileText,
  Mic,
  Image as ImageIcon,
  Smartphone,
  ChevronDown,
} from "lucide-react";
import useStore from "../store/useStore";
import Avatar from "./Avatar";
import { isGroupJid, formatChatTime, truncate } from "../utils/helpers";
import { getSocket } from "../services/socket";

export const GlobalInboxView: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("all");

  const {
    selectChat,
    setActiveTab,
    setActiveSession,
    sessions,
    resetUnread,
    user,
  } = useStore();

  /**
   * Cek Role User secara Memoized
   */
  const isAdminOrManager = useMemo(() => {
    const role = user?.role_type?.toLowerCase().trim();
    return role === "manager" || role === "system";
  }, [user]);

  /**
   * Fetch data dibungkus useCallback agar referensi fungsi stabil
   * dan tidak menyebabkan infinite loop atau warning di useEffect
   */
  const fetchGlobalMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/all-global-messages`,
      );
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

  /**
   * Side Effect untuk Fetch Data & Socket Listener
   * Masalah "Merah" (Dependency Warning) diperbaiki di sini
   */
  useEffect(() => {
    fetchGlobalMessages();

    const socket = getSocket();
    const handleSocketUpdate = (eventName: string) => {
      if (
        eventName.startsWith("message:new:") ||
        eventName.startsWith("message:sent:")
      ) {
        fetchGlobalMessages();
      }
    };

    socket.onAny(handleSocketUpdate);
    return () => {
      socket.offAny(handleSocketUpdate);
    };
  }, [fetchGlobalMessages]); // Dependensi hanya fungsi yang stabil

  /**
   * Handle Klik Chat
   */
  const handleChatClick = useCallback(
    (msg: any) => {
      const targetSession = sessions.find((s) => s.id === msg.session_id);
      if (targetSession) {
        setActiveSession(targetSession);
        const chatData = {
          jid: msg.chat_jid,
          name: msg.display_name,
          profile_pic_url: msg.profile_pic_url,
          session_id: msg.session_id,
          unread_count: 0,
        };
        selectChat(chatData as any);
        resetUnread(msg.chat_jid);
        setActiveTab("chats");
      }
    },
    [sessions, setActiveSession, selectChat, resetUnread, setActiveTab],
  );

  /**
   * Filter Pesan secara Memoized
   */
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      const matchesSearch =
        (m.display_name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (m.content || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDevice =
        isAdminOrManager || selectedSessionId === "all"
          ? true
          : m.session_id === selectedSessionId;

      return matchesSearch && matchesDevice;
    });
  }, [messages, searchTerm, selectedSessionId, isAdminOrManager]);

  return (
    <div className="flex flex-col h-full bg-[#111B21] border-r border-[#222d34]">
      {/* Header */}
      <div className="bg-[#202C33] px-4 h-[60px] flex-none flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00a884]/20 flex items-center justify-center text-[#00a884] ring-1 ring-[#00a884]/30">
            <Inbox size={20} />
          </div>
          <div>
            <h2 className="text-[#E9EDEF] text-[16px] font-semibold leading-tight">
              Global Inbox
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse" />
              <p className="text-[11px] text-[#8696A0] uppercase tracking-wider font-medium">
                {isAdminOrManager ? "Full Access" : "Real-time"}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchGlobalMessages}
          className="p-2 text-[#8696A0] hover:bg-[#374248] hover:text-[#00a884] rounded-full transition-all duration-200"
        >
          <RefreshCw
            size={19}
            className={loading ? "animate-spin text-[#00a884]" : ""}
          />
        </button>
      </div>

      {/* Filter Section */}
      <div className="px-3 py-3 flex-none bg-[#111B21] space-y-3 border-b border-[#222d34]/50 shadow-inner">
        {/* Search Input */}
        <div className="relative flex items-center bg-[#202C33] rounded-lg px-3 transition-all border-b-2 border-transparent focus-within:border-[#00a884] focus-within:bg-[#2A3942]">
          <Search className="w-4 h-4 text-[#8696A0]" />
          <input
            type="text"
            placeholder="Cari kontak atau pesan..."
            className="w-full bg-transparent text-[#E9EDEF] py-2 pl-3 text-sm outline-none placeholder:text-[#8696A0]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Device Selector */}
        {!isAdminOrManager && (
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0] pointer-events-none group-focus-within:text-[#00a884]">
              <Smartphone size={14} />
            </div>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full bg-[#202C33] text-[#E9EDEF] text-[13px] pl-9 pr-8 py-2 rounded-lg outline-none appearance-none cursor-pointer border border-[#313D45] hover:border-[#3b4a54] transition-colors focus:ring-1 focus:ring-[#00a884]"
            >
              <option value="all">Semua Perangkat</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.id}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8696A0] pointer-events-none">
              <ChevronDown size={14} />
            </div>
          </div>
        )}
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#374248]">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center pt-32 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#00a884] opacity-80" />
            <p className="text-[#8696A0] text-xs font-medium uppercase tracking-widest">
              Memuat Pesan...
            </p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center pt-32 px-10">
            <MessageSquare className="w-12 h-12 text-[#3b4a54] mx-auto mb-4" />
            <p className="text-[#8696A0] text-sm italic">
              {searchTerm || selectedSessionId !== "all"
                ? "Pencarian tidak ditemukan"
                : "Kotak masuk kosong"}
            </p>
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

// --- ITEM COMPONENT ---
const GlobalInboxItem: React.FC<{ msg: any; onClick: () => void }> = ({
  msg,
  onClick,
}) => {
  const isGroup = isGroupJid(msg.chat_jid);
  const unreadCount = parseInt(msg.unread_count) || 0;
  const hasUnread = unreadCount > 0;
  const isMe = Number(msg.is_from_me) === 1;
  const name = msg.display_name || msg.chat_jid.split("@")[0];

  const renderMessagePreview = () => {
    const type = (msg.message_type || "").toLowerCase();
    const content = msg.content || "";
    const caption = msg.caption || "";
    const textTypes = [
      "text",
      "conversation",
      "extendedtext",
      "extendedtextmessage",
    ];

    if (textTypes.includes(type)) {
      return truncate(content || caption || "Pesan kosong", 60);
    }

    const mediaMap: Record<string, { icon: any; label: string }> = {
      image: { icon: <ImageIcon size={14} />, label: "Foto" },
      video: { icon: <Camera size={14} />, label: "Video" },
      audio: { icon: <Mic size={14} />, label: "Pesan suara" },
      document: { icon: <FileText size={14} />, label: "Dokumen" },
      sticker: { icon: null, label: "Stiker" },
    };

    const detectedType = Object.keys(mediaMap).find((key) =>
      type.includes(key),
    );
    if (detectedType) {
      const media = mediaMap[detectedType];
      return (
        <span className="flex items-center gap-1 italic">
          {media.icon}
          <span>
            {media.label}
            {caption ? `: ${truncate(caption, 30)}` : ""}
          </span>
        </span>
      );
    }
    return content ? truncate(content, 60) : "Pesan kosong";
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 cursor-pointer hover:bg-[#202C33] active:bg-[#111B21] transition-all group border-b border-[#222d34]/30"
    >
      <div className="py-3 relative flex-shrink-0">
        <Avatar
          name={name}
          imageUrl={msg.profile_pic_url}
          size="md"
          isGroup={isGroup}
        />
      </div>

      <div className="flex-1 min-w-0 self-stretch flex flex-col justify-center py-3 pr-1">
        <div className="flex items-center justify-between mb-0.5">
          <h3
            className={`text-[16px] truncate leading-tight ${
              hasUnread
                ? "text-[#E9EDEF] font-bold"
                : "text-[#E9EDEF] font-normal"
            }`}
          >
            {name}
          </h3>
          <span
            className={`text-[11px] flex-shrink-0 ml-2 ${
              hasUnread ? "text-[#00a884] font-bold" : "text-[#8696A0]"
            }`}
          >
            {formatChatTime(msg.timestamp)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center flex-1 min-w-0">
            {isMe && (
              <div className="mr-1.5 flex-shrink-0">
                {msg.status === "read" ? (
                  <CheckCheck size={15} className="text-[#53bdeb]" />
                ) : (
                  <Check size={15} className="text-[#8696A0]" />
                )}
              </div>
            )}
            <div
              className={`text-[14px] truncate leading-5 ${
                hasUnread
                  ? "text-[#E9EDEF] font-medium"
                  : "text-[#8696A0] font-light"
              }`}
            >
              {renderMessagePreview()}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[9px] text-[#00a884] bg-[#00a884]/10 px-1.5 py-0.5 rounded border border-[#00a884]/20 uppercase font-bold tracking-tighter">
              {msg.session_name || "Device"}
            </span>

            {hasUnread && (
              <div className="min-w-[20px] h-[20px] bg-[#00a884] rounded-full flex items-center justify-center px-1">
                <span className="text-[#111B21] text-[11px] font-bold">
                  {unreadCount > 99 ? "99+" : unreadCount}
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
