// components/GroupList.tsx
// FILE BARU — tidak mengubah file lain apapun

import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  Users,
  Loader2,
  RefreshCw,
  MessageSquare,
  Crown,
  ChevronRight,
} from "lucide-react";
import Avatar from "./Avatar";
import { getAvatarColor, formatChatTime, truncate } from "../utils/helpers";
import { groupApi } from "../services/Groupapi";
import type { GroupChat } from "../types/Group";

interface GroupListProps {
  sessionId: string;
  selectedGroupJid: string | null;
  onSelectGroup: (group: GroupChat) => void;
}

const GroupList: React.FC<GroupListProps> = ({
  sessionId,
  selectedGroupJid,
  onSelectGroup,
}) => {
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadGroups = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const data = await groupApi.getGroups(sessionId, search);
        setGroups(data);
      } catch (err) {
        console.error("Gagal load grup:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [sessionId, search]
  );

  // Load saat pertama kali & saat search berubah
  useEffect(() => {
    const timer = setTimeout(() => loadGroups(), 300);
    return () => clearTimeout(timer);
  }, [loadGroups]);

  const getPreview = (g: GroupChat) => {
    if (!g.last_message) return "Belum ada pesan";
    return truncate(g.last_message, 45);
  };

  return (
    <div className="flex flex-col h-full bg-[#111B21]">
      {/* Header */}
      <div className="bg-[#202C33] px-4 py-3 flex items-center justify-between border-b border-[#1E2A30]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#00a884]/20 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-[#00a884]" />
          </div>
          <div>
            <p className="text-[#E9EDEF] text-sm font-semibold">Grup WhatsApp</p>
            <p className="text-[#8696A0] text-[11px]">
              {groups.length > 0 ? `${groups.length} grup` : "Memuat..."}
            </p>
          </div>
        </div>
        <button
          onClick={() => loadGroups(true)}
          disabled={isRefreshing}
          className="p-2 text-[#8696A0] hover:text-[#00a884] hover:bg-[#2A3942] rounded-full transition-all"
          title="Perbarui daftar grup"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#00a884]" : ""}`}
          />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 bg-[#111B21]">
        <div className="relative flex items-center bg-[#202C33] rounded-lg px-3 group focus-within:ring-1 focus-within:ring-[#00a884] transition-all">
          <Search className="w-4 h-4 text-[#8696A0] group-focus-within:text-[#00a884] flex-shrink-0" />
          <input
            type="text"
            placeholder="Cari nama grup..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-[#E9EDEF] py-2 pl-3 text-sm outline-none placeholder:text-[#8696A0]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-[#8696A0] hover:text-white text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Daftar Grup */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 opacity-60">
            <Loader2 className="w-6 h-6 animate-spin text-[#00a884]" />
            <span className="text-[10px] text-[#8696A0] uppercase tracking-widest font-bold">
              Memuat Grup...
            </span>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 px-6 gap-3">
            <div className="w-16 h-16 bg-[#202C33] rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-[#3b4a54]" />
            </div>
            <p className="text-[#8696A0] text-sm text-center">
              {search
                ? "Grup tidak ditemukan."
                : "Belum ada grup yang tertaut.\nSinkronisasi otomatis saat pesan grup masuk."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1E2A30]/40">
            {groups.map((group) => (
              <GroupListItem
                key={group.jid}
                group={group}
                isSelected={selectedGroupJid === group.jid}
                preview={getPreview(group)}
                onClick={() => onSelectGroup(group)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Item grup individual
// ─────────────────────────────────────────────
interface GroupListItemProps {
  group: GroupChat;
  isSelected: boolean;
  preview: string;
  onClick: () => void;
}

const GroupListItem: React.FC<GroupListItemProps> = ({
  group,
  isSelected,
  preview,
  onClick,
}) => {
  const displayName =
    group.display_name || group.group_subject || group.name || group.jid;

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150 relative
        ${isSelected ? "bg-[#2A3942]" : "hover:bg-[#1E2A30]"}
      `}
    >
      {/* Garis hijau tanda terpilih */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00a884] rounded-r" />
      )}

      {/* Avatar grup */}
      <div className="relative flex-shrink-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: getAvatarColor(group.jid) }}
        >
          {group.profile_pic_url ? (
            <img
              src={group.profile_pic_url}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <Users className="w-5 h-5 text-white opacity-90" />
          )}
        </div>

        {/* Badge unread */}
        {group.unread_count > 0 && (
          <div className="absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#00a884] rounded-full flex items-center justify-center border-2 border-[#111B21] px-1">
            <span className="text-[10px] text-[#111B21] font-bold">
              {group.unread_count > 99 ? "99+" : group.unread_count}
            </span>
          </div>
        )}
      </div>

      {/* Info grup */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="text-[#E9EDEF] text-[14px] font-normal truncate flex items-center gap-1.5 leading-tight">
            {displayName}
          </h3>
          <span
            className={`text-[11px] flex-shrink-0 ml-1 ${
              group.unread_count > 0
                ? "text-[#00a884] font-semibold"
                : "text-[#8696A0]"
            }`}
          >
            {formatChatTime(group.last_message_time)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Jumlah anggota kalau tersedia */}
          {(group.participant_count ?? 0) > 0 && (
            <span className="text-[10px] text-[#00a884] bg-[#00a884]/10 rounded px-1 py-0.5 flex-shrink-0 flex items-center gap-0.5">
              <Users className="w-2.5 h-2.5" />
              {group.participant_count}
            </span>
          )}
          <p
            className={`text-xs truncate leading-4 flex-1 ${
              group.unread_count > 0
                ? "text-[#E9EDEF] font-medium"
                : "text-[#8696A0] font-light"
            }`}
          >
            {preview}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroupList;