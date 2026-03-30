// components/GroupList.tsx
// FILE BARU — tidak mengubah file lain apapun
import { getSocket } from "../services/socket";
import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  Users,
  Loader2,
  RefreshCw,
} from "lucide-react";
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
    [sessionId, search],
  );

  useEffect(() => {
    const timer = setTimeout(() => loadGroups(), 300);
    return () => clearTimeout(timer);
  }, [loadGroups]);

  useEffect(() => {
    const socket = getSocket();

    const handleGroupUpdate = (data: any) => {
      setGroups((prevGroups) => {
        return (
          prevGroups
            .map((g) => {
              if (g.jid === data.chat_jid || g.jid === data.chatJid) {
                return {
                  ...g,
                  last_message: data.content || g.last_message,
                  last_message_time: data.timestamp || g.last_message_time,
                  last_message_from:
                    data.from_jid || data.fromJid || g.last_message_from,
                  last_message_type:
                    data.message_type ||
                    data.messageType ||
                    g.last_message_type,
                  unread_count:
                    (data.is_from_me === 0 || data.isFromMe === false) &&
                    data.chat_jid !== selectedGroupJid
                      ? g.unread_count + 1
                      : g.unread_count,
                };
              }
              return g;
            })
            .sort((a, b) => {
              const timeA = a.last_message_time
                ? new Date(a.last_message_time).getTime()
                : 0;
              const timeB = b.last_message_time
                ? new Date(b.last_message_time).getTime()
                : 0;
              return timeB - timeA;
            })
        );
      });
    };

    const handleChatUpdate = (data: { chatJid: string }) => {
      if (data.chatJid && data.chatJid.endsWith("@g.us")) {
        loadGroups(false);
      }
    };

    socket.on(`message:new:${sessionId}`, handleGroupUpdate);
    socket.on(`group:message:${sessionId}`, handleGroupUpdate);
    socket.on(`chat:update:${sessionId}`, handleChatUpdate);

    return () => {
      socket.off(`message:new:${sessionId}`, handleGroupUpdate);
      socket.off(`group:message:${sessionId}`, handleGroupUpdate);
      socket.off(`chat:update:${sessionId}`, handleChatUpdate);
    };
  }, [sessionId, selectedGroupJid, loadGroups]);

  const getPreview = (g: GroupChat) => {
    if (!g.last_message) return "Belum ada pesan";
    return truncate(g.last_message, 45);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-gray-900 text-sm font-semibold">
              Grup WhatsApp
            </p>
            <p className="text-gray-500 text-[11px]">
              {groups.length > 0 ? `${groups.length} grup` : "Memuat..."}
            </p>
          </div>
        </div>
        <button
          onClick={() => loadGroups(true)}
          disabled={isRefreshing}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-all"
          title="Perbarui daftar grup"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`}
          />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 bg-white">
        <div className="relative flex items-center bg-gray-100 rounded-lg px-3 group focus-within:ring-1 focus-within:ring-blue-500 transition-all">
          <Search className="w-4 h-4 text-gray-400 group-focus-within:text-blue-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Cari nama grup..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-gray-900 py-2 pl-3 text-sm outline-none placeholder:text-gray-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Daftar Grup */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
              Memuat Grup...
            </span>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 px-6 gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm text-center">
              {search
                ? "Grup tidak ditemukan."
                : "Belum ada grup yang tertaut.\nSinkronisasi otomatis saat pesan grup masuk."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
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
        ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}
      `}
    >
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r" />
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
          <div className="absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] bg-blue-500 rounded-full flex items-center justify-center border-2 border-white px-1">
            <span className="text-[10px] text-white font-bold">
              {group.unread_count > 99 ? "99+" : group.unread_count}
            </span>
          </div>
        )}
      </div>

      {/* Info grup */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="text-gray-900 text-[14px] font-normal truncate flex items-center gap-1.5 leading-tight">
            {displayName}
          </h3>
          <span
            className={`text-[11px] flex-shrink-0 ml-1 ${
              group.unread_count > 0
                ? "text-blue-500 font-semibold"
                : "text-gray-400"
            }`}
          >
            {formatChatTime(group.last_message_time)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {(group.participant_count ?? 0) > 0 && (
            <span className="text-[10px] text-blue-600 bg-blue-50 rounded px-1 py-0.5 flex-shrink-0 flex items-center gap-0.5">
              <Users className="w-2.5 h-2.5" />
              {group.participant_count}
            </span>
          )}
          <p
            className={`text-xs truncate leading-4 flex-1 ${
              group.unread_count > 0
                ? "text-gray-700 font-medium"
                : "text-gray-500 font-light"
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
