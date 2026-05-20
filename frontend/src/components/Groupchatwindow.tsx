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
  Mic,
  Crown,
  ShieldCheck,
} from "lucide-react";
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
  onBack?: () => void;
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

  const displayName =
    group.name?.trim() ||
    group.display_name?.trim() ||
    group.group_subject?.trim() ||
    group.jid?.replace('@g.us', '').replace('@c.us', '') ||
    'Grup WhatsApp';

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

    groupApi.markRead(sessionId, group.jid).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [sessionId, group.jid]);

  useEffect(() => {
    const socket = getSocket();

    const handleNewMessage = (msg: any) => {
      if (msg.chat_jid !== group.jid) return;

      setMessages((prev) => {
        if (prev.some((m) => m.message_id === msg.message_id)) return prev;
        return [...prev, msg as GroupMessage];
      });

      const el = containerRef.current;
      if (el) {
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
        if (nearBottom) setTimeout(() => scrollToBottom("smooth"), 60);
      }
    };

    socket.on(`message:new:${sessionId}`, handleNewMessage);
    socket.on(`group:message:${sessionId}`, handleNewMessage);

    return () => {
      socket.off(`message:new:${sessionId}`, handleNewMessage);
      socket.off(`group:message:${sessionId}`, handleNewMessage);
    };
  }, [sessionId, group.jid]);

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

    setMessages((prev) => [...prev, newMessage]);

    setInputText("");
    setReplyTo(null);
    if (inputRef.current) inputRef.current.style.height = "auto";

    setTimeout(() => scrollToBottom("smooth"), 50);
    setIsSending(true);

    try {
      const response: any = await groupApi.sendMessage(
        sessionId,
        group.jid,
        originalText,
        currentReply?.message_id
      );

      setMessages((prev) =>
        prev.map((m) =>
          m.message_id === tempId
            ? {
                ...m,
                message_id: response?.data?.message_id || response?.message_id || m.message_id,
                status: "sent"
              }
            : m
        )
      );
    } catch (err: any) {
      toast.error(`Gagal mengirim: ${err.message}`);
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
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col h-full w-full relative overflow-hidden" style={{ backgroundColor: "#F0F2F5" }}>
        {/* Header */}
        <div className="bg-white px-3 h-[56px] flex items-center gap-2.5 border-b shrink-0 z-10" style={{ borderColor: "#E4E6EB" }}>
          <div
            className="w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: getAvatarColor(group.jid) }}
          >
            {group.profile_pic_url ? (
              <img src={group.profile_pic_url} alt={displayName} className="w-[36px] h-[36px] rounded-full object-cover" />
            ) : (
              <Users className="w-4 h-4 text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[14px] truncate" style={{ color: "#050505" }}>{displayName}</p>
            <p className="text-[10px] font-medium truncate" style={{ color: "#65676B" }}>
              {group.participant_count ? `${group.participant_count} anggota` : "Grup WhatsApp"}
            </p>
          </div>

          <button
            onClick={toggleInfo}
            className="h-8 w-8 p-0 rounded-lg flex items-center justify-center transition-all hover:bg-[#F2F3F5]"
            style={{ color: showInfo ? "#1877F2" : "#65676B" }}
            title="Info grup & anggota"
          >
            <Info className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-3 py-3"
          style={{ backgroundColor: "#F0F2F5" }}
        >
          {isLoadingMore && (
            <div className="flex justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#1877F2" }} />
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-full gap-2">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#1877F2" }} />
              <span className="text-[13px]" style={{ color: "#65676B" }}>Memuat pesan grup...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F0F2F5" }}>
                <AlertCircle className="w-6 h-6" style={{ color: "#BCC0C4" }} />
              </div>
              <p className="text-[13px]" style={{ color: "#65676B" }}>Belum ada pesan di grup ini.</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const prev = idx > 0 ? messages[idx - 1] : null;
              const showDate = !prev || isDifferentDay(prev.timestamp, msg.timestamp);
              const showSenderName = !msg.is_from_me && (!prev || prev.from_jid !== msg.from_jid || (prev && isDifferentDay(prev.timestamp, msg.timestamp)));

              return (
                <React.Fragment key={msg.message_id || idx}>
                  {showDate && (
                    <div className="flex justify-center my-3">
                      <span className="text-[11px] px-3 py-1 rounded-full font-medium" style={{ backgroundColor: "#E4E6EB", color: "#65676B" }}>
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

        {/* Scroll to bottom */}
        {showScrollBtn && (
          <button
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-24 right-5 w-9 h-9 bg-white rounded-full border flex items-center justify-center shadow-lg z-10 transition-all hover:bg-[#F2F3F5]"
            style={{ borderColor: "#E4E6EB", color: "#65676B" }}
          >
            <ChevronDown className="w-[18px] h-[18px]" />
          </button>
        )}

        {/* Reply preview */}
        {replyTo && (
          <div className="bg-white px-3 py-2 flex items-center gap-2.5 border-t shrink-0" style={{ borderColor: "#E4E6EB" }}>
            <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: "#1877F2" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold" style={{ color: "#1877F2" }}>
                {replyTo.is_from_me ? "Anda" : replyTo.sender_name || replyTo.from_jid?.split("@")[0]}
              </p>
              <p className="text-[11px] truncate" style={{ color: "#65676B" }}>
                {replyTo.content || formatMessagePreview(replyTo.message_type, replyTo.content)}
              </p>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1 rounded hover:bg-[#F2F3F5] shrink-0" style={{ color: "#65676B" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="bg-white px-3 py-2.5 flex items-end gap-1.5 shrink-0 border-t" style={{ borderColor: "#E4E6EB" }}>
          <button className="p-2 rounded-lg hover:bg-[#F2F3F5] transition-colors shrink-0" style={{ color: "#65676B" }} title="Emoji">
            <Smile className="w-[20px] h-[20px]" />
          </button>

          <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg hover:bg-[#F2F3F5] transition-colors shrink-0" style={{ color: "#65676B" }} title="Lampirkan file">
            <Paperclip className="w-[20px] h-[20px]" />
          </button>
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" onChange={handleFileSelect} />

          <div className="flex-1 min-w-0 rounded-2xl px-4 py-1.5" style={{ backgroundColor: "#F0F2F5" }}>
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Pesan ke ${displayName}...`}
              rows={1}
              className="w-full bg-transparent outline-none resize-none text-[14px] min-h-[36px] max-h-[120px]"
              style={{ color: "#050505" }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className="w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-50"
            style={{ backgroundColor: "#1877F2" }}
          >
            {isSending ? (
              <Loader2 className="animate-spin w-[18px] h-[18px] text-white" />
            ) : (
              <Send className="w-[18px] h-[18px] text-white ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="w-72 flex-shrink-0 flex flex-col bg-white border-l overflow-hidden" style={{ borderColor: "#E4E6EB" }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#E4E6EB" }}>
            <span className="text-[14px] font-semibold" style={{ color: "#050505" }}>Info Grup</span>
            <button onClick={() => setShowInfo(false)} className="p-1 rounded hover:bg-[#F2F3F5]" style={{ color: "#65676B" }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: getAvatarColor(group.jid) }}>
                {group.profile_pic_url ? (
                  <img src={group.profile_pic_url} alt={displayName} className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <Users className="w-10 h-10 text-white" />
                )}
              </div>
              <div className="text-center">
                <p className="font-semibold text-[15px]" style={{ color: "#050505" }}>{displayName}</p>
                {group.participant_count ? (
                  <p className="text-[12px] mt-0.5" style={{ color: "#65676B" }}>{group.participant_count} anggota</p>
                ) : null}
              </div>
            </div>

            {group.group_description && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#F0F2F5" }}>
                <p className="text-[9px] font-semibold uppercase mb-1" style={{ color: "#65676B" }}>Deskripsi</p>
                <p className="text-[12px] leading-relaxed" style={{ color: "#050505" }}>{group.group_description}</p>
              </div>
            )}

            <div>
              <p className="text-[9px] font-semibold uppercase mb-2 px-1" style={{ color: "#65676B" }}>Anggota Grup</p>

              {isLoadingParticipants ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#1877F2" }} />
                </div>
              ) : participants.length === 0 ? (
                <p className="text-[12px] text-center py-4" style={{ color: "#65676B" }}>Data anggota belum tersedia</p>
              ) : (
                <div className="space-y-0.5">
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

// ─── Group Message Bubble ─────────────────────────────────────────────
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
        <span className={`italic text-[13px] flex items-center gap-1 ${isFromMe ? 'text-white/70' : ''}`} style={{ color: isFromMe ? "rgba(255,255,255,0.7)" : "#8C939D" }}>
          <AlertCircle className="w-3 h-3" />
          Pesan telah dihapus
        </span>
      );
    }
    switch (message.message_type) {
      case "text":
        return (
          <p className="text-[14px] leading-[1.45] whitespace-pre-wrap break-words overflow-hidden" style={{ color: isFromMe ? "#FFFFFF" : "#050505", wordBreak: "break-word" }}>
            {message.content}
          </p>
        );
      default:
        return (
          <p className="text-[13px] italic" style={{ color: isFromMe ? "rgba(255,255,255,0.7)" : "#8C939D" }}>
            {formatMessagePreview(message.message_type, message.content)}
          </p>
        );
    }
  };

  return (
    <div className={`flex items-end gap-1.5 mb-1.5 group ${isFromMe ? "justify-end" : "justify-start"}`}>
      {/* Avatar pengirim */}
      {!isFromMe && (
        <div
          className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 mb-1 text-white text-[9px] font-bold"
          style={{ backgroundColor: getAvatarColor(message.from_jid || "") }}
        >
          {senderName.substring(0, 1).toUpperCase()}
        </div>
      )}

      {/* Bubble */}
      <div
        className={`relative max-w-[75%] md:max-w-[65%] overflow-hidden ${
          isFromMe ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm"
        } px-3.5 py-2`}
        style={{
          backgroundColor: isFromMe ? "#1877F2" : "#FFFFFF",
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        <button
          onClick={onReply}
          className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          style={{
            backgroundColor: isFromMe ? "rgba(255,255,255,0.2)" : "#E4E6EB",
            color: isFromMe ? "#FFFFFF" : "#65676B",
            position: "absolute",
            top: 0,
            right: 0,
          }}
        >
          <Reply className="w-2.5 h-2.5" />
        </button>

        {/* Nama pengirim */}
        {!isFromMe && showSenderName && (
          <p className="text-[12px] font-semibold mb-0.5 truncate pr-6" style={{ color: getAvatarColor(message.from_jid || "") }}>
            {senderName}
          </p>
        )}

        {/* Quoted message */}
        {message.quoted_content && (
          <div className="mb-1.5 pl-2 border-l-2 rounded-r py-1 pr-2" style={{ borderColor: isFromMe ? "rgba(255,255,255,0.5)" : "#1877F2", backgroundColor: isFromMe ? "rgba(255,255,255,0.1)" : "#F0F2F5" }}>
            <p className="text-[11px] font-medium" style={{ color: isFromMe ? "rgba(255,255,255,0.8)" : "#1877F2" }}>Dikutip</p>
            <p className="text-[11px] truncate" style={{ color: isFromMe ? "rgba(255,255,255,0.6)" : "#65676B" }}>
              {message.quoted_content}
            </p>
          </div>
        )}

        {/* Konten */}
        {renderContent()}

        {/* Waktu & status */}
        <div className="flex items-center justify-end gap-1 mt-0.5 h-3">
          <span className="text-[9px] font-medium" style={{ color: isFromMe ? "rgba(255,255,255,0.7)" : "#8C939D" }}>
            {formatMessageTime(message.timestamp)}
          </span>
          {isFromMe && (
            <span className="text-white/70 text-[9px] leading-none">
              {message.status === "pending" ? (
                <span style={{ color: "rgba(255,255,255,0.5)" }}>⏳</span>
              ) : (
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                  <path d="M1 5.5L4 8.5L13 1" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {message.status === "read" && (
                    <path d="M7 5.5L10 8.5L13 5.5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                  )}
                </svg>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Participant Item ────────────────────────────────────────────────
const ParticipantItem: React.FC<{ participant: GroupParticipant }> = ({
  participant,
}) => {
  const name =
    participant.display_name ||
    participant.jid?.split("@")[0] ||
    "Anggota";

  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors hover:bg-[#F2F3F5]">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: getAvatarColor(participant.jid) }}
      >
        {participant.profile_pic_url ? (
          <img src={participant.profile_pic_url} alt={name} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          name.substring(0, 1).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate" style={{ color: "#050505" }}>{name}</p>
        <p className="text-[10px] truncate" style={{ color: "#65676B" }}>
          +{participant.jid?.split("@")[0]}
        </p>
      </div>
      {participant.role !== "member" && (
        <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md font-semibold shrink-0" style={{
          backgroundColor: participant.role === "superadmin" ? "#FFF3E0" : "#E7F3FF",
          color: participant.role === "superadmin" ? "#F5A623" : "#1877F2",
        }}>
          {participant.role === "superadmin" ? <Crown className="w-2.5 h-2.5" /> : <ShieldCheck className="w-2.5 h-2.5" />}
          {participant.role === "superadmin" ? "Owner" : "Admin"}
        </span>
      )}
    </div>
  );
};

export default GroupChatWindow;
