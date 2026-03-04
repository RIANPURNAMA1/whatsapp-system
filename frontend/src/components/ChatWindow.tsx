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
  FileText,
  Image as ImageIcon,
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

  // --- LOGIC: Polling & Fetching ---
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

  useEffect(() => {
    if (selectedChat && sessionId) {
      fetchMessages(sessionId, selectedChat.jid);
      resetUnread(selectedChat.jid);
      chatApi.markRead(sessionId, selectedChat.jid).catch(() => {});
    }
  }, [selectedChat?.jid, sessionId, fetchMessages, resetUnread]);

  // --- LOGIC: Scrolling ---
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
      setShowScrollBtn(false);
    }
  }, []);

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

  // --- LOGIC: Sending Messages ---
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
        setTimeout(() => scrollToBottom("smooth"), 100);
      }
    } catch (err) {
      toast.error("Gagal mengirim pesan");
      setInputText(text);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // --- LOGIC: Media Handling ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewFile(file);
      setPreviewUrl(url);
    } else {
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
        toast.success("File dikirim");
        fetchMessages(sessionId, selectedChat.jid);
        scrollToBottom("smooth");
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
    cancelPreview();
    await handleSendMedia(file, "image", cap);
  };

  const cancelPreview = () => {
    setPreviewFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewCaption("");
  };

  if (!selectedChat) {
    return <WelcomeScreen />;
  }

  // --- CLEAN DISPLAY NAME ---
  const rawDisplayName = getDisplayName(selectedChat);
  const displayName = rawDisplayName.includes('@') ? "Potential Lead" : rawDisplayName;

  return (
    <div className="flex-1 flex flex-col bg-[#0B141A] h-[100dvh] w-full relative overflow-hidden">
      {/* HEADER */}
      <div className="flex-none h-[60px] md:h-[65px] bg-[#202C33] px-3 md:px-4 flex items-center gap-2 border-b border-[#111B21] z-20">
        <button
          onClick={onBack}
          className="md:hidden p-2 text-[#8696A0] hover:bg-[#2A3942] rounded-full mr-1"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <Avatar
          name={displayName}
          imageUrl={selectedChat.profile_pic_url}
          size="md"
          isGroup={isGroupJid(selectedChat.jid)}
        />

        <div className="flex-1 min-w-0 ml-2">
          <p className="text-[#E9EDEF] font-bold text-[15px] truncate">
            {displayName}
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse"></div>
            <p className="text-[#00a884] text-[10px] font-black uppercase tracking-[0.1em]">
              Online
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <button className="p-2 text-[#8696A0] hover:text-white">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-[#8696A0] hover:text-white">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-[#0B141A] relative"
        style={{
          backgroundImage: `linear-gradient(rgba(11, 20, 26, 0.95), rgba(11, 20, 26, 0.95)), url('/bg-chat.png')`,
          backgroundSize: "400px",
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
                  <span className="bg-[#182229] text-[#8696A0] text-[11px] px-3 py-1 rounded-md uppercase font-bold tracking-wider">
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
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* SCROLL TO BOTTOM BUTTON */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 right-6 w-10 h-10 bg-[#202C33] rounded-full shadow-lg flex items-center justify-center text-[#8696A0] border border-[#2A3942] z-30"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      )}

      {/* INPUT AREA */}
      <div className="flex-none bg-[#202C33] flex flex-col border-t border-[#111B21] pb-safe">
        {replyTo && (
          <div className="mx-2 mt-2 px-4 py-2 flex items-center gap-3 bg-[#1e272d] border-l-4 border-[#00a884] rounded-t-lg">
            <div className="flex-1 truncate">
              <p className="text-[#00a884] text-xs font-bold">
                {Number(replyTo.is_from_me) === 1
                  ? "Anda"
                  : (replyTo.sender_name?.includes('@') ? "Lead" : replyTo.sender_name)}
              </p>
              <p className="text-[#8696A0] text-xs truncate italic">
                {replyTo.content}
              </p>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1">
              <X className="w-4 h-4 text-[#8696A0]" />
            </button>
          </div>
        )}

        <div className="px-2 py-2 flex items-end gap-1 md:gap-2">
          <button className="p-2.5 text-[#8696A0] hover:text-white mb-1">
            <Smile className="w-6 h-6" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-[#8696A0] hover:text-white mb-1"
          >
            <Paperclip className="w-6 h-6" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ketik pesan"
              className="w-full bg-transparent text-[#E9EDEF] px-4 py-2.5 outline-none resize-none text-[15px] min-h-[42px] max-h-[120px]"
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

      {/* PREVIEW MODAL */}
      {previewUrl && (
        <div className="absolute inset-0 z-[100] bg-[#0B141A] flex flex-col animate-in fade-in zoom-in duration-200">
          <div className="flex items-center p-4 gap-4 bg-[#202C33]">
            <button
              onClick={cancelPreview}
              className="p-2 text-[#8696A0] hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <span className="text-[#E9EDEF] font-bold">Preview Media</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain shadow-2xl"
            />
          </div>
          <div className="bg-[#111B21] p-4 flex items-center gap-3">
            <input
              className="flex-1 bg-[#2A3942] text-[#E9EDEF] rounded-xl px-4 py-3 outline-none border border-transparent focus:border-[#00a884]"
              placeholder="Tambahkan keterangan..."
              value={previewCaption}
              onChange={(e) => setPreviewCaption(e.target.value)}
            />
            <button
              onClick={handleSendPreview}
              className="w-14 h-14 bg-[#00a884] rounded-full flex items-center justify-center text-[#111B21] shadow-lg"
            >
              <Send className="w-6 h-6 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const WelcomeScreen = () => (
  <div className="flex-1 flex flex-col items-center justify-center bg-[#0B141A] border-l border-[#222d34] h-full p-8 text-center">
    <div className="w-32 h-32 bg-[#202C33] rounded-full flex items-center justify-center shadow-2xl mb-8 border border-[#2A3942]">
      <ImageIcon className="w-16 h-16 text-[#00a884] opacity-40" />
    </div>
    <h2 className="text-[#E9EDEF] text-3xl font-black tracking-tighter">
      SATU <span className="text-[#00a884]">PINTU</span>
    </h2>
    <p className="text-[#8696A0] text-xs mt-4 max-w-xs font-medium leading-relaxed uppercase tracking-widest">
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
    <div
      className={`flex items-end gap-2 mb-1 ${isFromMe ? "justify-end" : "justify-start"}`}
    >
      {!isFromMe && isGroup && <Avatar name={message.sender_name?.includes('@') ? "Lead" : message.sender_name} size="sm" />}

      <div
        className={`group relative max-w-[85%] md:max-w-[70%] rounded-xl shadow-md ${
          isFromMe
            ? "bg-[#005C4B] rounded-tr-none"
            : "bg-[#202C33] rounded-tl-none border border-[#2A3942]/30"
        } ${message.message_type === "image" ? "p-1.5" : "px-3 py-2"}`}
      >
        <button
          onClick={onReply}
          className="absolute top-1 right-1 p-1 bg-[#202C33]/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-xl border border-[#313D45]"
        >
          <Reply className="w-3 h-3 text-[#8696A0]" />
        </button>

        {message.message_type === "image" && (
          <img
            src={getMediaUrl(message.media_url)}
            className="max-h-[350px] w-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() =>
              window.open(getMediaUrl(message.media_url), "_blank")
            }
          />
        )}

        {message.message_type === "document" && (
          <div
            className="flex items-center gap-3 bg-black/30 p-3 rounded-lg cursor-pointer hover:bg-black/40"
            onClick={() =>
              window.open(getMediaUrl(message.media_url), "_blank")
            }
          >
            <div className="p-2 bg-white/10 rounded-lg">
                <FileText className="w-5 h-5 text-[#E9EDEF]" />
            </div>
            <span className="text-[13px] font-medium truncate text-[#E9EDEF]">
              {message.content || "Dokumen File"}
            </span>
          </div>
        )}

        <div className="px-0.5 mt-1">
          <p className="text-[#E9EDEF] text-[14.5px] leading-[1.4] break-words whitespace-pre-wrap font-medium">
            {message.caption || message.content}
          </p>
          <div className="flex items-center justify-end gap-1.5 mt-1 h-3">
            <span className="text-[#8696A0] text-[9.5px] font-bold">
              {formatMessageTime(message.timestamp)}
            </span>
            {isFromMe && (
              <span
                className={
                  message.status === "read"
                    ? "text-[#53BDEB]"
                    : "text-[#8696A0]"
                }
              >
                {message.status === "read" ? "✓✓" : "✓"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};