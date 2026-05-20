import React from "react";
import { Users, MessageCircle, Radio, ArrowRight } from "lucide-react";
import useStore from "../store/useStore";

interface LiveFeedProps {
  messages: any[];
  totalPesan: number;
  dark?: boolean;
  onNavigate?: (tab: string) => void;
  sessions?: any[];
}

const LiveFeed: React.FC<LiveFeedProps> = ({ messages, totalPesan, onNavigate, sessions = [] }) => {
  const { selectChat, chats, setActiveSession } = useStore();
  const connectedSessions = sessions.filter((s) => s.status === "connected");

  const handleItemClick = (chat: any) => {
    const sessionId = chat.session_id;
    const senderJid = chat.sender_jid || chat.sender;
    const cleanSender = senderJid.replace(/\D/g, "");

    const target = chats.find((c) => c.jid === senderJid || c.jid?.includes(cleanSender));

    if (sessionId) {
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        setActiveSession(session);
      }
    }

    if (target) {
      selectChat(target);
    } else {
      selectChat({
        jid: senderJid,
        display_name: chat.sender || "Unknown",
        session_id: sessionId,
      } as any);
    }

    if (onNavigate) {
      onNavigate("chats");
    }
  };

  const formatTime = (timeStr: string | undefined) => {
    if (!timeStr) return "--:--";
    const parts = timeStr.split(" ");
    return parts[1]?.substring(0, 5) || "--:--";
  };

  const getSessionName = (sessionId: string | number) => {
    const session = sessions.find((s) => s.id === sessionId);
    return session?.name || session?.device_name || `Device ${sessionId}`;
  };

  const groupedBySession: Record<string, any[]> = {};
  messages.forEach((msg) => {
    const sid = msg.session_id ?? "unknown";
    if (!groupedBySession[sid]) groupedBySession[sid] = [];
    if (groupedBySession[sid].length < 15) {
      groupedBySession[sid].push(msg);
    }
  });

  const sessionOrder =
    connectedSessions.length > 0
      ? connectedSessions.map((s) => String(s.id))
      : Object.keys(groupedBySession);

  const renderFeedCard = (sessionId: string, sessionMessages: any[]) => (
    <div
      key={sessionId}
      className="flex flex-col h-[520px] bg-white rounded-lg overflow-hidden border border-[#E4E6EB] min-w-[280px] flex-1"
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between flex-shrink-0 bg-white border-b border-[#E4E6EB]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#E7F3FF]">
            <MessageCircle size={13} color="#1877F2" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-[#050505] truncate">
              {getSessionName(sessionId)}
            </p>
            <p className="text-[9px] font-medium text-[#65676B]">
              {sessionMessages.length} pesan
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#31A24C]" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 custom-scrollbar">
        {sessionMessages.length > 0 ? (
          sessionMessages.map((chat, idx) => (
            <button
              key={idx}
              onClick={() => handleItemClick(chat)}
              className="group w-full text-left flex items-center gap-2.5 p-2 rounded-lg transition-all duration-150 hover:bg-[#F0F2F5] active:scale-[0.99]"
            >
              <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-[#E4E6EB]">
                <Users size={12} color="#65676B" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-semibold text-[#050505] truncate">
                    {chat.sender || "Unknown"}
                  </span>
                  <span className="text-[9px] text-[#65676B] flex-shrink-0">
                    {formatTime(chat.received_at)}
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed line-clamp-1 text-[#65676B]">
                  {chat.message_text || "Pesan baru masuk..."}
                </p>
              </div>
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={12} color="#1877F2" />
              </div>
            </button>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 py-8">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F0F2F5]">
              <MessageCircle size={18} color="#BCC0C4" />
            </div>
            <div className="text-center">
              <p className="text-[11px] font-semibold text-[#65676B]">
                Menunggu Pesan
              </p>
              <p className="text-[10px] text-[#BCC0C4]">
                Pesan akan muncul di sini
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Global Header */}
      {connectedSessions.length > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#E7F3FF]">
              <Radio size={15} color="#1877F2" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#050505]">
                Live Chat Feed
              </p>
              <p className="text-[10px] font-medium text-[#65676B]">
                Real-time per perangkat
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium text-[#65676B]">Total Pesan</p>
            <p className="text-xl font-bold text-[#050505]">
              {(totalPesan || 0).toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      )}

      {/* Per-Device Feed */}
      {connectedSessions.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
          {sessionOrder.map((sessionId) => {
            const sessionMessages = groupedBySession[sessionId] || [];
            return renderFeedCard(sessionId, sessionMessages);
          })}
        </div>
      ) : Object.keys(groupedBySession).length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
          {sessionOrder.map((sessionId) => {
            const sessionMessages = groupedBySession[sessionId] || [];
            return renderFeedCard(sessionId, sessionMessages);
          })}
        </div>
      ) : (
        /* Single card fallback when no sessions but messages exist */
        <div className="flex flex-col h-[520px] bg-white rounded-lg overflow-hidden border border-[#E4E6EB]">
          <div className="px-5 pt-4 pb-3 flex items-center justify-between flex-shrink-0 bg-white border-b border-[#E4E6EB]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#E7F3FF]">
                <MessageCircle size={16} color="#1877F2" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#050505]">Live Chat Feed</p>
                <p className="text-[10px] font-medium text-[#65676B]">Real-time Messages</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium text-[#65676B]">Total Pesan</p>
              <p className="text-2xl font-bold text-[#050505]">
                {(totalPesan || 0).toLocaleString("id-ID")}
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
            {messages.length > 0 ? (
              messages.map((chat, idx) => (
                <button
                  key={idx}
                  onClick={() => handleItemClick(chat)}
                  className="group w-full text-left flex items-center gap-3 p-3 rounded-lg transition-all duration-150 hover:bg-[#F0F2F5] active:scale-[0.99]"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-[#E4E6EB]">
                    <Users size={15} color="#65676B" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-[#050505]">
                          {chat.sender || "Unknown"}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#31A24C]" />
                      </div>
                      <span className="text-[10px] text-[#65676B]">
                        {formatTime(chat.received_at)}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed line-clamp-1 text-[#65676B]">
                      {chat.message_text || "Pesan baru masuk..."}
                    </p>
                  </div>
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight size={14} color="#1877F2" />
                  </div>
                </button>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-12">
                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#F0F2F5]">
                  <MessageCircle size={24} color="#BCC0C4" />
                </div>
                <div className="text-center">
                  <p className="text-[12px] font-semibold text-[#65676B]">
                    Menunggu Pesan
                  </p>
                  <p className="text-[11px] text-[#BCC0C4]">
                    Pesan akan muncul di sini secara real-time
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="px-5 py-3 flex items-center justify-between flex-shrink-0 border-t bg-[#F0F2F5] border-[#E4E6EB]">
            <div className="flex items-center gap-2">
              <Radio size={13} color="#31A24C" />
              <span className="text-[11px] font-medium text-[#65676B]">Live Feed Aktif</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#31A24C]" />
              <span className="w-2 h-2 rounded-full bg-[#31A24C] opacity-60" />
              <span className="w-2 h-2 rounded-full bg-[#31A24C] opacity-30" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveFeed;
