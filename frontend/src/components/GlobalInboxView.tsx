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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  const isAdminOrManager = useMemo(() => {
    const role = user?.role_type?.toLowerCase().trim();
    return role === "manager" || role === "system";
  }, [user]);

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
  }, [fetchGlobalMessages]);

  const handleChatClick = useCallback(
    (msg: any) => {
      const targetSession = sessions.find((s) => s.id === msg.session_id);
      if (targetSession) {
        setActiveSession(targetSession);
        const chatData = {
          jid: msg.chat_jid,
          name: msg.display_name,
          phone_number: msg.phone_number,
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
    <div className="flex flex-col h-full bg-white border-r" style={{ borderColor: "#E4E6EB" }}>
      {/* Header */}
      <div className="px-3 h-[52px] flex-none flex items-center justify-between border-b" style={{ borderColor: "#E4E6EB" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E7F3FF" }}>
            <Inbox size={16} style={{ color: "#1877F2" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold leading-tight" style={{ color: "#050505" }}>
              Global Inbox
            </h2>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#31A24C" }} />
              <p className="text-[10px] font-medium" style={{ color: "#65676B" }}>
                {isAdminOrManager ? "Full Access" : "Real-time"}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchGlobalMessages}
          className="p-1.5 rounded-lg transition-all hover:bg-[#F2F3F5]"
          style={{ color: "#65676B" }}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filter Section */}
      <div className="px-3 py-2.5 flex-none space-y-2 border-b" style={{ borderColor: "#E4E6EB" }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#8C939D" }} />
          <Input
            type="text"
            placeholder="Cari kontak atau pesan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 h-[32px] bg-[#F0F2F5] border-0 text-[12px] rounded-lg transition-colors focus-visible:ring-0"
            style={{ color: "#050505" }}
          />
        </div>

        {!isAdminOrManager && (
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8C939D" }}>
              <Smartphone size={13} />
            </div>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full text-[12px] pl-8 pr-8 py-1.5 rounded-lg outline-none appearance-none cursor-pointer"
              style={{
                backgroundColor: "#F0F2F5",
                color: "#050505",
                border: "none",
              }}
            >
              <option value="all">Semua Perangkat</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.id}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8C939D" }}>
              <ChevronDown size={13} />
            </div>
          </div>
        )}
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center pt-24 gap-3">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#1877F2" }} />
            <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: "#65676B" }}>
              Memuat Pesan...
            </p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center pt-24 px-10">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#F0F2F5" }}>
              <MessageSquare className="w-6 h-6" style={{ color: "#BCC0C4" }} />
            </div>
            <p className="text-[13px]" style={{ color: "#65676B" }}>
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
      className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-all group"
      style={{
        borderBottom: "1px solid #E4E6EB",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F2F3F5"; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      <div className="relative flex-shrink-0">
        <Avatar
          name={name}
          imageUrl={msg.profile_pic_url}
          size="sm"
          isGroup={isGroup}
          className="w-[40px] h-[40px]"
        />
      </div>

      <div className="flex-1 min-w-0 self-stretch flex flex-col justify-center py-0.5">
        <div className="flex items-center justify-between mb-0.5">
          <h3
            className="text-[13px] truncate leading-tight"
            style={{
              color: "#050505",
              fontWeight: hasUnread ? 700 : 600,
            }}
          >
            {name}
          </h3>
          <span
            className="text-[11px] flex-shrink-0 ml-2"
            style={{
              color: hasUnread ? "#1877F2" : "#65676B",
              fontWeight: hasUnread ? 600 : 400,
            }}
          >
            {formatChatTime(msg.timestamp)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center flex-1 min-w-0">
            {isMe && (
              <div className="mr-1.5 flex-shrink-0">
                {msg.status === "read" ? (
                  <CheckCheck size={14} style={{ color: "#1877F2" }} />
                ) : (
                  <Check size={14} style={{ color: "#8C939D" }} />
                )}
              </div>
            )}
            <div
              className="text-[12px] truncate leading-5"
              style={{
                color: hasUnread ? "#050505" : "#65676B",
                fontWeight: hasUnread ? 500 : 400,
              }}
            >
              {renderMessagePreview()}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{
                backgroundColor: "#E7F3FF",
                color: "#1877F2",
              }}
            >
              {msg.session_name || "Device"}
            </span>

            {hasUnread && (
              <div
                className="min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1"
                style={{ backgroundColor: "#1877F2" }}
              >
                <span className="text-white text-[10px] font-bold">
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
