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
  ArrowLeft, // Tambahkan ArrowLeft
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
  onBack?: () => void; // Prop untuk kembali ke daftar chat di mobile
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ sessionId, onBack }) => {
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

  // --- 1. REAL-TIME LOGIC (Polling) ---
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

  // --- 2. LOAD DATA AWAL ---
  useEffect(() => {
    if (selectedChat && sessionId) {
      fetchMessages(sessionId, selectedChat.jid);
      resetUnread(selectedChat.jid);
      chatApi.markRead(sessionId, selectedChat.jid).catch(() => {});
    }
  }, [selectedChat?.jid, sessionId, fetchMessages, resetUnread]);

  // --- 3. SCROLL AUTOMATIC ---
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

  // --- 4. KIRIM PESAN ---
  const handleSend = async () => {
    const state = useStore.getState();
    const currentChat = state.selectedChat;
    const currentReplyTo = state.replyTo;

    if (!inputText.trim() || !currentChat || isSending) return;

    const text = inputText.trim();
    const chatJid = currentChat.jid;

    setIsSending(true);
    setInputText("");
    setReplyTo(null);

    try {
      const response = await messageApi.sendText(
        sessionId,
        chatJid,
        text,
        currentReplyTo?.message_id,
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

  // --- EMPTY STATE ---
  if (!selectedChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0B141A] border-l border-[#222d34]">
        <div className="w-32 h-32 bg-[#202C33] rounded-full flex items-center justify-center shadow-2xl mb-8 relative">
          <div className="absolute inset-0 rounded-full bg-[#00a884] opacity-5 animate-ping" />
          <svg className="w-16 h-16 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <h2 className="text-[#E9EDEF] text-3xl font-bold tracking-tight">Ke Satu <span className="text-[#00a884]">Pintu</span></h2>
        <div className="max-w-xs text-center mt-4 space-y-2">
          <p className="text-[#8696A0] text-sm leading-relaxed">Hubungkan interaksi Anda dalam satu kendali terpusat.</p>
          <div className="h-[1px] w-12 bg-[#313D45] mx-auto my-4" />
        </div>
      </div>
    );
  }

  const displayName = getDisplayName(selectedChat);

  return (
    <div className="flex-1 flex flex-col bg-[#0B141A] relative overflow-hidden h-full w-full">
      {/* Header */}
      <div className="bg-[#202C33] px-2 md:px-4 py-2 flex items-center gap-1 md:gap-3 border-b border-[#111B21] z-20">
        
        {/* Tombol Back Mobile */}
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
        <div className="flex-1 min-w-0">
          <p className="text-[#E9EDEF] font-medium text-sm truncate">
            {displayName}
          </p>
          <p className="text-[#8696A0] text-xs truncate uppercase tracking-widest">Online</p>
        </div>
        <div className="flex items-center">
          <button className="p-2 text-[#8696A0] hover:text-white shrink-0">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-[#8696A0] hover:text-white shrink-0">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-[#0B141A]"
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
                isDifferentDay(messages[index - 1].timestamp, msg.timestamp)) && (
                <div className="flex justify-center my-4">
                  <span className="bg-[#182229] text-[#8696A0] text-[11px] px-3 py-1 rounded-full uppercase tracking-wider">
                    {formatDateSeparator(msg.timestamp)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={msg}
                showAvatar={isGroupJid(selectedChat.jid) && Number(msg.is_from_me) !== 1}
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
          className="absolute bottom-24 right-6 w-10 h-10 bg-[#202C33] rounded-full shadow-lg flex items-center justify-center text-[#8696A0] border border-[#2A3942] z-30 hover:text-white transition-all active:scale-90"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      )}

      {/* Input Area */}
      <div className="bg-[#202C33] flex flex-col border-t border-[#111B21] pb-safe">
        {replyTo && (
          <div className="px-4 py-2 flex items-center gap-3 bg-[#1e272d] border-l-4 border-[#00a884] animate-in slide-in-from-bottom-2">
            <div className="flex-1 truncate">
              <p className="text-[#00a884] text-xs font-bold">
                {Number(replyTo.is_from_me) === 1 ? "Anda" : replyTo.sender_name}
              </p>
              <p className="text-[#8696A0] text-xs truncate italic">{replyTo.content}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-[#2a3942] rounded-full">
              <X className="w-4 h-4 text-[#8696A0]" />
            </button>
          </div>
        )}

        <div className="px-2 md:px-3 py-2 flex items-end gap-1 md:gap-2">
          <button className="p-2 text-[#8696A0] hover:text-white shrink-0"><Smile /></button>
          <button className="p-2 text-[#8696A0] hover:text-white shrink-0" onClick={() => fileInputRef.current?.click()}><Paperclip /></button>
          <input ref={fileInputRef} type="file" className="hidden" />

          <div className="flex-1 bg-[#2A3942] rounded-xl overflow-hidden mb-1">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
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
            {isSending ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5 ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ message, showAvatar, onReply }: any) => {
  const isFromMe = Number(message.is_from_me) === 1;
  return (
    <div className={`flex items-end gap-2 mb-1 ${isFromMe ? "justify-end" : "justify-start animate-in fade-in slide-in-from-left-2"}`}>
      {showAvatar && <Avatar name={message.sender_name} size="sm" />}
      <div className={`group relative max-w-[85%] md:max-w-[75%] px-2.5 py-1.5 rounded-lg shadow-sm ${isFromMe ? "bg-[#005C4B] rounded-tr-none" : "bg-[#202C33] rounded-tl-none"}`}>
        <button onClick={onReply} className="absolute top-1 right-1 p-1 bg-[#202C33]/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Reply className="w-3 h-3 text-[#8696A0]" />
        </button>
        {message.quoted_content && (
          <div className="bg-black/20 border-l-4 border-[#00a884] p-2 rounded mb-1 text-[11px]">
            <p className="text-[#00a884] font-bold">Dikutip</p>
            <p className="text-[#8696A0] line-clamp-2 italic">{message.quoted_content}</p>
          </div>
        )}
        <p className="text-[#E9EDEF] text-[14.5px] leading-relaxed whitespace-pre-wrap break-words px-1">
          {message.content}
        </p>
        <div className="flex items-center justify-end gap-1 mt-0.5 h-4">
          <span className="text-[#8696A0] text-[9px] tabular-nums">
            {formatMessageTime(message.timestamp)}
          </span>
          {isFromMe && (
            <span className={`text-[12px] leading-none ${message.status === "read" ? "text-[#53BDEB]" : "text-[#8696A0]"}`}>
              {message.status === "read" ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};