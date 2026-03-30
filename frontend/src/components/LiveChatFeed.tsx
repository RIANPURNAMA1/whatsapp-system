import React from "react";
import { Users, MessageCircle, Radio, ArrowRight, Phone } from "lucide-react";
import useStore from "../store/useStore";

interface LiveFeedProps {
  messages: any[];
  totalPesan: number;
  dark?: boolean;
}

const LiveFeed: React.FC<LiveFeedProps> = ({ messages, totalPesan }) => {
  const { selectChat, chats } = useStore();

  const handleItemClick = (sender: string) => {
    const cleanSender = sender.replace(/\D/g, "");
    const target = chats.find((c) => c.jid === sender || c.jid.includes(cleanSender));
    if (target) selectChat(target);
  };

  const formatTime = (timeStr: string | undefined) => {
    if (!timeStr) return "--:--";
    const parts = timeStr.split(" ");
    return parts[1]?.substring(0, 5) || "--:--";
  };

  return (
    <div className="flex flex-col h-[520px] bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between flex-shrink-0 bg-white border-b border-gray-100">
        {/* Left: title + live dot */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10">
            <span className="absolute w-10 h-10 rounded-xl bg-emerald-50" />
            <span className="absolute w-10 h-10 rounded-xl bg-emerald-500/10 animate-pulse" />
            <MessageCircle size={18} className="text-emerald-600 relative z-10" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-gray-900 tracking-wide">
              Live Chat Feed
            </p>
            <p className="text-[10px] text-gray-400 font-medium">
              Real-time Messages
            </p>
          </div>
        </div>

        {/* Right: total traffic badge */}
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
            Total Pesan
          </p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight mt-0.5">
            {(totalPesan || 0).toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      {/* ── List ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 custom-scrollbar">
        {messages.length > 0 ? (
          messages.map((chat, idx) => (
            <button
              key={idx}
              onClick={() => handleItemClick(chat.sender_jid || chat.sender)}
              className="group w-full text-left flex items-center gap-3 p-3.5 rounded-xl bg-gray-50/60 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-md transition-all duration-200 active:scale-[0.99]"
            >
              {/* Avatar */}
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-all duration-300 shadow-sm">
                <Users size={16} className="text-gray-400 group-hover:text-white transition-colors" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">
                      {chat.sender || "Unknown"}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[9px] text-emerald-600 font-semibold">Online</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {formatTime(chat.received_at)}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-1">
                  {chat.message_text || "Pesan baru masuk..."}
                </p>
              </div>

              {/* Right arrow */}
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <ArrowRight size={14} className="text-emerald-500" />
                </div>
              </div>
            </button>
          ))
        ) : (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center gap-4 py-12">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <MessageCircle size={28} className="text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                Menunggu Pesan
              </p>
              <p className="text-[11px] text-gray-300 mt-1.5">
                Pesan akan muncul di sini secara real-time
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="px-5 py-3.5 flex items-center justify-between flex-shrink-0 bg-gray-50/50 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio size={14} className="text-emerald-500" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          </div>
          <span className="text-[11px] font-semibold text-gray-500">
            Live Feed Aktif
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="w-2 h-2 rounded-full bg-emerald-300" />
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;
