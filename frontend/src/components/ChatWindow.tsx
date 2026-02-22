import React, { useEffect, useRef, useState, useCallback } from "react";
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
} from "lucide-react";
import useStore from "../store/useStore";
import Avatar from "./Avatar";
import {
  getDisplayName,
  formatMessageTime,
  formatDateSeparator,
  isDifferentDay,
  isGroupJid,
} from "../utils/helpers";
import { messageApi, chatApi } from "../services/api";
import toast from "react-hot-toast";

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
  } = useStore();

  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewCaption, setPreviewCaption] = useState("");
  // Polling logic
  useEffect(() => {
    if (!sessionId || !selectedChat) return;
    const pollInterval = setInterval(async () => {
      try {
        await fetchMessages(sessionId, selectedChat.jid);
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [sessionId, selectedChat?.jid, fetchMessages]);

  // Initial Load
  useEffect(() => {
    if (selectedChat && sessionId) {
      fetchMessages(sessionId, selectedChat.jid);
      resetUnread(selectedChat.jid);
      chatApi.markRead(sessionId, selectedChat.jid).catch(() => {});
    }
  }, [selectedChat?.jid, sessionId, fetchMessages, resetUnread]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
      setShowScrollBtn(false);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0 && !isLoadingMore) {
      const container = messagesContainerRef.current;
      if (container) {
        const isNearBottom =
          container.scrollHeight -
            container.scrollTop -
            container.clientHeight <
          400;
        if (isNearBottom) {
          setTimeout(() => scrollToBottom("smooth"), 100);
        }
      }
    }
  }, [messages.length, isLoadingMore, scrollToBottom]);

  // 1. Tambahkan fungsi handler untuk file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewFile(file);
      setPreviewUrl(url);
      setPreviewCaption(""); // Reset caption
    } else {
      // Jika bukan gambar (PDF/Doc), bisa langsung kirim atau buat preview berbeda
      handleSendMedia(file, "document", file.name);
    }
  };

  const handleSendMedia = async (file: File, type: string, caption: string) => {
    if (!selectedChat || !sessionId) return;

    setIsSending(true);
    try {
      const response = await messageApi.sendMedia(
        sessionId,
        selectedChat.jid,
        file,
        type,
        caption,
      );

      if (response.success) {
        toast.success(
          `${type === "image" ? "Gambar" : "File"} berhasil dikirim`,
        );
        // Refresh pesan agar yang baru dikirim muncul di chat
        fetchMessages(sessionId, selectedChat.jid);
        scrollToBottom("smooth");
      }
    } catch (err) {
      console.error("Error sending media:", err);
      toast.error("Gagal mengirim media");
    } finally {
      setIsSending(false);
    }
  };

 const handleSendPreview = async () => {
  if (!previewFile || !selectedChat || !sessionId) return;

  const fileToSend = previewFile;
  const caption = previewCaption;
  const chatJid = selectedChat.jid;

  cancelPreview(); // Tutup modal preview

  try {
    setIsSending(true);
    const response = await messageApi.sendMedia(
      sessionId,
      chatJid,
      fileToSend,
      "image",
      caption || fileToSend.name
    );

    if (response.success) {
      // --- TAMBAHKAN LOGIKA OPTIMISTIC UPDATE DI SINI ---
      const newMessage = {
        ...response.data, // Data dari backend (message_id, dll)
        chat_jid: chatJid,
        message_type: "image",
        content: caption || "Images",
        caption: caption,
        media_url: response.data.media_url, // URL yang baru disimpan di backend
        is_from_me: 1,
        timestamp: new Date().toISOString(),
        status: "sent",
      };

      addMessage(newMessage); // Tambah ke store agar langsung muncul di UI
      
      updateChat(chatJid, {
        last_message: "📷 Gambar",
        last_message_time: newMessage.timestamp,
        last_message_from: "me",
      });

      setTimeout(() => scrollToBottom("smooth"), 100);
    }
  } catch (err) {
    console.error("Gagal kirim gambar:", err);
    toast.error("Gagal mengirim gambar");
  } finally {
    setIsSending(false);
  }
};

  const cancelPreview = () => {
    setPreviewFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewCaption("");
  };

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300);

    if (scrollTop < 50 && hasMoreMessages && !isLoadingMore && selectedChat) {
      const loadMore = async () => {
        setIsLoadingMore(true);
        const prevHeight = scrollHeight;
        await fetchMessages(sessionId, selectedChat.jid, true);
        setIsLoadingMore(false);
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight - prevHeight;
        });
      };
      loadMore();
    }
  }, [hasMoreMessages, isLoadingMore, selectedChat, sessionId, fetchMessages]);

  const handleSend = async () => {
    if (!inputText.trim() || !selectedChat || isSending) return;
    const text = inputText.trim();
    const chatJid = selectedChat.jid;
    setIsSending(true);
    setInputText("");
    setReplyTo(null);

    try {
      const response = await messageApi.sendText(
        sessionId,
        chatJid,
        text,
        replyTo?.message_id,
      );

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
        scrollToBottom("smooth");
      }
    } catch (err) {
      toast.error("Gagal mengirim pesan");
      setInputText(text);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!selectedChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0B141A] border-l border-[#222d34] h-full">
        <div className="w-32 h-32 bg-[#202C33] rounded-full flex items-center justify-center shadow-2xl mb-8 relative">
          <div className="absolute inset-0 rounded-full bg-[#00a884] opacity-5 animate-ping" />
          <svg
            className="w-16 h-16 text-[#00a884]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </div>
        <h2 className="text-[#E9EDEF] text-3xl font-bold tracking-tight text-center px-4">
          Ke Satu <span className="text-[#00a884]">Pintu</span>
        </h2>
        <p className="text-[#8696A0] text-sm mt-4 text-center px-6">
          Hubungkan interaksi Anda dalam satu kendali terpusat.
        </p>
      </div>
    );
  }

  const displayName = getDisplayName(selectedChat);

  return (
    /* Perbaikan: Menggunakan h-[100dvh] agar pas di layar mobile browser */
    <div className="flex-1 flex flex-col bg-[#0B141A] relative overflow-hidden h-[100dvh] w-full">
      {/* Header: Ditambahkan flex-none agar tidak mengecil saat chat penuh */}
      <div className="flex-none bg-[#202C33] px-2 md:px-4 py-2 flex items-center gap-1 md:gap-3 border-b border-[#111B21] z-20 min-h-[60px]">
        <button
          onClick={onBack}
          className="md:hidden p-2 text-[#8696A0] hover:bg-[#2A3942] rounded-full transition-colors shrink-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <Avatar
          name={displayName}
          imageUrl={selectedChat.profile_pic_url}
          size="md"
          isGroup={isGroupJid(selectedChat.jid)}
        />

        <div className="flex-1 min-w-0 ml-1">
          <p className="text-[#E9EDEF] font-medium text-[15px] truncate leading-tight">
            {displayName}
          </p>
          <p className="text-[#8696A0] text-[11px] truncate uppercase tracking-widest mt-0.5 font-semibold">
            Online
          </p>
        </div>

        <div className="flex items-center shrink-0">
          <button className="p-2 text-[#8696A0] hover:text-white transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-[#8696A0] hover:text-white transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Messages: flex-1 mengambil sisa ruang antara header dan input */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-[#0B141A] relative scroll-smooth"
        style={{
          backgroundImage: `linear-gradient(rgba(11, 20, 26, 0.96), rgba(11, 20, 26, 0.96)), url('/bg-chat.png')`,
          backgroundSize: "400px",
          backgroundRepeat: "repeat",
        }}
      >
        {isLoadingMessages && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-[#00a884]" />
          </div>
        ) : (
          messages.map((msg, index) => (
            <React.Fragment key={msg.message_id || index}>
              {(!messages[index - 1] ||
                isDifferentDay(
                  messages[index - 1].timestamp,
                  msg.timestamp,
                )) && (
                <div className="flex justify-center my-4">
                  <span className="bg-[#182229] text-[#8696A0] text-[11px] px-3 py-1 rounded-full uppercase tracking-wider">
                    {formatDateSeparator(msg.timestamp)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={msg}
                showAvatar={
                  isGroupJid(selectedChat.jid) && Number(msg.is_from_me) !== 1
                }
                onReply={() => setReplyTo(msg)}
              />
            </React.Fragment>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Button Scroll Ke Bawah */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-28 right-6 w-10 h-10 bg-[#202C33] rounded-full shadow-lg flex items-center justify-center text-[#8696A0] border border-[#2A3942] z-30 hover:text-white transition-all active:scale-90"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      )}

      {/* Input Area: flex-none agar tetap di posisi bawah */}
      <div className="flex-none bg-[#202C33] flex flex-col border-t border-[#111B21] pb-safe">
        {replyTo && (
          <div className="px-4 py-2 flex items-center gap-3 bg-[#1e272d] border-l-4 border-[#00a884] animate-in slide-in-from-bottom-2">
            <div className="flex-1 truncate">
              <p className="text-[#00a884] text-xs font-bold">
                {Number(replyTo.is_from_me) === 1
                  ? "Anda"
                  : replyTo.sender_name}
              </p>
              <p className="text-[#8696A0] text-xs truncate italic">
                {replyTo.content}
              </p>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="p-1 hover:bg-[#2a3942] rounded-full"
            >
              <X className="w-4 h-4 text-[#8696A0]" />
            </button>
          </div>
        )}

        <div className="px-2 md:px-3 py-2 flex items-end gap-1 md:gap-2">
          <button className="p-2 text-[#8696A0] hover:text-white shrink-0">
            <Smile className="w-6 h-6" />
          </button>
          <button
            className="p-2 text-[#8696A0] hover:text-white shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-6 h-6" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*, .pdf, .doc, .docx, .xls, .xlsx" // Batasi tipe file jika perlu
            onChange={handleFileChange} // <--- Hubungkan ke fungsi baru
          />

          <div className="flex-1 bg-[#2A3942] rounded-xl overflow-hidden mb-1">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan"
              className="w-full bg-transparent text-[#E9EDEF] px-4 py-2.5 outline-none resize-none text-[15px] min-h-[40px] max-h-[120px]"
              rows={1}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className="w-11 h-11 bg-[#00a884] rounded-full flex items-center justify-center text-[#111B21] hover:bg-[#00bd96] disabled:opacity-50 transition-all shrink-0 mb-1"
          >
            {isSending ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <Send className="w-5 h-5 ml-0.5" />
            )}
          </button>
        </div>
      </div>
      {/* MODAL PREVIEW GAMBAR (ALA WHATSAPP) */}
      {previewUrl && (
        <div className="absolute inset-0 z-[100] bg-[#0B141A] flex flex-col animate-in fade-in zoom-in duration-200">
          {/* Header Preview */}
          <div className="flex items-center p-4 gap-4 bg-[#202C33]">
            <button
              onClick={cancelPreview}
              className="p-2 text-[#8696A0] hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <span className="text-[#E9EDEF] font-medium">Preview Gambar</span>
          </div>

          {/* Area Gambar */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain shadow-2xl"
            />
          </div>

          {/* Input Caption & Tombol Kirim */}
          <div className="bg-[#111B21] p-4 flex flex-col gap-4">
            <div className="flex items-center gap-3 bg-[#2A3942] rounded-xl px-4 py-2">
              <textarea
                placeholder="Tambahkan keterangan..."
                className="flex-1 bg-transparent text-[#E9EDEF] outline-none resize-none text-[15px] py-1"
                rows={1}
                value={previewCaption}
                onChange={(e) => setPreviewCaption(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex justify-end items-center">
              <button
                onClick={handleSendPreview}
                disabled={isSending}
                className="w-14 h-14 bg-[#00a884] rounded-full flex items-center justify-center text-[#111B21] shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                {isSending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Send className="w-6 h-6 ml-1" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const MessageBubble = ({ message, showAvatar, onReply }: any) => {
  const isFromMe = Number(message.is_from_me) === 1;

  // 1. Ambil URL Base dari ENV Vite
  // Kita hapus '/api' jika ada, karena kita butuh akses ke folder /uploads
  const BASE_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

  const isImage = message.message_type === "image";
  const isDocument = message.message_type === "document";

  // 2. Fungsi helper untuk format URL Media
  const getMediaUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    // Gabungkan URL socket (backend) dengan path uploads
    return `${BASE_URL}${path}`;
  };

  return (
    <div
      className={`flex items-end gap-2 mb-1 ${
        isFromMe
          ? "justify-end"
          : "justify-start animate-in fade-in slide-in-from-left-2"
      }`}
    >
      {showAvatar && <Avatar name={message.sender_name} size="sm" />}

      <div
        className={`group relative max-w-[85%] md:max-w-[75%] rounded-lg shadow-sm ${
          isFromMe
            ? "bg-[#005C4B] rounded-tr-none"
            : "bg-[#202C33] rounded-tl-none"
        } ${isImage ? "p-1" : "px-2.5 py-1.5"}`}
      >
        <button
          onClick={onReply}
          className="absolute top-1 right-1 p-1 bg-[#202C33]/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <Reply className="w-3 h-3 text-[#8696A0]" />
        </button>

        {message.quoted_content && (
          <div className="bg-black/20 border-l-4 border-[#00a884] p-2 rounded mb-1 text-[11px]">
            <p className="text-[#00a884] font-bold">Dikutip</p>
            <p className="text-[#8696A0] line-clamp-2 italic">
              {message.quoted_content}
            </p>
          </div>
        )}

        {/* TAMPILAN JIKA GAMBAR */}
        {isImage && (
          <div className="relative mb-1 overflow-hidden rounded-md">
            <img
              src={getMediaUrl(message.media_url)}
              alt="Sent Media"
              className="max-h-[300px] w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() =>
                window.open(getMediaUrl(message.media_url), "_blank")
              }
              onError={(e: any) => {
                e.target.onerror = null;
                e.target.src =
                  "https://placehold.co/400x300?text=Gambar+Rusak/Proses";
              }}
            />
          </div>
        )}

        {/* TAMPILAN JIKA DOKUMEN */}
        {isDocument && (
          <div
            className="flex items-center gap-3 bg-[#111B21]/50 p-3 rounded-md mb-1 cursor-pointer"
            onClick={() =>
              window.open(getMediaUrl(message.media_url), "_blank")
            }
          >
            <div className="bg-[#182229] p-2 rounded">
              <Paperclip className="w-5 h-5 text-[#8696A0]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#E9EDEF] text-[13px] truncate">
                {message.content || "Document"}
              </p>
            </div>
          </div>
        )}

        {/* TEKS PESAN / CAPTION */}
        {/* Filter: Jangan tampilkan teks jika isinya cuma "Images" atau "Foto" */}
        {/* TEKS PESAN / CAPTION */}
        {!isDocument && (
          <div className="px-1">
            {/* 1. Tampilkan Caption jika ada (untuk gambar) */}
            {message.caption &&
              !["Images", "Foto", "[Foto]"].includes(message.caption) && (
                <p className="text-[#E9EDEF] text-[14.5px] leading-relaxed whitespace-pre-wrap break-words">
                  {message.caption}
                </p>
              )}

            {/* 2. Tampilkan Content jika bukan caption dan bukan placeholder "Images" */}
            {message.content &&
              message.content !== message.caption &&
              !["Images", "Foto", "[Foto]"].includes(message.content) && (
                <p className="text-[#E9EDEF] text-[14.5px] leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}
          </div>
        )}

        <div
          className={`flex items-center justify-end gap-1 mt-0.5 h-4 ${isImage ? "px-1" : ""}`}
        >
          <span className="text-[#8696A0] text-[9px] tabular-nums">
            {formatMessageTime(message.timestamp)}
          </span>
          {isFromMe && (
            <span
              className={`text-[12px] ${message.status === "read" ? "text-[#53BDEB]" : "text-[#8696A0]"}`}
            >
              {message.status === "read" ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
