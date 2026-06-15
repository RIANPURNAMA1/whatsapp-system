import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSettings } from "../context/SettingsContext";
import {
  Search,
  MoreVertical,
  Smile,
  Paperclip,
  Send,
  X,
  Reply,
  ChevronDown,
  Loader2,
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  File,
  Phone,
  Tag,
  Clock,
  MessageSquare,
  Info,
} from "lucide-react";
import useStore from "../store/useStore";
import Avatar from "./Avatar";
import {
  getDisplayName,
  formatMessageTime,
  formatDateSeparator,
  isDifferentDay,
  isGroupJid,
  formatLastSeen,
} from "../utils/helpers";
import { messageApi, chatApi } from "../services/api";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { getSocket } from "../services/socket";
import { FormattedMessage } from "./ui/FormattedMessage";

interface ChatWindowProps {
  sessionId: string;
  onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  sessionId,
  onBack,
}) => {
  const {
    selectedChat,
    messages,
    isLoadingMessages,
    hasMoreMessages,
    replyTo,
    fetchMessages,
    setReplyTo,
    resetUnread,
    addMessage,
    updateChat,
    presences,
  } = useStore();

  const { settings } = useSettings();

  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const getPhoneNumber = (jid: string) => {
    if (!jid) return "-";
    return jid.split('@')[0] || "-";
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);
  const userScrolledUpRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const scrollRAFRef = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewCaption, setPreviewCaption] = useState("");
  const [previewType, setPreviewType] = useState<"image" | "video" | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = containerRef.current;
    if (!el) return;
    if (scrollRAFRef.current) cancelAnimationFrame(scrollRAFRef.current);
    scrollRAFRef.current = requestAnimationFrame(() => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? "smooth" : "instant",
      });
      setShowScrollBtn(false);
      isNearBottomRef.current = true;
      userScrolledUpRef.current = false;
    });
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    isNearBottomRef.current = distanceFromBottom < 80;
    userScrolledUpRef.current = distanceFromBottom > 150;

    if (scrollRAFRef.current) return;
    scrollRAFRef.current = requestAnimationFrame(() => {
      scrollRAFRef.current = null;
      setShowScrollBtn(distanceFromBottom > 300);
    });

    if (scrollTop < 50 && hasMoreMessages && !isLoadingMore && selectedChat) {
      setIsLoadingMore(true);
      const prevHeight = scrollHeight;
      fetchMessages(sessionId, selectedChat.jid, true).then(() => {
        setIsLoadingMore(false);
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight - prevHeight;
          }
        });
      });
    }
  }, [hasMoreMessages, isLoadingMore, selectedChat, sessionId, fetchMessages]);

  const handleUserScroll = useCallback(() => {
    if (scrollRAFRef.current) {
      cancelAnimationFrame(scrollRAFRef.current);
      scrollRAFRef.current = null;
    }
    handleScroll();
  }, [handleScroll]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleUserScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleUserScroll);
  }, [handleUserScroll]);

  useEffect(() => {
    if (!sessionId || !selectedChat) return;
    const fetchAndScroll = async () => {
      try {
        const prevHeight = containerRef.current?.scrollHeight || 0;
        await fetchMessages(sessionId, selectedChat.jid);
        if (isNearBottomRef.current && containerRef.current) {
          const newHeight = containerRef.current.scrollHeight;
          if (newHeight > prevHeight) {
            scrollToBottom(true);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };
    fetchAndScroll();
    const pollMs = settings.autoRefresh ? 2000 : parseInt(settings.refreshInterval, 10) * 1000;
    const pollInterval = setInterval(fetchAndScroll, pollMs);
    return () => clearInterval(pollInterval);
  }, [sessionId, selectedChat?.jid, fetchMessages, settings.autoRefresh, settings.refreshInterval, scrollToBottom]);

  useEffect(() => {
    if (selectedChat && sessionId) {
      isInitialLoadRef.current = true;
      isNearBottomRef.current = true;
      userScrolledUpRef.current = false;
      fetchMessages(sessionId, selectedChat.jid).then(() => {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
          isInitialLoadRef.current = false;
        });
      });
      resetUnread(selectedChat.jid);
      chatApi.markRead(sessionId, selectedChat.jid).catch(() => {});
    }
  }, [selectedChat?.jid, sessionId, fetchMessages, resetUnread]);

  useEffect(() => {
    if (!sessionId || !selectedChat) return;
    const socket = getSocket();
    const handleNewMessage = (msg: any) => {
      if (msg.chat_jid?.toLowerCase()?.trim() !== selectedChat.jid?.toLowerCase()?.trim()) return;
      addMessage(msg);
      if (isNearBottomRef.current) {
        requestAnimationFrame(() => {
          const el = containerRef.current;
          if (el) {
            el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
          }
        });
      }
    };
    socket.on(`message:new:${sessionId}`, handleNewMessage);
    return () => {
      socket.off(`message:new:${sessionId}`, handleNewMessage);
    };
  }, [sessionId, selectedChat?.jid, addMessage]);

  const handleSend = async () => {
    if (!inputText.trim() || !selectedChat || isSending) return;
    const text = inputText.trim();
    const chatJid = selectedChat.jid;
    setIsSending(true);
    setInputText("");
    setReplyTo(null);
    try {
      const response = await messageApi.sendText(sessionId, chatJid, text, replyTo?.message_id);
      if (response.success) {
        const newMessage = {
          ...response.data,
          chat_jid: chatJid,
          content: text,
          is_from_me: 1,
          timestamp: new Date().toISOString(),
          status: "sent",
        };
        addMessage(newMessage);
        updateChat(chatJid, {
          last_message: text,
          last_message_time: newMessage.timestamp,
          last_message_from: "me",
        });
        requestAnimationFrame(() => {
          const el = containerRef.current;
          if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        });
      }
    } catch (err) {
      toast.error("Gagal mengirim pesan");
      setInputText(text);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setPreviewFile(file);
      setPreviewUrl(url);
      setPreviewType(file.type.startsWith("video/") ? "video" : "image");
    } else {
      handleSendMedia(file, "document", file.name);
    }
  };

  const handleSendMedia = async (file: File, type: string, caption: string) => {
    if (!selectedChat || !sessionId) return;
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    addMessage({
      message_id: tempId,
      chat_jid: selectedChat.jid,
      content: caption || file.name,
      is_from_me: 1,
      timestamp: new Date().toISOString(),
      status: "pending",
      message_type: type,
      media_url: null,
    } as any);

    try {
      const response = await messageApi.sendMedia(sessionId, selectedChat.jid, file, type, caption);
      if (response.success) {
        toast.success("File dikirim");
        fetchMessages(sessionId, selectedChat.jid);
        scrollToBottom(true);
      }
    } catch (err) {
      toast.error("Gagal mengirim file");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendPreview = async () => {
    if (!previewFile || !selectedChat) return;
    const file = previewFile;
    const cap = previewCaption;
    const type = file.type.startsWith("video/") ? "video" : "image";
    cancelPreview();
    await handleSendMedia(file, type, cap);
  };

  const cancelPreview = () => {
    setPreviewFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewCaption("");
    setPreviewType(null);
  };

  if (!selectedChat) {
    return <WelcomeScreen />;
  }

  const rawDisplayName = getDisplayName(selectedChat);
  const displayName = rawDisplayName.includes('@') ? "Potential Lead" : rawDisplayName;
  const presence = selectedChat ? presences[selectedChat.jid] : null;
  const isOnline = presence?.presence === 'available' || presence?.presence === 'composing';
  const isTyping = presence?.presence === 'composing';

  return (
    <div className="flex-1 flex h-full w-full min-w-0 relative overflow-hidden">
      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden" style={{ backgroundColor: "#F0F2F5" }}>
      {/* HEADER */}
      <div className="flex-none h-[56px] bg-white px-3 flex items-center gap-2.5 border-b z-20" style={{ borderColor: "#E4E6EB" }}>
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="md:hidden p-1.5 rounded-lg"
          style={{ color: "#65676B" }}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <Avatar
          name={displayName}
          imageUrl={selectedChat.profile_pic_url}
          size="sm"
          isGroup={isGroupJid(selectedChat.jid)}
          className="w-[36px] h-[36px]"
        />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[14px] truncate" style={{ color: "#050505" }}>
            {displayName}
          </p>
          <p className="text-[11px] truncate" style={{ color: "#8C939D" }}>
            {selectedChat.phone_number ? `+${selectedChat.phone_number}` : `+${getPhoneNumber(selectedChat.jid)}`}
          </p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: isOnline ? "#31A24C" : "#BCC0C4" }} />
            <p className="text-[10px] font-medium truncate" style={{ color: "#65676B" }}>
              {isTyping ? "Mengetik..." : isOnline ? "Online" : presence?.lastSeen ? `Terakhir dilihat ${formatLastSeen(presence.lastSeen)}` : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" style={{ color: "#65676B" }}>
            <Search className="w-[18px] h-[18px]" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg"
            style={{ color: "#65676B" }}
            onClick={() => setShowInfo(!showInfo)}
          >
            <Info className="w-[18px] h-[18px]" />
          </Button>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-3 py-3 overscroll-behavior-contain"
        style={{ backgroundColor: "#F0F2F5", scrollBehavior: "smooth" }}
      >
        {isLoadingMessages && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin w-7 h-7" style={{ color: "#1877F2" }} />
          </div>
        ) : (
          <>
            {isLoadingMore && (
              <div className="flex justify-center py-3">
                <Loader2 className="animate-spin w-4 h-4" style={{ color: "#1877F2" }} />
              </div>
            )}
            {messages.map((msg, index) => (
              <React.Fragment key={msg.message_id || index}>
                {(!messages[index - 1] ||
                  isDifferentDay(messages[index - 1].timestamp, msg.timestamp)) && (
                  <div className="flex justify-center my-3">
                    <span className="text-[11px] px-3 py-1 rounded-full font-medium" style={{ backgroundColor: "#E4E6EB", color: "#65676B" }}>
                      {formatDateSeparator(msg.timestamp)}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  isGroup={isGroupJid(selectedChat.jid)}
                  onReply={() => setReplyTo(msg)}
                />
              </React.Fragment>
            ))}
          </>
        )}
      </div>

      {/* SCROLL TO BOTTOM */}
      {showScrollBtn && (
        <Button
          onClick={() => scrollToBottom()}
          variant="secondary"
          size="icon"
          className="absolute bottom-24 right-5 w-9 h-9 bg-white rounded-full shadow-lg border z-30"
          style={{ borderColor: "#E4E6EB", color: "#65676B" }}
        >
          <ChevronDown className="w-[18px] h-[18px]" />
        </Button>
      )}

      {/* INPUT AREA */}
      <div className="flex-none bg-white flex flex-col border-t" style={{ borderColor: "#E4E6EB" }}>
        {replyTo && (
          <div className="mx-3 mt-3 px-3 py-2 flex items-center gap-3 rounded-lg" style={{ backgroundColor: "#E7F3FF" }}>
            <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: "#1877F2" }} />
            <div className="flex-1 truncate">
              <p className="text-[11px] font-semibold" style={{ color: "#1877F2" }}>
                {Number(replyTo.is_from_me) === 1
                  ? "Anda"
                  : (replyTo.sender_name?.includes('@') ? "Lead" : replyTo.sender_name)}
              </p>
              <p className="text-[11px] truncate italic" style={{ color: "#65676B" }}>
                {replyTo.content}
              </p>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1 rounded hover:bg-black/5" style={{ color: "#65676B" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="px-3 py-2.5 flex items-end gap-1.5">
          <button className="p-2 rounded-lg hover:bg-[#F2F3F5] transition-colors shrink-0" style={{ color: "#65676B" }}>
            <Smile className="w-[20px] h-[20px]" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg hover:bg-[#F2F3F5] transition-colors shrink-0"
            style={{ color: "#65676B" }}
          >
            <Paperclip className="w-[20px] h-[20px]" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex-1 min-w-0 rounded-2xl px-4 py-1.5" style={{ backgroundColor: "#F0F2F5" }}>
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setInputText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ketik pesan..."
              className="w-full bg-transparent outline-none resize-none text-[14px] min-h-[36px] max-h-[120px]"
              style={{ color: "#050505" }}
              rows={1}
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
              <Send className="w-[18px] h-[18px] text-white" />
            )}
          </button>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {previewUrl && (
        <div className="absolute inset-0 z-[100] bg-white flex flex-col">
          <div className="flex items-center p-3 gap-3 border-b" style={{ backgroundColor: "#F8F9FA", borderColor: "#E4E6EB" }}>
            <button onClick={cancelPreview} className="p-1 rounded-lg hover:bg-[#F2F3F5]" style={{ color: "#65676B" }}>
              <X className="w-5 h-5" />
            </button>
            <span className="font-semibold text-[14px]" style={{ color: "#050505" }}>Preview</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden" style={{ backgroundColor: "#F0F2F5" }}>
            {previewType === "video" ? (
              <video src={previewUrl} controls className="max-w-full max-h-full rounded-lg shadow-lg" />
            ) : (
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain shadow-lg rounded-lg" />
            )}
          </div>
          <div className="p-3 flex items-center gap-2.5 border-t" style={{ borderColor: "#E4E6EB" }}>
            <input
              className="flex-1 rounded-lg px-4 py-2.5 outline-none text-[13px]"
              style={{ backgroundColor: "#F0F2F5", color: "#050505" }}
              placeholder="Tambahkan keterangan..."
              value={previewCaption}
              onChange={(e) => setPreviewCaption(e.target.value)}
            />
            <button
              onClick={handleSendPreview}
              className="w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#1877F2" }}
            >
              <Send className="w-[18px] h-[18px] text-white" />
            </button>
          </div>
        </div>
      )}
      </div>

      {/* CONTACT INFO PANEL */}
      {showInfo && selectedChat && (
        <ContactInfoPanel
          chat={selectedChat}
          displayName={displayName}
          phoneNumber={selectedChat.phone_number || getPhoneNumber(selectedChat.jid)}
          isOnline={isOnline}
          isTyping={isTyping}
          presence={presence}
          onClose={() => setShowInfo(false)}
        />
      )}
    </div>
  );
};

const WelcomeScreen = () => (
  <div className="flex-1 flex flex-col items-center justify-center h-full p-8 text-center" style={{ backgroundColor: "#F0F2F5" }}>
    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: "#E7F3FF" }}>
      <ImageIcon className="w-10 h-10" style={{ color: "#1877F2" }} />
    </div>
    <h2 className="text-xl font-bold tracking-tight" style={{ color: "#050505" }}>
      SATU <span style={{ color: "#1877F2" }}>PINTU</span>
    </h2>
    <p className="text-[13px] mt-3 max-w-xs font-medium leading-relaxed" style={{ color: "#65676B" }}>
      Pilih pesan masuk untuk mulai berinteraksi dengan Leads Anda secara real-time.
    </p>
  </div>
);

const MessageBubble = ({ message, isGroup, onReply }: any) => {
  const isFromMe = Number(message.is_from_me) === 1;
  const BASE_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

  const getMediaUrl = (path: string) => {
    if (!path) return "";
    return path.startsWith("http") ? path : `${BASE_URL}${path}`;
  };

  return (
    <div className={`flex items-end gap-1.5 mb-1.5 ${isFromMe ? "justify-end" : "justify-start"}`}>
      {!isFromMe && isGroup && (
        <div className="mb-1">
          <Avatar name={message.sender_name?.includes('@') ? "Lead" : message.sender_name} size="sm" className="w-5 h-5 text-[8px]" />
        </div>
      )}

      <div
        className={`group relative w-[75%] md:w-[65%] overflow-hidden ${
          isFromMe
            ? "rounded-2xl rounded-br-sm"
            : "rounded-2xl rounded-bl-sm"
        } ${
          message.message_type === "image" ? "p-1" : "px-4 py-2.5"
        }`}
        style={{
          backgroundColor: isFromMe ? "#1877F2" : "#FFFFFF",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <button
          onClick={onReply}
          className={`p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm ${
            isFromMe ? "text-white" : ""
          }`}
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

        {message.message_type === "image" && message.media_url && (
          <img
            src={getMediaUrl(message.media_url)}
            className="max-h-[260px] w-full object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(getMediaUrl(message.media_url), "_blank")}
          />
        )}

        {message.message_type === "document" && (
          <div
            className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-colors"
            style={{ backgroundColor: isFromMe ? "rgba(255,255,255,0.12)" : "#F0F2F5" }}
            onClick={() => window.open(getMediaUrl(message.media_url), "_blank")}
          >
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: isFromMe ? "rgba(255,255,255,0.2)" : "#E7F3FF" }}>
              <FileText className="w-4 h-4" style={{ color: isFromMe ? "#FFFFFF" : "#1877F2" }} />
            </div>
            <span className="text-[13px] font-medium truncate" style={{ color: isFromMe ? "#FFFFFF" : "#050505" }}>
              {message.content || "Dokumen File"}
            </span>
          </div>
        )}

        <div className="mt-0.5">
          <div className="text-[14px] leading-[1.55] whitespace-pre-wrap break-words overflow-hidden" style={{ color: isFromMe ? "#FFFFFF" : "#050505", wordBreak: "break-word" }}>
            <FormattedMessage text={message.caption || message.content} isFromMe={isFromMe} />
          </div>
          <div className="flex items-center justify-end gap-1 mt-1 h-3">
            <span className="text-[10px] font-medium leading-none" style={{ color: isFromMe ? "rgba(255,255,255,0.65)" : "#8C939D" }}>
              {formatMessageTime(message.timestamp)}
            </span>
            {isFromMe && (
              <span className="text-white/70 text-[9px] leading-none">
                {message.status === "read" ? (
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                    <path d="M1 5.5L4 8.5L13 1" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 5.5L10 8.5L13 5.5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                  </svg>
                ) : (
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                    <path d="M1 5.5L4 8.5L13 1" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Contact Info Panel ----
const ContactInfoPanel = ({ chat, displayName, phoneNumber, isOnline, isTyping, presence, onClose }: any) => {
  const formatDate = (ts: string | null) => {
    if (!ts) return "-";
    return new Date(ts).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="w-80 flex-shrink-0 border-l bg-white overflow-y-auto flex flex-col" style={{ borderColor: "#E4E6EB" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[56px] border-b shrink-0" style={{ borderColor: "#E4E6EB" }}>
        <h3 className="text-[13px] font-semibold" style={{ color: "#050505" }}>Info Kontak</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[#F2F3F5] transition-colors"
          style={{ color: "#65676B" }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Section */}
      <div className="flex flex-col items-center py-6 px-4 border-b" style={{ borderColor: "#E4E6EB" }}>
        <Avatar
          name={displayName}
          imageUrl={chat.profile_pic_url}
          size="xl"
          isGroup={isGroupJid(chat.jid)}
          className="w-[72px] h-[72px] mb-3"
        />
        <h2 className="text-[15px] font-bold text-center leading-tight" style={{ color: "#050505" }}>
          {displayName}
        </h2>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: isOnline ? "#31A24C" : "#BCC0C4" }} />
          <span className="text-[11px] font-medium" style={{ color: "#65676B" }}>
            {isTyping ? "Mengetik..." : isOnline ? "Online" : presence?.lastSeen ? `Terakhir dilihat ${formatLastSeen(presence.lastSeen)}` : "Offline"}
          </span>
        </div>
      </div>

      {/* Detail Info */}
      <div className="px-4 py-3 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#65676B" }}>
          Detail Kontak
        </p>

        {/* Phone */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ backgroundColor: "#F0F2F5" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#E7F3FF" }}>
            <Phone className="w-4 h-4" style={{ color: "#1877F2" }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium" style={{ color: "#65676B" }}>Nomor Telepon</p>
            <p className="text-[13px] font-semibold truncate" style={{ color: "#050505" }}>+{phoneNumber}</p>
          </div>
        </div>

        {/* JID */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ backgroundColor: "#F0F2F5" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#FFF0E0" }}>
            <Tag className="w-4 h-4" style={{ color: "#F5A623" }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium" style={{ color: "#65676B" }}>ID Chat</p>
            <p className="text-[13px] font-semibold truncate" style={{ color: "#050505" }}>{chat.jid}</p>
          </div>
        </div>

        {/* First seen / Created */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ backgroundColor: "#F0F2F5" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#E8F5E9" }}>
            <Clock className="w-4 h-4" style={{ color: "#31A24C" }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium" style={{ color: "#65676B" }}>Pertama Dilihat</p>
            <p className="text-[13px] font-semibold truncate" style={{ color: "#050505" }}>{formatDate(chat.created_at)}</p>
          </div>
        </div>

        {/* Terakhir Chat */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ backgroundColor: "#F0F2F5" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F3E8FF" }}>
            <MessageSquare className="w-4 h-4" style={{ color: "#8B5CF6" }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium" style={{ color: "#65676B" }}>Terakhir Chat</p>
            <p className="text-[13px] font-semibold truncate" style={{ color: "#050505" }}>{chat.last_message_time ? formatDate(chat.last_message_time) : "-"}</p>
          </div>
        </div>
      </div>

      {/* Labels */}
      {chat.labels && chat.labels.length > 0 && (
        <div className="px-4 py-3 border-t" style={{ borderColor: "#E4E6EB" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#65676B" }}>
            Label ({chat.labels.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {chat.labels.map((label: any) => (
              <span
                key={label.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{
                  backgroundColor: (label.color || "#1877F2") + "18",
                  color: label.color || "#1877F2",
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
