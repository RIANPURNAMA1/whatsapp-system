import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  LogOut,
  Loader2,
  QrCode,
  Tag,
  Filter,
  X,
  Users,
  MessageSquare,
  Mail,
  MailOpen,
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
    if (!confirm("Logout dari WhatsApp?")) return;
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
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <Avatar name={activeSession?.name || "W"} size="sm" className="ring-2 ring-blue-200" />
          <div className="flex flex-col min-w-0">
            <span className="text-gray-900 text-sm font-semibold truncate max-w-[150px]">
              {activeSession?.name || "WhatsApp Device"}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-500">
              <span className={`w-1.5 h-1.5 rounded-full ${activeSession?.status === "connected" ? "bg-emerald-500" : "bg-orange-400"}`} />
              {activeSession?.status === "connected" ? "Terhubung" : "Terputus"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {activeSession?.status !== "connected" && (
            <Button variant="ghost" size="sm" onClick={() => setShowQRModal(true)} className="text-orange-500 hover:text-orange-600 hover:bg-orange-50" title="Hubungkan">
              <QrCode className="w-5 h-5" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowNewChatModal(true)} className="text-gray-500 hover:text-gray-700 hover:bg-gray-100" title="Chat Baru">
            <Plus className="w-5 h-5" />
          </Button>
          <div className="relative group">
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              <MoreVertical className="w-5 h-5" />
            </Button>
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-200 hidden group-focus-within:block z-50 py-1">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 text-sm transition-colors">
                <LogOut className="w-4 h-4" /> Keluar Sesi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari chat..."
            value={chatSearch}
            onChange={(e) => setChatSearch(e.target.value)}
            className="pl-10 bg-gray-100 border-transparent focus:bg-white focus:border-blue-300 rounded-xl"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-4 pb-2 space-y-2 bg-white">
        <div className="flex items-center justify-between">
          <Button
            onClick={toggleUnreadFilter}
            variant="ghost"
            size="sm"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showUnreadOnly ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {showUnreadOnly ? <Mail className="w-3.5 h-3.5" /> : <MailOpen className="w-3.5 h-3.5" />}
            {showUnreadOnly ? "Belum Dibaca" : "Semua Pesan"}
            {totalUnread > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${showUnreadOnly ? "bg-white/20" : "bg-blue-500 text-white"}`}>
                {totalUnread}
              </span>
            )}
          </Button>
          {showUnreadOnly && filteredUnread > 0 && (
            <span className="text-xs text-gray-500">{filteredUnread} belum dibaca</span>
          )}
        </div>

        {!isLoadingLabels && labels.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
            <Button
              onClick={() => setSelectedLabelFilter("all")}
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedLabelFilter === "all" ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              <Filter className="w-3 h-3" /> Semua Label
            </Button>
            {labels.map((label) => (
              <Button
                key={label.id}
                onClick={() => setSelectedLabelFilter(label.id.toString())}
                variant="ghost"
                size="sm"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedLabelFilter === label.id.toString() ? "text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                style={{ backgroundColor: selectedLabelFilter === label.id.toString() ? label.color : undefined }}
              >
                <Tag className="w-3 h-3" />
                {label.name}
                {label.chat_count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-black/10 rounded-full text-[10px]">{label.chat_count}</span>
                )}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Active Filters */}
      {(showUnreadOnly || selectedLabelFilter !== "all" || chatSearch) && (
        <div className="px-4 pb-2 bg-white">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Filter:</span>
            {chatSearch && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-[10px] text-gray-700">
                "{chatSearch}"
                <button onClick={() => setChatSearch("")} className="hover:text-red-500"><X className="w-3 h-3" /></button>
              </span>
            )}
            {showUnreadOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500 rounded-md text-[10px] text-white">
                Belum Dibaca
                <button onClick={toggleUnreadFilter} className="hover:text-red-200"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedLabelFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-white"
                style={{ backgroundColor: labels.find((l) => l.id.toString() === selectedLabelFilter)?.color }}>
                {labels.find((l) => l.id.toString() === selectedLabelFilter)?.name}
                <button onClick={() => setSelectedLabelFilter("all")} className="hover:text-red-200"><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        {isLoadingChats && chats.length === 0 ? (
          <div className="flex flex-col items-center pt-20 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Memuat...</span>
          </div>
        ) : processedChats.length === 0 ? (
          <div className="text-center pt-20 px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm mb-2">
              {chatSearch || selectedLabelFilter !== "all" || showUnreadOnly
                ? "Tidak ada chat yang sesuai."
                : "Belum ada percakapan."}
            </p>
            {(chatSearch || selectedLabelFilter !== "all" || showUnreadOnly) && (
              <Button
                onClick={() => { setChatSearch(""); setSelectedLabelFilter("all"); setShowUnreadOnly(false); }}
                className="mt-3 bg-blue-500 hover:bg-blue-600 text-white"
              >
                Hapus Filter
              </Button>
            )}
          </div>
        ) : (
          <div>
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

      {/* Modals */}
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

  const preview = chat.last_message
    ? truncate(formatMessagePreview(chat.last_message_type || "text", chat.last_message), 40)
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
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150 relative group ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
    >
      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}

      <div className="relative flex-shrink-0" onClick={onClick}>
        <Avatar name={displayName} imageUrl={chat.profile_pic_url} size="md" isGroup={isGroup} />
        {chat.unread_count > 0 && (
          <div className="absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] bg-blue-500 rounded-full flex items-center justify-center border-2 border-white px-1">
            <span className="text-[10px] text-white font-bold">{chat.unread_count > 99 ? "99+" : chat.unread_count}</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0" onClick={onClick}>
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {isGroup && <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
            <h3 className="text-gray-900 text-sm font-medium truncate">{displayName}</h3>
            {chat.unread_count > 0 && <Mail className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
          </div>
          <span className={`text-[11px] flex-shrink-0 ml-2 ${chat.unread_count > 0 ? "text-blue-500 font-semibold" : "text-gray-400"}`}>
            {formatChatTime(chat.last_message_time)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs truncate leading-4 flex-1 ${chat.unread_count > 0 ? "text-gray-700 font-medium" : "text-gray-500"}`}>
            {preview}
          </p>
          <div className="flex items-center gap-1 flex-shrink-0">
            {chat.pinned === 1 && (
              <svg className="w-3.5 h-3.5 text-gray-400 rotate-45" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
              </svg>
            )}
          </div>
        </div>

        {sortedLabels && sortedLabels.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {sortedLabels.slice(0, 3).map((label: any, index: number) => (
              <span
                key={label.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                style={{ backgroundColor: label.color, opacity: 0.9 }}
              >
                {label.name}
              </span>
            ))}
            {sortedLabels.length > 3 && (
              <span className="text-[10px] text-gray-400 font-medium">+{sortedLabels.length - 3}</span>
            )}
          </div>
        )}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onAddLabel(); }}
        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-200 rounded-full transition-all"
        title="Kelola Label"
        disabled={isLoadingLabel}
      >
        {isLoadingLabel
          ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          : <Tag className="w-4 h-4 text-gray-400" />
        }
      </button>
    </div>
  );
};

export default ChatList;
