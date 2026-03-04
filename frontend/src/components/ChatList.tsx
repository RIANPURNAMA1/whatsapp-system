import React, { useEffect, useState } from "react";
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
  const [selectedChatForLabel, setSelectedChatForLabel] = useState<Chat | null>(
    null,
  );
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);

  // Load chats dan labels
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        console.warn("Empty response from labels API");
        setLabels([]);
        return;
      }

      const data = JSON.parse(text);

      if (data.success) {
        // Sort labels dari terbaru ke terlama (kanan ke kiri)
        const sortedLabels = (data.data || []).sort((a: any, b: any) => {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });
        setLabels(sortedLabels);
      } else {
        console.error("Failed to load labels:", data.message);
        toast.error(data.message || "Gagal memuat label");
      }
    } catch (err: any) {
      console.error("Error loading labels:", err);
      if (!err.message?.includes("404")) {
        toast.error("Gagal memuat label");
      }
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

  const handleAddLabel = (chat: Chat) => {
    setSelectedChatForLabel(chat);
    setShowLabelModal(true);
  };

  const handleLabelAdded = () => {
    loadLabels();
    fetchChats(sessionId);
    setShowLabelModal(false);
    setSelectedChatForLabel(null);
  };

  const handleManageLabels = () => {
    setShowManageLabelsModal(true);
  };

  const handleLabelsUpdated = () => {
    loadLabels();
    fetchChats(sessionId);
  };

  const toggleUnreadFilter = () => {
    setShowUnreadOnly(!showUnreadOnly);
  };

  // Hitung total unread
  const totalUnread = React.useMemo(() => {
    return chats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
  }, [chats]);

 // Filter dan sort chats (FULL VERSION: SINKRON & DEDUPLIKASI)
  const processedChats = React.useMemo(() => {
    // 1. DEDUPLIKASI: Pastikan satu JID hanya muncul satu kali (mengambil pesan terbaru)
    const uniqueChatsMap = new Map<string, Chat>();

    chats.forEach((c) => {
      // --- FILTER JID SAMPAH ---
      if (c.jid === "status@broadcast" || c.jid.includes("broadcast")) {
        return;
      }

      const existing = uniqueChatsMap.get(c.jid);
      
      // Ambil waktu pesan saat ini dan pesan yang sudah tersimpan (jika ada)
      const currentTime = c.last_message_time ? new Date(c.last_message_time).getTime() : 0;
      const existingTime = existing?.last_message_time ? new Date(existing.last_message_time).getTime() : 0;

      // Jika belum ada di Map ATAU pesan ini lebih baru dari yang sudah ada di Map
      if (!existing || currentTime > existingTime) {
        uniqueChatsMap.set(c.jid, c);
      }
    });

    // 2. FILTERING: Terapkan Search, Unread, dan Label Filter
    let filtered = Array.from(uniqueChatsMap.values()).filter((c) => {
      // Filter berdasarkan search
      if (chatSearch) {
        const name = getDisplayName(c).toLowerCase();
        const search = chatSearch.toLowerCase();
        if (!name.includes(search) && !c.jid.includes(search)) {
          return false;
        }
      }

      // Filter berdasarkan unread
      if (showUnreadOnly && (!c.unread_count || c.unread_count === 0)) {
        return false;
      }

      // Filter by label
      if (selectedLabelFilter !== "all") {
        const chatLabels = (c as any).labels || [];
        if (
          !chatLabels.some((l: any) => l.id === parseInt(selectedLabelFilter))
        ) {
          return false;
        }
      }

      return true;
    });

    // 3. SORTING: Urutkan berdasarkan Pin dan Waktu Terakhir
    return [...filtered].sort((a, b) => {
      // Prioritaskan yang di-pin
      if (a.pinned !== b.pinned) {
        return (b.pinned || 0) - (a.pinned || 0);
      }

      // Bandingkan waktu pesan terakhir
      const timeA = a.last_message_time
        ? new Date(a.last_message_time).getTime()
        : 0;
      const timeB = b.last_message_time
        ? new Date(b.last_message_time).getTime()
        : 0;

      return timeB - timeA;
    });
  }, [chats, chatSearch, selectedLabelFilter, showUnreadOnly]);
  // Hitung unread filtered
  const filteredUnread = React.useMemo(() => {
    return processedChats.reduce(
      (sum, chat) => sum + (chat.unread_count || 0),
      0,
    );
  }, [processedChats]);

  return (
    <div className="flex flex-col h-full bg-[#111B21] border-r border-[#222d34]">
      {/* Header */}
      <div className="bg-[#202C33] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            name={activeSession?.name || "W"}
            size="sm"
            className="ring-1 ring-[#3b4a54]"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-[#E9EDEF] text-xs font-medium truncate max-w-[150px]">
              {activeSession?.name || "WhatsApp Device"}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#8696A0]">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activeSession?.status === "connected"
                    ? "bg-[#25D366]"
                    : "bg-orange-400"
                }`}
              />
              {activeSession?.status === "connected" ? "Terhubung" : "Terputus"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {activeSession?.status !== "connected" && (
            <button
              onClick={() => setShowQRModal(true)}
              className="p-2 text-orange-400 hover:bg-[#374248] rounded-full transition-colors"
              title="Hubungkan"
            >
              <QrCode className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setShowNewChatModal(true)}
            className="p-2 text-[#8696A0] hover:bg-[#374248] rounded-full transition-colors"
            title="Chat Baru"
          >
            <Plus className="w-5 h-5" />
          </button>
          <div className="relative group">
            <button className="p-2 text-[#8696A0] hover:bg-[#374248] rounded-full transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-44 bg-[#233138] rounded-lg shadow-2xl hidden group-focus-within:block z-50 py-1 border border-[#3b4a54]">
              <button
                onClick={handleManageLabels}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[#E9EDEF] hover:bg-[#182229] text-sm transition-colors"
              >
                <Tag className="w-4 h-4" /> Kelola Label
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-[#182229] text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" /> Keluar Sesi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-2">
        <div className="relative flex items-center bg-[#202C33] rounded-lg px-3 group focus-within:bg-[#111B21] focus-within:ring-1 focus-within:ring-[#00a884] transition-all">
          <Search className="w-4 h-4 text-[#8696A0] group-focus-within:text-[#00a884]" />
          <input
            type="text"
            placeholder="Cari chat..."
            value={chatSearch}
            onChange={(e) => setChatSearch(e.target.value)}
            className="w-full bg-transparent text-[#E9EDEF] py-2 pl-3 text-sm outline-none placeholder:text-[#8696A0]"
          />
        </div>
      </div>

      {/* Filter Bar - Unread + Labels */}
      <div className="px-3 pb-2 space-y-2">
        {/* Unread Filter */}
        <div className="flex items-center justify-between">
          <button
            onClick={toggleUnreadFilter}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showUnreadOnly
                ? "bg-[#00a884] text-white"
                : "bg-[#202C33] text-[#8696A0] hover:bg-[#2A3942]"
            }`}
          >
            {showUnreadOnly ? (
              <Mail className="w-3.5 h-3.5" />
            ) : (
              <MailOpen className="w-3.5 h-3.5" />
            )}
            {showUnreadOnly ? "Belum Dibaca" : "Semua Pesan"}
            {totalUnread > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  showUnreadOnly ? "bg-white/20" : "bg-[#00a884] text-white"
                }`}
              >
                {totalUnread}
              </span>
            )}
          </button>

          {showUnreadOnly && filteredUnread > 0 && (
            <span className="text-xs text-[#8696A0]">
              {filteredUnread} pesan belum dibaca
            </span>
          )}
        </div>

        {/* Label Filter */}
        {!isLoadingLabels && labels.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar p-3">
            <button
              onClick={() => setSelectedLabelFilter("all")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedLabelFilter === "all"
                  ? "bg-[#00a884] text-white"
                  : "bg-[#202C33] text-[#8696A0] hover:bg-[#2A3942]"
              }`}
            >
              <Filter className="w-3 h-3" />
              Semua Label
            </button>
            {labels.map((label) => (
              <button
                key={label.id}
                onClick={() => setSelectedLabelFilter(label.id.toString())}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedLabelFilter === label.id.toString()
                    ? "text-white shadow-lg"
                    : "bg-[#202C33] text-[#8696A0] hover:bg-[#2A3942]"
                }`}
                style={{
                  backgroundColor:
                    selectedLabelFilter === label.id.toString()
                      ? label.color
                      : undefined,
                }}
              >
                <Tag className="w-3 h-3" />
                {label.name}
                {label.chat_count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-black/20 rounded-full text-[10px]">
                    {label.chat_count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active Filters Info */}
      {(showUnreadOnly || selectedLabelFilter !== "all" || chatSearch) && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-[#8696A0] uppercase tracking-wider">
              Filter Aktif:
            </span>
            {chatSearch && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#202C33] rounded-md text-[10px] text-[#E9EDEF]">
                Pencarian: "{chatSearch}"
                <button
                  onClick={() => setChatSearch("")}
                  className="hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {showUnreadOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#00a884] rounded-md text-[10px] text-white">
                Belum Dibaca
                <button
                  onClick={toggleUnreadFilter}
                  className="hover:text-red-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedLabelFilter !== "all" && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-white"
                style={{
                  backgroundColor: labels.find(
                    (l) => l.id.toString() === selectedLabelFilter,
                  )?.color,
                }}
              >
                {
                  labels.find((l) => l.id.toString() === selectedLabelFilter)
                    ?.name
                }
                <button
                  onClick={() => setSelectedLabelFilter("all")}
                  className="hover:text-red-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar mt-3">
        {isLoadingChats && chats.length === 0 ? (
          <div className="flex flex-col items-center pt-20 gap-3 opacity-60">
            <Loader2 className="w-6 h-6 animate-spin text-[#00a884]" />
            <span className="text-[10px] text-[#8696A0] uppercase tracking-widest font-bold">
              Sinkronisasi Chat...
            </span>
          </div>
        ) : processedChats.length === 0 ? (
          <div className="text-center pt-20 px-10">
            <div className="w-16 h-16 bg-[#202C33] rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-[#3b4a54]" />
            </div>
            <p className="text-[#8696A0] text-sm font-light mb-2">
              {chatSearch || selectedLabelFilter !== "all" || showUnreadOnly
                ? "Tidak ada chat yang sesuai dengan filter."
                : "Belum ada percakapan."}
            </p>
            {(chatSearch ||
              selectedLabelFilter !== "all" ||
              showUnreadOnly) && (
              <button
                onClick={() => {
                  setChatSearch("");
                  setSelectedLabelFilter("all");
                  setShowUnreadOnly(false);
                }}
                className="mt-4 px-4 py-2 bg-[#00a884] text-white rounded-lg text-xs font-medium hover:bg-[#00a884]/90 transition-colors"
              >
                Hapus Semua Filter
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#1E2A30]/30">
            {processedChats.map((chat) => (
              <ChatListItem
                key={chat.jid}
                chat={chat}
                isSelected={selectedChat?.jid === chat.jid}
                onClick={() => selectChat(chat)}
                onAddLabel={() => handleAddLabel(chat)}
                labels={(chat as any).labels || []}
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
          currentLabels={(selectedChatForLabel as any).labels || []}
          allLabels={labels}
          onClose={() => {
            setShowLabelModal(false);
            setSelectedChatForLabel(null);
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

/**
 * Chat List Item Component
 */
const ChatListItem: React.FC<{
  chat: Chat;
  isSelected: boolean;
  onClick: () => void;
  onAddLabel: () => void;
  labels: any[];
}> = ({ chat, isSelected, onClick, onAddLabel, labels }) => {
  const displayName = getDisplayName(chat);
  const isGroup = isGroupJid(chat.jid);

  const preview = chat.last_message
    ? truncate(
        formatMessagePreview(
          chat.last_message_type || "text",
          chat.last_message,
        ),
        40,
      )
    : "Mulai kirim pesan...";

  // Sort labels dari terbaru ke terlama
  const sortedLabels = React.useMemo(() => {
    if (!labels || labels.length === 0) return [];
    return [...labels].sort((a, b) => {
      // Jika ada created_at, gunakan itu
      if (a.created_at && b.created_at) {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      // Fallback ke id (label baru punya id lebih besar)
      return b.id - a.id;
    });
  }, [labels]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150 relative group ${
        isSelected ? "bg-[#2A3942]" : "hover:bg-[#1E2A30]"
      }`}
    >
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00a884]" />
      )}

      <div className="relative flex-shrink-0" onClick={onClick}>
        <Avatar
          name={displayName}
          imageUrl={chat.profile_pic_url}
          size="md"
          isGroup={isGroup}
        />
        {chat.unread_count > 0 && (
          <div className="absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#00a884] rounded-full flex items-center justify-center border-2 border-[#111B21] px-1">
            <span className="text-[10px] text-[#111B21] font-bold">
              {chat.unread_count > 99 ? "99+" : chat.unread_count}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0" onClick={onClick}>
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {isGroup && (
              <Users className="w-3.5 h-3.5 text-[#8696A0] flex-shrink-0" />
            )}
            <h3 className="text-[#E9EDEF] text-[15px] font-normal truncate leading-tight">
              {displayName}
            </h3>
            {chat.unread_count > 0 && (
              <Mail className="w-3.5 h-3.5 text-[#00a884] flex-shrink-0" />
            )}
          </div>
          <span
            className={`text-[11px] flex-shrink-0 ml-2 ${
              chat.unread_count > 0
                ? "text-[#00a884] font-semibold"
                : "text-[#8696A0]"
            }`}
          >
            {formatChatTime(chat.last_message_time)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-xs truncate leading-4 flex-1 ${
              chat.unread_count > 0
                ? "text-[#E9EDEF] font-medium"
                : "text-[#8696A0] font-light"
            }`}
          >
            {preview}
          </p>

          <div className="flex items-center gap-1 flex-shrink-0">
            {chat.pinned === 1 && (
              <svg
                className="w-3.5 h-3.5 text-[#8696A0] rotate-45"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
              </svg>
            )}
          </div>
        </div>

        {/* Labels Display - Kanan ke Kiri (Terbaru Dulu) */}
        {sortedLabels && sortedLabels.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {sortedLabels.slice(0, 3).map((label: any, index: number) => (
              <span
                key={label.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white animate-fadeIn"
                style={{
                  backgroundColor: label.color,
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {label.name}
              </span>
            ))}
            {sortedLabels.length > 3 && (
              <span className="text-[10px] text-[#8696A0] font-medium">
                +{sortedLabels.length - 3} lainnya
              </span>
            )}
          </div>
        )}
      </div>

      {/* Add Label Button - Show on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddLabel();
        }}
        className=" group-hover:opacity-100 p-1.5 hover:bg-[#374248] rounded-full transition-all"
        title="Kelola Label"
      >
        <Tag className="w-4 h-4 text-[#8696A0]" />
      </button>
    </div>
  );
};

export default ChatList;
