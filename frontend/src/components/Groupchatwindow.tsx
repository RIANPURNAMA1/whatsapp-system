// components/GroupChatWindow.tsx
// PERBAIKAN: Menampilkan nama grup yang sebenarnya

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Send,
  Loader2,
  X,
  ChevronDown,
  Users,
  Info,
  Paperclip,
  Smile,
  AlertCircle,
  Reply,
  FileText,
  Download,
  MapPin,
  Mic,
  Crown,
  ShieldCheck,
} from "lucide-react";
import Avatar from "./Avatar";
import {
  formatMessageTime,
  formatDateSeparator,
  isDifferentDay,
  getAvatarColor,
  formatMessagePreview,
} from "../utils/helpers";
import { groupApi } from "../services/Groupapi";
import type { GroupChat, GroupMessage, GroupParticipant } from "../types/Group";
import { getSocket } from "../services/socket";
import toast from "react-hot-toast";

interface GroupChatWindowProps {
  sessionId: string;
  group: GroupChat;
}

const GroupChatWindow: React.FC<GroupChatWindowProps> = ({
  sessionId,
  group,
}) => {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<GroupMessage | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [participants, setParticipants] = useState<GroupParticipant[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── PERBAIKAN: Logika nama grup yang lebih baik ──
  // Prioritas: name > display_name > group_subject > JID tanpa @g.us
  const displayName = 
    group.name?.trim() || 
    group.display_name?.trim() || 
    group.group_subject?.trim() || 
    group.jid?.replace('@g.us', '').replace('@c.us', '') || 
    'Grup WhatsApp';

  // ── Load pesan pertama kali ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setHasMore(true);
    setIsLoading(true);
    setReplyTo(null);
    setShowInfo(false);

    groupApi
      .getMessages(sessionId, group.jid)
      .then((data) => {
        if (!cancelled) {
          setMessages(data);
          setHasMore(data.length >= 40);
          setIsLoading(false);
          setTimeout(() => scrollToBottom("auto"), 80);
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });

    // Tandai dibaca
    groupApi.markRead(sessionId, group.jid).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [sessionId, group.jid]);

  // ── Terima pesan real-time via Socket.IO ────────────────────
  useEffect(() => {
    const socket = getSocket();

    const handleNewMessage = (msg: GroupMessage) => {
      if (msg.chat_jid !== group.jid) return;

      setMessages((prev) => {
        // Hindari duplikat
        if (prev.some((m) => m.message_id === msg.message_id)) return prev;
        return [...prev, msg];
      });

      // Scroll ke bawah kalau sudah di bawah
      const el = containerRef.current;
      if (el) {
        const nearBottom =
          el.scrollHeight - el.scrollTop - el.clientHeight < 200;
        if (nearBottom) setTimeout(() => scrollToBottom("smooth"), 60);
      }
    };

    socket.on(`message:new:${sessionId}`, handleNewMessage);
    return () => {
      socket.off(`message:new:${sessionId}`, handleNewMessage);
    };
  }, [sessionId, group.jid]);

  // ── Load lebih banyak pesan (scroll ke atas) ────────────────
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return;
    setIsLoadingMore(true);

    const oldestTimestamp = messages[0].timestamp;
    const prevHeight = containerRef.current?.scrollHeight ?? 0;

    try {
      const older = await groupApi.getMessages(
        sessionId,
        group.jid,
        oldestTimestamp
      );
      setMessages((prev) => [...older, ...prev]);
      setHasMore(older.length >= 40);

      // Pertahankan posisi scroll
      requestAnimationFrame(() => {
        const el = containerRef.current;
        if (el) {
          el.scrollTop = el.scrollHeight - prevHeight;
        }
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, messages, sessionId, group.jid]);

  // ── Handle scroll ───────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300);
    if (scrollTop < 80) loadMore();
  }, [loadMore]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setShowScrollBtn(false);
  };

  const handleSend = async () => {
  const text = inputText.trim();
  if (!text || isSending) return;

  const currentReply = replyTo;
  const originalText = text;
  const tempId = `temp-${Date.now()}`;

  // Pembuatan pesan sementara untuk Realtime UI
  const newMessage = {
    message_id: tempId,
    chat_jid: group.jid,
    from_jid: "me",
    sender_name: "Anda",
    content: text,
    message_type: "text",
    timestamp: Math.floor(Date.now() / 1000),
    is_from_me: 1,
    status: "pending",
    quoted_content: currentReply?.content || null,
    is_deleted: 0,
  } as unknown as GroupMessage;

  // Langsung tampilkan di layar
  setMessages((prev) => [...prev, newMessage]);
  
  setInputText("");
  setReplyTo(null);
  if (inputRef.current) inputRef.current.style.height = "auto";
  
  setTimeout(() => scrollToBottom("smooth"), 50);
  setIsSending(true);

  try {
    // Kirim ke API
    const response: any = await groupApi.sendMessage(
      sessionId,
      group.jid,
      originalText,
      currentReply?.message_id
    );

    // Update ID sementara jadi ID asli dari database
    setMessages((prev) =>
      prev.map((m) =>
        m.message_id === tempId 
          ? { 
              ...m, 
              // Mengambil ID dari berbagai kemungkinan struktur response
              message_id: response?.data?.message_id || response?.message_id || m.message_id, 
              status: "sent" 
            } 
          : m
      )
    );
  } catch (err: any) {
    toast.error(`Gagal mengirim: ${err.message}`);
    // Hapus pesan palsu jika gagal kirim
    setMessages((prev) => prev.filter((m) => m.message_id !== tempId));
    setInputText(originalText);
    setReplyTo(currentReply);
  } finally {
    setIsSending(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }
};

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  // ── Kirim media ─────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSending(true);
    try {
      await groupApi.sendMedia(sessionId, group.jid, file);
      toast.success("Media terkirim ke grup");
    } catch (err: any) {
      toast.error(`Gagal kirim media: ${err.message}`);
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Load anggota grup ────────────────────────────────────────
  const loadParticipants = async () => {
    if (participants.length > 0) return;
    setIsLoadingParticipants(true);
    try {
      const data = await groupApi.getParticipants(sessionId, group.jid);
      setParticipants(data);
    } catch {
      toast.error("Gagal memuat anggota");
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  const toggleInfo = () => {
    setShowInfo((v) => {
      if (!v) loadParticipants();
      return !v;
    });
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ────── Panel Chat ────── */}
      <div className="flex flex-col flex-1 bg-[#0B141A] min-w-0 overflow-hidden relative">
        {/* Header grup */}
        <div className="bg-[#202C33] px-4 py-2.5 flex items-center gap-3 border-b border-[#111B21] flex-shrink-0 z-10">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: getAvatarColor(group.jid) }}
          >
            {group.profile_pic_url ? (
              <img
                src={group.profile_pic_url}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <Users className="w-5 h-5 text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[#E9EDEF] font-medium text-[15px] truncate">
              {displayName}
            </p>
            <p className="text-[#8696A0] text-[11px] truncate">
              {group.participant_count
                ? `${group.participant_count} anggota`
                : "Grup WhatsApp"}
            </p>
          </div>

          <button
            onClick={toggleInfo}
            className={`p-2 rounded-full transition-all ${
              showInfo
                ? "bg-[#00a884] text-white"
                : "text-[#8696A0] hover:text-white hover:bg-[#2A3942]"
            }`}
            title="Info grup & anggota"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Area pesan */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar"
          style={{ backgroundColor: "#0B141A" }}
        >
          {isLoadingMore && (
            <div className="flex justify-center py-2">
              <Loader2 className="w-4 h-4 text-[#00a884] animate-spin" />
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-full gap-3">
              <Loader2 className="w-6 h-6 text-[#00a884] animate-spin" />
              <span className="text-[#8696A0] text-sm">Memuat pesan grup...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <AlertCircle className="w-10 h-10 text-[#3b4a54]" />
              <p className="text-[#8696A0] text-sm">
                Belum ada pesan di grup ini.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const prev = idx > 0 ? messages[idx - 1] : null;
              const showDate =
                !prev || isDifferentDay(prev.timestamp, msg.timestamp);
              // Tampilkan nama pengirim jika berbeda dari pesan sebelumnya
              const showSenderName =
                !msg.is_from_me &&
                (!prev ||
                  prev.from_jid !== msg.from_jid ||
                  (prev && isDifferentDay(prev.timestamp, msg.timestamp)));

              return (
                <React.Fragment key={msg.message_id || idx}>
                  {showDate && (
                    <div className="flex justify-center my-3">
                      <span className="bg-[#182229] text-[#8696A0] text-[11px] px-3 py-1 rounded-full">
                        {formatDateSeparator(msg.timestamp)}
                      </span>
                    </div>
                  )}
                  <GroupMessageBubble
                    message={msg}
                    showSenderName={showSenderName}
                    onReply={() => setReplyTo(msg)}
                  />
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Tombol scroll ke bawah */}
        {showScrollBtn && (
          <button
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-24 right-5 w-9 h-9 bg-[#202C33] hover:bg-[#2A3942] border border-[#3b4a54] rounded-full flex items-center justify-center text-[#8696A0] hover:text-white shadow-lg transition-all z-10"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}

        {/* Preview reply */}
        {replyTo && (
          <div className="bg-[#202C33] px-4 py-2 flex items-center gap-3 border-t border-[#2A3942] flex-shrink-0">
            <Reply className="w-4 h-4 text-[#00a884] flex-shrink-0" />
            <div className="flex-1 min-w-0 border-l-2 border-[#00a884] pl-2">
              <p className="text-[#00a884] text-[11px] font-semibold truncate">
                {replyTo.is_from_me
                  ? "Anda"
                  : replyTo.sender_name || replyTo.from_jid?.split("@")[0]}
              </p>
              <p className="text-[#8696A0] text-xs truncate">
                {replyTo.content ||
                  formatMessagePreview(replyTo.message_type, replyTo.content)}
              </p>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="text-[#8696A0] hover:text-white p-1 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="bg-[#202C33] px-3 py-2.5 flex items-end gap-2 flex-shrink-0 border-t border-[#111B21]">
          <button
            className="p-2 text-[#8696A0] hover:text-white transition-colors flex-shrink-0 mb-0.5"
            title="Emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-[#8696A0] hover:text-white transition-colors flex-shrink-0 mb-0.5"
            title="Lampirkan file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
          />

          <div className="flex-1 bg-[#2A3942] rounded-xl overflow-hidden">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Pesan ke ${displayName}...`}
              rows={1}
              className="w-full bg-transparent text-[#E9EDEF] placeholder-[#8696A0] px-4 py-3 outline-none resize-none text-sm leading-relaxed"
              style={{ maxHeight: "120px" }}
            />
          </div>

          {inputText.trim() ? (
            <button
              onClick={handleSend}
              disabled={isSending}
              className="w-10 h-10 bg-[#00a884] hover:bg-[#00BD96] disabled:opacity-50 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 shadow-sm"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white ml-0.5" />
              )}
            </button>
          ) : (
            <button className="w-10 h-10 bg-[#00a884] hover:bg-[#00BD96] rounded-full flex items-center justify-center flex-shrink-0 transition-all">
              <Mic className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* ────── Panel Info Grup (slide dari kanan) ────── */}
      {showInfo && (
        <div className="w-72 flex-shrink-0 flex flex-col bg-[#111B21] border-l border-[#1E2A30] overflow-hidden animate-slide-in-right">
          {/* Header panel info */}
          <div className="bg-[#202C33] px-4 py-3 flex items-center justify-between border-b border-[#1E2A30]">
            <span className="text-[#E9EDEF] text-sm font-semibold">
              Info Grup
            </span>
            <button
              onClick={() => setShowInfo(false)}
              className="p-1 text-[#8696A0] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
            {/* Avatar & Nama Grup */}
            <div className="flex flex-col items-center gap-3 py-2">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: getAvatarColor(group.jid) }}
              >
                {group.profile_pic_url ? (
                  <img
                    src={group.profile_pic_url}
                    alt={displayName}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <Users className="w-10 h-10 text-white" />
                )}
              </div>
              <div className="text-center">
                <p className="text-[#E9EDEF] font-semibold text-base">
                  {displayName}
                </p>
                {group.participant_count ? (
                  <p className="text-[#8696A0] text-xs mt-0.5">
                    {group.participant_count} anggota
                  </p>
                ) : null}
              </div>
            </div>

            {/* Deskripsi Grup */}
            {group.group_description && (
              <div className="bg-[#202C33] rounded-xl p-3">
                <p className="text-[#8696A0] text-[10px] uppercase tracking-wider font-semibold mb-1">
                  Deskripsi
                </p>
                <p className="text-[#E9EDEF] text-xs leading-relaxed">
                  {group.group_description}
                </p>
              </div>
            )}

            {/* Daftar Anggota */}
            <div>
              <p className="text-[#8696A0] text-[10px] uppercase tracking-wider font-semibold mb-2 px-1">
                Anggota Grup
              </p>

              {isLoadingParticipants ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 text-[#00a884] animate-spin" />
                </div>
              ) : participants.length === 0 ? (
                <p className="text-[#8696A0] text-xs text-center py-4">
                  Data anggota belum tersedia
                </p>
              ) : (
                <div className="space-y-1">
                  {participants.map((p) => (
                    <ParticipantItem key={p.jid} participant={p} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Bubble pesan dalam grup
// ─────────────────────────────────────────────
interface BubbleProps {
  message: GroupMessage;
  showSenderName: boolean;
  onReply: () => void;
}

const GroupMessageBubble: React.FC<BubbleProps> = ({
  message,
  showSenderName,
  onReply,
}) => {
  const isFromMe = message.is_from_me === 1;
  const [hover, setHover] = useState(false);

  // Bersihkan nama pengirim dari @lid, @c.us, @s.whatsapp.net
  const cleanName = (name: string) => {
    return name
      .replace(/@lid/g, '')
      .replace(/@c\.us/g, '')
      .replace(/@s\.whatsapp\.net/g, '')
      .trim();
  };

  const senderName = cleanName(
    message.sender_name ||
    message.from_jid?.split("@")[0] ||
    "Anggota"
  );

  const renderContent = () => {
    if (message.is_deleted) {
      return (
        <span className="italic text-[#8696A0] text-sm flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          Pesan telah dihapus
        </span>
      );
    }
    switch (message.message_type) {
      case "text":
        return (
          <p className="text-[#E9EDEF] text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );
      case "image":
        return (
          <div>
            <div className="bg-[#1E2A30] rounded-lg h-28 flex items-center justify-center w-44">
              <span className="text-3xl">🖼️</span>
            </div>
            {message.caption && (
              <p className="text-[#E9EDEF] text-xs mt-1">{message.caption}</p>
            )}
          </div>
        );
      case "video":
        return (
          <div>
            <div className="bg-[#1E2A30] rounded-lg h-28 flex items-center justify-center w-44">
              <span className="text-3xl">🎥</span>
            </div>
            {message.caption && (
              <p className="text-[#E9EDEF] text-xs mt-1">{message.caption}</p>
            )}
          </div>
        );
      case "audio":
        return (
          <div className="flex items-center gap-2 min-w-[180px]">
            <Mic className="w-4 h-4 text-[#00a884]" />
            <div className="flex-1 h-6 bg-[#1E2A30] rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-[#00a884]/40 rounded-full" />
            </div>
            <span className="text-[#8696A0] text-[11px]">🎵</span>
          </div>
        );
      case "document":
        return (
          <div className="flex items-center gap-2 bg-[#1E2A30] rounded-lg p-2.5 min-w-[180px]">
            <FileText className="w-7 h-7 text-[#00a884] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[#E9EDEF] text-xs font-medium truncate">
                {message.content}
              </p>
              <p className="text-[#8696A0] text-[10px]">Dokumen</p>
            </div>
            <Download className="w-3.5 h-3.5 text-[#8696A0]" />
          </div>
        );
      case "location":
        return (
          <div className="flex items-center gap-1.5 text-[#E9EDEF] text-sm">
            <MapPin className="w-4 h-4 text-[#00a884]" />
            <span>{message.content}</span>
          </div>
        );
      case "sticker":
        return <span className="text-4xl">😄</span>;
      default:
        return (
          <p className="text-[#8696A0] text-sm italic">
            {formatMessagePreview(message.message_type, message.content)}
          </p>
        );
    }
  };

  return (
    <div
      className={`flex items-end gap-2 group ${isFromMe ? "justify-end" : "justify-start"}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Avatar pengirim (bukan dari saya) */}
      {!isFromMe && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-1 text-white text-[11px] font-bold"
          style={{ backgroundColor: getAvatarColor(message.from_jid || "") }}
        >
          {message.sender_pic ? (
            <img
              src={message.sender_pic}
              alt={senderName}
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            senderName.substring(0, 1).toUpperCase()
          )}
        </div>
      )}

      {/* Tombol aksi hover */}
      {hover && (
        <div
          className={`flex items-center mb-1 ${isFromMe ? "order-first" : "order-last"}`}
        >
          <button
            onClick={onReply}
            className="p-1 text-[#8696A0] hover:text-white bg-[#202C33] rounded-full hover:bg-[#2A3942] transition-all"
            title="Balas pesan ini"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Bubble */}
      <div
        className={`
          max-w-[68%] lg:max-w-[58%] rounded-xl px-3 py-2 shadow-sm relative
          ${isFromMe
            ? "bg-[#005C4B] rounded-br-none"
            : "bg-[#202C33] rounded-bl-none"
          }
        `}
      >
        {/* Nama pengirim (warna unik per orang) */}
        {!isFromMe && showSenderName && (
          <p
            className="text-[12px] font-semibold mb-1 truncate"
            style={{ color: getAvatarColor(message.from_jid || "") }}
          >
            {senderName}
          </p>
        )}

        {/* Quoted message */}
        {message.quoted_content && (
          <div className="mb-2 pl-2 border-l-2 border-[#00a884] bg-black/20 rounded-r py-1 pr-2">
            <p className="text-[#00a884] text-[11px] font-medium">Dikutip</p>
            <p className="text-[#8696A0] text-[11px] truncate">
              {message.quoted_content}
            </p>
          </div>
        )}

        {/* Konten pesan */}
        {renderContent()}

        {/* Waktu & status */}
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[#8696A0] text-[10px]">
            {formatMessageTime(message.timestamp)}
          </span>
          {isFromMe && (
            <span
              className={`text-[10px] font-bold ${
                message.status === "read"
                  ? "text-[#53BDEB]"
                  : "text-[#8696A0]"
              }`}
            >
              {message.status === "pending"
                ? "⏳"
                : message.status === "sent"
                ? "✓"
                : message.status === "delivered"
                ? "✓✓"
                : message.status === "read"
                ? "✓✓"
                : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Item anggota grup
// ─────────────────────────────────────────────
const ParticipantItem: React.FC<{ participant: GroupParticipant }> = ({
  participant,
}) => {
  const name =
    participant.display_name ||
    participant.jid?.split("@")[0] ||
    "Anggota";

  return (
    <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#202C33] transition-colors">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: getAvatarColor(participant.jid) }}
      >
        {participant.profile_pic_url ? (
          <img
            src={participant.profile_pic_url}
            alt={name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          name.substring(0, 1).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#E9EDEF] text-xs font-medium truncate">{name}</p>
        <p className="text-[#8696A0] text-[10px] truncate">
          +{participant.jid?.split("@")[0]}
        </p>
      </div>
      {/* Badge role */}
      {participant.role !== "member" && (
        <span
          className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-semibold ${
            participant.role === "superadmin"
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-[#00a884]/20 text-[#00a884]"
          }`}
        >
          {participant.role === "superadmin" ? (
            <Crown className="w-2.5 h-2.5" />
          ) : (
            <ShieldCheck className="w-2.5 h-2.5" />
          )}
          {participant.role === "superadmin" ? "Owner" : "Admin"}
        </span>
      )}
    </div>
  );
};

export default GroupChatWindow;