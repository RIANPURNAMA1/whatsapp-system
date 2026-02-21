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

// Jika pakai Socket.io, import di sini:
// import { socket } from '../services/socket';

interface ChatWindowProps {
  sessionId: string;
  onBack?: () => void; // Tambahkan ini (? berarti opsional)
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ sessionId }) => {
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

  // --- 1. REAL-TIME LOGIC ---
  useEffect(() => {
    if (!sessionId || !selectedChat) return;

    /** * OPSI A: Menggunakan Socket.io (Sangat Direkomendasikan)
     * Aktifkan ini jika Backend kamu mengirim emit 'new_message'
     */
    /*
    socket.on('new_message', (data) => {
       if (data.chat_jid === selectedChat.jid) {
         addMessage(data); 
       }
    });
    return () => socket.off('new_message');
    */

    /** * OPSI B: Polling (Cek Database tiap 3 detik)
     * Gunakan ini jika belum ada WebSocket di backend.
     */
    const pollInterval = setInterval(async () => {
      try {
        // Ambil pesan terbaru saja (misal filter by timestamp terakhir)
        // Untuk sederhananya, kita panggil fetchMessages tanpa reset state
        await fetchMessages(sessionId, selectedChat.jid);
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000); // 3 detik sekali

    return () => clearInterval(pollInterval);
  }, [sessionId, selectedChat?.jid, fetchMessages]);

  // --- 2. LOAD DATA AWAL SAAT CHAT DIPILIH ---
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
        // Jika user sedang di bawah, otomatis scroll saat pesan masuk
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

    // Infinite Scroll (Load More)
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

        addMessage(newMessage); // Update UI Instan
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
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0B141A] border-l border-[#222d34]">
        {/* Icon Container dengan gradasi halus agar terlihat modern */}
        <div className="w-32 h-32 bg-[#202C33] rounded-full flex items-center justify-center shadow-2xl mb-8 relative">
          <div className="absolute inset-0 rounded-full bg-[#00a884] opacity-5 animate-ping" />
          <svg
            className="w-16 h-16 text-[#00a884]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </div>

        {/* Text Branding */}
        <h2 className="text-[#E9EDEF] text-3xl font-bold tracking-tight">
          Ke Satu <span className="text-[#00a884]">Pintu</span>
        </h2>

        <div className="max-w-xs text-center mt-4 space-y-2">
          <p className="text-[#8696A0] text-sm leading-relaxed">
            Hubungkan interaksi Anda dalam satu kendali terpusat.
          </p>
          <div className="h-[1px] w-12 bg-[#313D45] mx-auto my-4" />
        </div>

        {/* Footer Info (Optional) */}
        <div className="absolute bottom-10 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 text-[#41525d] text-xs">
            <svg
              className="w-3.5 h-3.5 opacity-60"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            </svg>
            <span className="tracking-wide">
              Developed by{" "}
              <span className="text-[#8696A0] font-medium">
                PT Indonesia Sukses Mendunia
              </span>
            </span>
          </div>

          <p className="text-[10px] text-[#41525d]/70 uppercase tracking-[0.2em]">
            Official Enterprise Partner
          </p>
        </div>
      </div>
    );
  }

  const displayName = getDisplayName(selectedChat);

  return (
    <div className="flex-1 flex flex-col bg-[#0B141A] relative overflow-hidden">
      {/* Header */}
      <div className="bg-[#202C33] px-4 py-2.5 flex items-center gap-3 border-b border-[#111B21] z-10">
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
          <p className="text-[#8696A0] text-xs truncate">Online</p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 text-[#8696A0] hover:text-white">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-[#8696A0] hover:text-white">
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
          backgroundImage: `linear-gradient(rgba(11, 20, 26, 0.95), rgba(11, 20, 26, 0.95)), url('/bg-chat.png')`,
          backgroundSize: "400px",
          backgroundRepeat: "repeat",
        }}
      >
        {isLoadingMessages && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-[#25D366]" />
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
                  <span className="bg-[#182229] text-[#8696A0] text-xs px-3 py-1 rounded-full">
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

      {/* Button Scroll ke Bawah */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 right-6 w-10 h-10 bg-[#202C33] rounded-full shadow-lg flex items-center justify-center text-[#8696A0] border border-[#2A3942] z-10 hover:text-white"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      )}

      {/* Input Area */}
      <div className="bg-[#202C33] flex flex-col border-t border-[#111B21]">
        {replyTo && (
          <div className="px-4 py-2 flex items-center gap-3 bg-[#1e272d] border-l-4 border-[#25D366]">
            <div className="flex-1 truncate">
              <p className="text-[#25D366] text-xs font-bold">
                {Number(replyTo.is_from_me) === 1
                  ? "Anda"
                  : replyTo.sender_name}
              </p>
              <p className="text-[#8696A0] text-xs truncate">
                {replyTo.content}
              </p>
            </div>
            <button onClick={() => setReplyTo(null)}>
              <X className="w-4 h-4 text-[#8696A0]" />
            </button>
          </div>
        )}

        <div className="px-3 py-2.5 flex items-end gap-2">
          <button className="p-2 text-[#8696A0] hover:text-white">
            <Smile />
          </button>
          <button
            className="p-2 text-[#8696A0] hover:text-white"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip />
          </button>
          <input ref={fileInputRef} type="file" className="hidden" />

          <div className="flex-1 bg-[#2A3942] rounded-xl overflow-hidden">
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
              className="w-full bg-transparent text-[#E9EDEF] px-4 py-3 outline-none resize-none text-sm min-h-[44px]"
              rows={1}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className="w-10 h-10 bg-[#00A884] rounded-full flex items-center justify-center text-white hover:bg-[#00BD96] disabled:opacity-50 transition-all"
          >
            {isSending ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <Send className="w-5 h-5 ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ message, showAvatar, onReply }: any) => {
  const isFromMe = Number(message.is_from_me) === 1;
  return (
    <div
      className={`flex items-end gap-2 mb-1 ${isFromMe ? "justify-end" : "justify-start"}`}
    >
      {showAvatar && <Avatar name={message.sender_name} size="sm" />}
      <div
        className={`group relative max-w-[75%] px-2 py-1.5 rounded-lg shadow-sm ${
          isFromMe
            ? "bg-[#005C4B] rounded-tr-none"
            : "bg-[#202C33] rounded-tl-none"
        }`}
      >
        <button
          onClick={onReply}
          className="absolute top-1 right-1 p-1 bg-[#202C33] rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <Reply className="w-3 h-3 text-[#8696A0]" />
        </button>
        {message.quoted_content && (
          <div className="bg-[rgba(0,0,0,0.2)] border-l-4 border-[#25D366] p-2 rounded mb-1 text-xs">
            <p className="text-[#25D366] font-bold">Dikutip</p>
            <p className="text-[#8696A0] line-clamp-2 italic">
              {message.quoted_content}
            </p>
          </div>
        )}
        <p className="text-[#E9EDEF] text-[14.2px] leading-relaxed whitespace-pre-wrap break-words px-1">
          {message.content}
        </p>
        <div className="flex items-center justify-end gap-1.5 mt-0.5 h-4">
          <span className="text-[#8696A0] text-[10px] tabular-nums">
            {formatMessageTime(message.timestamp)}
          </span>
          {isFromMe && (
            <span
              className={`text-[10px] ${message.status === "read" ? "text-[#53BDEB]" : "text-[#8696A0]"}`}
            >
              {message.status === "read" ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
