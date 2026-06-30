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
    <div className="flex flex-col h-full bg-white border-r" style={{ borderColor: "#E4E6EB" }}>
      {/* Header */}
      <div className="px-3 h-[52px] flex items-center justify-between border-b shrink-0" style={{ borderColor: "#E4E6EB" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E7F3FF" }}>
            <Users className="w-4 h-4" style={{ color: "#0866FF" }} />
          </div>
          <div>
            <p className="text-[14px] font-bold leading-tight" style={{ color: "#050505" }}>
              Grup WhatsApp
            </p>
            <p className="text-[10px] font-medium" style={{ color: "#65676B" }}>
              {groups.length > 0 ? `${groups.length} grup` : "Memuat..."}
            </p>
          </div>
        </div>
        <button
          onClick={() => loadGroups(true)}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg transition-all hover:bg-[#F2F3F5]"
          style={{ color: "#65676B" }}
          title="Perbarui daftar grup"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} style={{ color: isRefreshing ? "#0866FF" : undefined }} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-2.5 pb-1.5 shrink-0">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5" style={{ color: "#8C939D" }} />
          <input
            type="text"
            placeholder="Cari nama grup..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 h-[32px] bg-[#F0F2F5] rounded-lg text-[12px] outline-none border-0"
            style={{ color: "#050505" }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 text-lg leading-none hover:opacity-70"
              style={{ color: "#8C939D" }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Daftar Grup */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#0866FF" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#65676B" }}>
              Memuat Grup...
            </span>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 px-6 gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F0F2F5" }}>
              <Users className="w-6 h-6" style={{ color: "#BCC0C4" }} />
            </div>
            <p className="text-[13px] text-center" style={{ color: "#65676B" }}>
              {search
                ? "Grup tidak ditemukan."
                : "Belum ada grup yang tertaut."}
            </p>
          </div>
        ) : (
          <div>
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
      className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-all relative"
      style={{
        backgroundColor: isSelected ? "#E7F3FF" : "transparent",
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "#F2F3F5"; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      {isSelected && (
        <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-sm" style={{ backgroundColor: "#0866FF" }} />
      )}

      {/* Avatar grup */}
      <div className="relative flex-shrink-0">
        <div
          className="w-[40px] h-[40px] rounded-full flex items-center justify-center"
          style={{ backgroundColor: getAvatarColor(group.jid) }}
        >
          {group.profile_pic_url ? (
            <img
              src={group.profile_pic_url}
              alt={displayName}
              className="w-[40px] h-[40px] rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <Users className="w-5 h-5 text-white opacity-90" />
          )}
        </div>

        {group.unread_count > 0 && (
          <div className="absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1" style={{ backgroundColor: "#0866FF" }}>
            <span className="text-[10px] text-white font-bold">
              {group.unread_count > 99 ? "99+" : group.unread_count}
            </span>
          </div>
        )}
      </div>

      {/* Info grup */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="text-[13px] truncate flex items-center gap-1.5 leading-tight" style={{
            color: "#050505",
            fontWeight: group.unread_count > 0 ? 700 : 600,
          }}>
            {displayName}
          </h3>
          <span
            className="text-[11px] flex-shrink-0 ml-1"
            style={{
              color: group.unread_count > 0 ? "#0866FF" : "#65676B",
              fontWeight: group.unread_count > 0 ? 600 : 400,
            }}
          >
            {formatChatTime(group.last_message_time)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {(group.participant_count ?? 0) > 0 && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0" style={{ backgroundColor: "#E7F3FF", color: "#0866FF" }}>
              <Users className="w-2.5 h-2.5" />
              {group.participant_count}
            </span>
          )}
          <p
            className="text-[12px] truncate leading-4 flex-1"
            style={{
              color: group.unread_count > 0 ? "#050505" : "#65676B",
              fontWeight: group.unread_count > 0 ? 500 : 400,
            }}
          >
            {preview}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroupList;
