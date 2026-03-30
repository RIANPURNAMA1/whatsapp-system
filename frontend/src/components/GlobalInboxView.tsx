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
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="px-4 h-[60px] flex-none flex items-center justify-between bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Inbox size={20} />
          </div>
          <div>
            <h2 className="text-gray-900 text-base font-semibold leading-tight">
              Global Inbox
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">
                {isAdminOrManager ? "Full Access" : "Real-time"}
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchGlobalMessages}
          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
        >
          <RefreshCw size={19} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      {/* Filter Section */}
      <div className="px-4 py-3 flex-none bg-white space-y-3 border-b border-gray-100">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari kontak atau pesan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-100 border-transparent focus:bg-white focus:border-blue-300 rounded-xl"
          />
        </div>

        {/* Device Selector */}
        {!isAdminOrManager && (
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Smartphone size={14} />
            </div>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full bg-gray-100 text-gray-900 text-[13px] pl-9 pr-8 py-2 rounded-xl outline-none appearance-none cursor-pointer border border-transparent focus:border-blue-300 transition-colors"
            >
              <option value="all">Semua Perangkat</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.id}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <ChevronDown size={14} />
            </div>
          </div>
        )}
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center pt-32 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 opacity-80" />
            <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">
              Memuat Pesan...
            </p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center pt-32 px-10">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">
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
      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-all group border-b border-gray-100"
    >
      <div className="relative flex-shrink-0">
        <Avatar
          name={name}
          imageUrl={msg.profile_pic_url}
          size="md"
          isGroup={isGroup}
        />
      </div>

      <div className="flex-1 min-w-0 self-stretch flex flex-col justify-center">
        <div className="flex items-center justify-between mb-0.5">
          <h3
            className={`text-[15px] truncate leading-tight ${
              hasUnread
                ? "text-gray-900 font-semibold"
                : "text-gray-700 font-normal"
            }`}
          >
            {name}
          </h3>
          <span
            className={`text-[11px] flex-shrink-0 ml-2 ${
              hasUnread ? "text-blue-500 font-semibold" : "text-gray-400"
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
                  <CheckCheck size={15} className="text-blue-500" />
                ) : (
                  <Check size={15} className="text-gray-400" />
                )}
              </div>
            )}
            <div
              className={`text-[13px] truncate leading-5 ${
                hasUnread
                  ? "text-gray-700 font-medium"
                  : "text-gray-500"
              }`}
            >
              {renderMessagePreview()}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[9px] text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">
              {msg.session_name || "Device"}
            </span>

            {hasUnread && (
              <div className="min-w-[20px] h-[20px] bg-blue-500 rounded-full flex items-center justify-center px-1">
                <span className="text-white text-[11px] font-bold">
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
