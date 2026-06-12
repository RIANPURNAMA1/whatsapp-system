import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  LogOut,
  Loader2,
  QrCode,
  Tag,
  X,
  Users,
  MessageSquare,
  Mail,
  MailOpen,
  Pin
} from "lucide-react";
import useStore from "../store/useStore";
import Avatar from "./Avatar";
import {
  getDisplayName,
  formatChatTime,
  formatMessagePreview,
  truncate,
  isGroupJid,
} from "../utils/helpers";
import type { Chat } from "../types";
import { sessionApi } from "../services/api";
import { getSocket } from "../services/socket";
import toast from "react-hot-toast";
import ManageLabelsModal from "./Managelabelsmodal";
import LabelModal from "./Labelmodal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  const [labels, setLabels] = useState<any[]>([]);
  const [selectedLabelFilter, setSelectedLabelFilter] = useState<string>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showManageLabelsModal, setShowManageLabelsModal] = useState(false);
  const [selectedChatForLabel, setSelectedChatForLabel] = useState<Chat | null>(null);
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);
  const [currentChatLabels, setCurrentChatLabels] = useState<any[]>([]);
  const [isFetchingChatLabels, setIsFetchingChatLabels] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchChats(sessionId);
      loadLabels();
    }
  }, [sessionId, fetchChats]);

  // Listen for real-time label changes from phone
  useEffect(() => {
    if (!sessionId) return;
    const socket = getSocket();
    const handleLabelChange = () => { loadLabels(); fetchChats(sessionId); };
    socket.on(`label:created:${sessionId}`, handleLabelChange);
    socket.on(`chat:label:update:${sessionId}`, handleLabelChange);
    return () => {
      socket.off(`label:created:${sessionId}`, handleLabelChange);
      socket.off(`chat:label:update:${sessionId}`, handleLabelChange);
    };
  }, [sessionId]);

  const loadLabels = async () => {
    if (!sessionId) return;
    setIsLoadingLabels(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/sessions/${sessionId}/labels`,
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      if (!text) { setLabels([]); return; }
      const data = JSON.parse(text);
      if (data.success) {
        const sortedLabels = (data.data || []).sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setLabels(sortedLabels);
      } else {
        toast.error(data.message || "Gagal memuat label");
      }
    } catch (err: any) {
      if (!err.message?.includes("404")) toast.error("Gagal memuat label");
      setLabels([]);
    } finally {
      setIsLoadingLabels(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm("Konfirmasi kelur dari sesi WhatsApp ini?")) return;
    try {
      await sessionApi.logout(sessionId);
      toast.success("Berhasil logout");
      window.location.reload();
    } catch {
      toast.error("Gagal logout");
    }
  };

  const handleAddLabel = async (chat: Chat) => {
    setSelectedChatForLabel(chat);
    setIsFetchingChatLabels(true);

    try {
      const baseApi = import.meta.env.VITE_API_URL.replace(/\/$/, "");
      const res = await fetch(
        `${baseApi}/sessions/${sessionId}/chats/${encodeURIComponent(chat.jid)}/labels`
      );
      const data = await res.json();
      setCurrentChatLabels(data.data || []);
    } catch {
      setCurrentChatLabels((chat as any).labels || []);
    } finally {
      setIsFetchingChatLabels(false);
      setShowLabelModal(true);
    }
  };

  const handleLabelAdded = () => {
    loadLabels();
    fetchChats(sessionId);
    setShowLabelModal(false);
    setSelectedChatForLabel(null);
    setCurrentChatLabels([]);
  };

  const handleLabelsUpdated = () => {
    loadLabels();
    fetchChats(sessionId);
  };

  const toggleUnreadFilter = () => setShowUnreadOnly(!showUnreadOnly);

  const totalUnread = useMemo(() => {
    return chats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
  }, [chats]);

  const processedChats = useMemo(() => {
    const uniqueChatsMap = new Map<string, Chat>();
    chats.forEach((c) => {
      if (c.jid === "status@broadcast" || c.jid.includes("broadcast")) return;
      const existing = uniqueChatsMap.get(c.jid);
      const currentTime = c.last_message_time ? new Date(c.last_message_time).getTime() : 0;
      const existingTime = existing?.last_message_time ? new Date(existing.last_message_time).getTime() : 0;
      if (!existing || currentTime > existingTime) uniqueChatsMap.set(c.jid, c);
    });

    let filtered = Array.from(uniqueChatsMap.values()).filter((c) => {
      if (chatSearch) {
        const name = getDisplayName(c).toLowerCase();
        const search = chatSearch.toLowerCase();
        if (!name.includes(search) && !c.jid.includes(search)) return false;
      }
      if (showUnreadOnly && (!c.unread_count || c.unread_count === 0)) return false;
      if (selectedLabelFilter !== "all") {
        const chatLabels = (c as any).labels || [];
        if (!chatLabels.some((l: any) => l.id === parseInt(selectedLabelFilter))) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (a.pinned !== b.pinned) return (b.pinned || 0) - (a.pinned || 0);
      const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
      const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
      return timeB - timeA;
    });
  }, [chats, chatSearch, selectedLabelFilter, showUnreadOnly]);

  const filteredUnread = useMemo(() => {
    return processedChats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
  }, [processedChats]);

  return (
    <div className="flex flex-col h-full bg-white border-r" style={{ borderColor: "#E4E6EB" }}>
      {/* Header */}
      <div className="h-[52px] px-3 flex items-center justify-between border-b shrink-0" style={{ borderColor: "#E4E6EB" }}>
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={activeSession?.name || "W"} size="sm" className="w-[32px] h-[32px] ring-1 ring-[#E4E6EB]" />
          <div className="flex flex-col min-w-0 leading-tight justify-center">
            <span className="text-[13px] font-semibold truncate max-w-[120px]" style={{ color: "#050505" }}>
              {activeSession?.name || "WhatsApp"}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${activeSession?.status === "connected" ? "bg-[#31A24C]" : "bg-[#F5A623]"}`} />
              <span className="text-[10px] font-medium" style={{ color: "#65676B" }}>
                {activeSession?.status === "connected" ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {activeSession?.status !== "connected" && (
            <Button variant="ghost" size="icon" onClick={() => setShowQRModal(true)} className="h-7 w-7 hover:bg-[#F2F3F5]" title="Hubungkan Ulang">
              <QrCode className="w-[16px] h-[16px]" style={{ color: "#F5A623" }} />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setShowNewChatModal(true)} className="h-7 w-7 hover:bg-[#F2F3F5]" title="Chat Baru">
            <Plus className="w-[16px] h-[16px]" style={{ color: "#65676B" }} />
          </Button>

          <div className="relative group">
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#F2F3F5]">
              <MoreVertical className="w-[16px] h-[16px]" style={{ color: "#65676B" }} />
            </Button>
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border z-50 py-1 invisible group-hover:visible" style={{ borderColor: "#E4E6EB" }}>
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium transition-colors hover:bg-[#F2F3F5]" style={{ color: "#E41E3F" }}>
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pt-2.5 pb-1.5 shrink-0">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5" style={{ color: "#8C939D" }} />
          <Input
            type="text"
            placeholder="Cari pesan atau kontak..."
            value={chatSearch}
            onChange={(e) => setChatSearch(e.target.value)}
            className="w-full pl-8 h-[32px] bg-[#F0F2F5] border-0 text-[12px] rounded-lg transition-colors focus-visible:ring-0"
            style={{ color: "#050505" }}
          />
          {chatSearch && (
            <button onClick={() => setChatSearch("")} className="absolute right-2 hover:opacity-70" style={{ color: "#8C939D" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="px-3 pb-1.5 shrink-0 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={toggleUnreadFilter}
          className={`shrink-0 flex items-center gap-1 h-[26px] px-2.5 rounded-md text-[11px] font-medium transition-colors border ${
            showUnreadOnly
              ? "bg-[#E7F3FF] border-[#E7F3FF] text-[#1877F2]"
              : "bg-white border-[#E4E6EB] text-[#65676B] hover:bg-[#F2F3F5]"
          }`}
        >
          {showUnreadOnly ? <Mail className="w-3 h-3" /> : <MailOpen className="w-3 h-3" />}
          Belum Dibaca
          {totalUnread > 0 && !showUnreadOnly && (
            <span style={{ color: "#1877F2" }}>{totalUnread}</span>
          )}
        </button>

        {!isLoadingLabels && labels.length > 0 && (
          <>
            <div className="w-px h-3.5 shrink-0" style={{ backgroundColor: "#E4E6EB" }} />
            <button
              onClick={() => setSelectedLabelFilter("all")}
              className={`shrink-0 h-[26px] px-2.5 rounded-md text-[11px] font-medium transition-colors border ${
                selectedLabelFilter === "all"
                  ? "bg-[#E4E6EB] border-[#E4E6EB] text-[#050505]"
                  : "bg-white border-[#E4E6EB] text-[#65676B] hover:bg-[#F2F3F5]"
              }`}
            >
              Semua
            </button>
            {labels.map((label) => {
              const isActive = selectedLabelFilter === label.id.toString();
              return (
                <button
                  key={label.id}
                  onClick={() => setSelectedLabelFilter(label.id.toString())}
                  className={`shrink-0 h-[26px] px-2.5 rounded-md text-[11px] font-medium transition-colors border ${
                    isActive
                      ? 'text-white'
                      : 'hover:bg-[#F2F3F5]'
                  }`}
                  style={{
                    backgroundColor: isActive ? '#1877F2' : '#FFFFFF',
                    borderColor: isActive ? '#1877F2' : '#E4E6EB',
                    color: isActive ? '#FFFFFF' : '#65676B',
                  }}
                >
                  {label.name}
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#E4E6EB] scrollbar-track-transparent">
        {isLoadingChats && chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 opacity-60">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#8C939D" }} />
            <span className="text-[11px] font-medium" style={{ color: "#65676B" }}>Memuat percakapan...</span>
          </div>
        ) : processedChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: "#F0F2F5" }}>
              <MessageSquare className="w-5 h-5" style={{ color: "#8C939D" }} />
            </div>
            <p className="text-[12px] font-medium" style={{ color: "#65676B" }}>
              {chatSearch || selectedLabelFilter !== "all" || showUnreadOnly
                ? "Tidak ada hasil."
                : "Kotak masuk kosong."}
            </p>
            {(chatSearch || selectedLabelFilter !== "all" || showUnreadOnly) && (
              <button
                onClick={() => { setChatSearch(""); setSelectedLabelFilter("all"); setShowUnreadOnly(false); }}
                className="mt-3 text-[12px] font-semibold hover:underline" style={{ color: "#1877F2" }}
              >
                Hapus Filter
              </button>
            )}
          </div>
        ) : (
          <div className="pb-2">
            {processedChats.map((chat) => (
              <ChatListItem
                key={chat.jid}
                chat={chat}
                isSelected={selectedChat?.jid === chat.jid}
                onClick={() => selectChat(chat)}
                onAddLabel={() => handleAddLabel(chat)}
                labels={(chat as any).labels || []}
                isLoadingLabel={isFetchingChatLabels && selectedChatForLabel?.jid === chat.jid}
              />
            ))}
          </div>
        )}
      </div>

      {showLabelModal && selectedChatForLabel && (
        <LabelModal
          sessionId={sessionId}
          chatJid={selectedChatForLabel.jid}
          currentLabels={currentChatLabels}
          allLabels={labels}
          onClose={() => {
            setShowLabelModal(false);
            setSelectedChatForLabel(null);
            setCurrentChatLabels([]);
          }}
          onSuccess={handleLabelAdded}
        />
      )}

      {showManageLabelsModal && (
        <ManageLabelsModal
          sessionId={sessionId}
          labels={labels}
          onClose={() => setShowManageLabelsModal(false)}
          onSuccess={handleLabelsUpdated}
        />
      )}
    </div>
  );
};

const ChatListItem: React.FC<{
  chat: Chat;
  isSelected: boolean;
  onClick: () => void;
  onAddLabel: () => void;
  labels: any[];
  isLoadingLabel?: boolean;
}> = ({ chat, isSelected, onClick, onAddLabel, labels, isLoadingLabel }) => {
  const displayName = getDisplayName(chat);
  const isGroup = isGroupJid(chat.jid);
  const hasUnread = chat.unread_count > 0;

  const preview = chat.last_message
    ? truncate(formatMessagePreview(chat.last_message_type || "text", chat.last_message), 50)
    : "Mulai kirim pesan...";

  const sortedLabels = useMemo(() => {
    if (!labels || labels.length === 0) return [];
    return [...labels].sort((a, b) => {
      if (a.created_at && b.created_at) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return b.id - a.id;
    });
  }, [labels]);

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 cursor-pointer relative group transition-colors"
      style={{
        backgroundColor: isSelected ? "#E7F3FF" : "transparent",
      }}
    >
      {isSelected && (
        <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-sm" style={{ backgroundColor: "#1877F2" }} />
      )}

      <div className="relative shrink-0">
        <Avatar name={displayName} imageUrl={chat.profile_pic_url} size="sm" isGroup={isGroup} className="w-[36px] h-[36px]" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 min-w-0">
            {isGroup && <Users className="w-3 h-3 shrink-0" style={{ color: "#8C939D" }} />}
            <span className={`text-[12px] truncate ${hasUnread ? "font-bold" : "font-semibold"}`} style={{ color: "#050505" }}>
              {displayName}
            </span>
          </div>
          <span className={`text-[10px] shrink-0 ml-2 ${hasUnread ? "font-semibold" : ""}`} style={{ color: hasUnread ? "#1877F2" : "#65676B" }}>
            {formatChatTime(chat.last_message_time)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1.5 mt-0.5">
          <span className={`text-[11px] truncate leading-tight flex-1 ${hasUnread ? "font-medium" : ""}`} style={{ color: hasUnread ? "#050505" : "#65676B" }}>
            {preview}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {chat.pinned === 1 && (
              <Pin className="w-2.5 h-2.5 rotate-45" style={{ color: "#8C939D", fill: "#8C939D" }} />
            )}
            {hasUnread && (
              <div className="min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1877F2" }}>
                <span className="text-[9px] text-white font-bold leading-none">{chat.unread_count > 99 ? "99+" : chat.unread_count}</span>
              </div>
            )}
          </div>
        </div>

        {sortedLabels.length > 0 && (
          <div className="flex items-center gap-1 mt-0.5 overflow-hidden">
            {sortedLabels.slice(0, 2).map((label: any) => (
              <span
                key={label.id}
                className="inline-flex items-center px-1.5 py-[1px] rounded text-[9px] font-semibold text-white whitespace-nowrap"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
              </span>
            ))}
            {sortedLabels.length > 2 && (
              <span className="text-[9px] font-medium" style={{ color: "#8C939D" }}>+{sortedLabels.length - 2}</span>
            )}
          </div>
        )}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onAddLabel(); }}
        className={`absolute right-2.5 top-7 p-1 rounded-full bg-white border shadow-sm
          opacity-0 group-hover:opacity-100 hover:bg-[#F2F3F5] transition-all
          ${isLoadingLabel ? "opacity-100" : ""}
        `}
        style={{ borderColor: "#E4E6EB" }}
        title="Kelola Label"
        disabled={isLoadingLabel}
      >
        {isLoadingLabel
          ? <Loader2 className="w-3 h-3 animate-spin" style={{ color: "#1877F2" }} />
          : <Tag className="w-3 h-3" style={{ color: "#65676B" }} />
        }
      </button>
    </div>
  );
};

export default ChatList;
