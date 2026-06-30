import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Loader2, X, ChevronDown, Users, Paperclip, Smile,
  AlertCircle, Crown, ShieldCheck,
} from "lucide-react";
import {
  formatMessageTime, formatDateSeparator, isDifferentDay, getAvatarColor, formatMessagePreview,
} from "../utils/helpers";
import { groupApi } from "../services/Groupapi";
import type { GroupChat, GroupMessage, GroupParticipant } from "../types/Group";
import { getSocket } from "../services/socket";
import toast from "react-hot-toast";
import { FormattedMessage } from "./ui/FormattedMessage";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";

import {
  MessageInput, ConversationHeader, Avatar, InfoButton,
} from "@chatscope/chat-ui-kit-react";

interface GroupChatWindowProps {
  sessionId: string;
  group: GroupChat;
  onBack?: () => void;
}

const cleanName = (name: string) =>
  name.replace(/@lid/g, '').replace(/@c\.us/g, '').replace(/@s\.whatsapp\.net/g, '').trim();

const GroupChatWindow: React.FC<GroupChatWindowProps> = ({ sessionId, group }) => {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<GroupMessage | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [participants, setParticipants] = useState<GroupParticipant[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNearBottomRef = useRef(true);
  const userScrolledUpRef = useRef(false);
  const scrollRAFRef = useRef<number | null>(null);
  const isLoadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);

  const displayName = group.name?.trim() || group.display_name?.trim() || group.group_subject?.trim() || group.jid?.replace('@g.us', '').replace('@c.us', '') || 'Grup WhatsApp';

  isLoadingMoreRef.current = isLoadingMore;
  hasMoreRef.current = hasMore;

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

  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setHasMore(true);
    setIsLoading(true);
    setReplyTo(null);
    setShowInfo(false);

    groupApi.getMessages(sessionId, group.jid).then((data) => {
      if (!cancelled) {
        setMessages(data);
        setHasMore(data.length >= 40);
        setIsLoading(false);
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        });
      }
    }).catch(() => {
      if (!cancelled) setIsLoading(false);
    });

    groupApi.markRead(sessionId, group.jid).catch(() => {});
    return () => { cancelled = true; };
  }, [sessionId, group.jid]);

  useEffect(() => {
    if (!sessionId) return;
    const socket = getSocket();
    const handleNewMessage = (msg: any) => {
      if (msg.chat_jid !== group.jid) return;
      setMessages((prev) => {
        if (prev.some((m) => m.message_id === msg.message_id)) return prev;
        return [...prev, msg as GroupMessage];
      });
      if (isNearBottomRef.current) {
        requestAnimationFrame(() => {
          const el = containerRef.current;
          if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        });
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
    if (isLoadingMoreRef.current || !hasMoreRef.current || messages.length === 0) return;
    setIsLoadingMore(true);
    isLoadingMoreRef.current = true;
    const oldestTimestamp = messages[0].timestamp;
    const prevHeight = containerRef.current?.scrollHeight ?? 0;
    try {
      const older = await groupApi.getMessages(sessionId, group.jid, oldestTimestamp);
      setMessages((prev) => [...older, ...prev]);
      setHasMore(older.length >= 40);
      requestAnimationFrame(() => {
        const el = containerRef.current;
        if (el) el.scrollTop = el.scrollHeight - prevHeight;
      });
    } finally {
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  }, [messages, sessionId, group.jid]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    isNearBottomRef.current = distanceFromBottom < 80;
    userScrolledUpRef.current = distanceFromBottom > 150;

    if (scrollRAFRef.current) return;
    scrollRAFRef.current = requestAnimationFrame(() => {
      scrollRAFRef.current = null;
      setShowScrollBtn(distanceFromBottom > 300);
    });

    if (scrollTop < 80) loadMore();
  }, [loadMore]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isSending) return;
    const currentReply = replyTo;
    const originalText = text;
    const tempId = `temp-${Date.now()}`;

    setMessages((prev) => [...prev, {
      message_id: tempId, chat_jid: group.jid, from_jid: "me",
      sender_name: "Anda", content: text, message_type: "text",
      timestamp: Math.floor(Date.now() / 1000), is_from_me: 1,
      status: "pending", quoted_content: currentReply?.content || null, is_deleted: 0,
    } as unknown as GroupMessage]);

    setReplyTo(null);
    setIsSending(true);

    try {
      const response: any = await groupApi.sendMessage(sessionId, group.jid, originalText, currentReply?.message_id);
      setMessages((prev) => prev.map((m) =>
        m.message_id === tempId ? { ...m, message_id: response?.data?.message_id || response?.message_id || m.message_id, status: "sent" } : m
      ));
      scrollToBottom(true);
    } catch (err: any) {
      toast.error(`Gagal mengirim: ${err.message}`);
      setMessages((prev) => prev.filter((m) => m.message_id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, {
      message_id: tempId, chat_jid: group.jid, from_jid: "me",
      sender_name: "Anda", content: file.name, message_type: "document",
      timestamp: Math.floor(Date.now() / 1000), is_from_me: 1,
      status: "pending", quoted_content: null, is_deleted: 0,
    } as unknown as GroupMessage]);

    try {
      await groupApi.sendMedia(sessionId, group.jid, file);
      toast.success("File terkirim ke grup");
    } catch (err: any) {
      toast.error(`Gagal kirim file: ${err.message}`);
      setMessages((prev) => prev.filter((m) => m.message_id !== tempId));
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
    } catch { toast.error("Gagal memuat anggota"); }
    finally { setIsLoadingParticipants(false); }
  };

  const toggleInfo = () => {
    setShowInfo((v) => { if (!v) loadParticipants(); return !v; });
  };

  const groupedMessages: { sender: string; messages: GroupMessage[] }[] = [];
  messages.forEach((msg, idx) => {
    const senderKey = msg.is_from_me ? "me" : (msg.from_jid || "unknown");
    const prev = idx > 0 ? messages[idx - 1] : null;
    const prevKey = prev ? (prev.is_from_me ? "me" : (prev.from_jid || "unknown")) : null;
    const showDate = !prev || isDifferentDay(prev.timestamp, msg.timestamp);
    const sameSender = senderKey === prevKey && !showDate;

    if (sameSender && groupedMessages.length > 0) {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    } else {
      groupedMessages.push({ sender: senderKey, messages: [msg] });
    }
  });

  const renderMessageContent = (msg: GroupMessage, isFromMe: boolean) => {
    if (msg.is_deleted) {
      return <span style={{ fontStyle: "italic", color: isFromMe ? "rgba(255,255,255,0.7)" : "#8C939D", fontSize: "13px" }}>Pesan telah dihapus</span>;
    }
    if (msg.message_type === "text") {
      return <FormattedMessage text={msg.content} isFromMe={isFromMe} />;
    }
    return <span style={{ fontStyle: "italic", fontSize: "13px", color: isFromMe ? "rgba(255,255,255,0.7)" : "#8C939D" }}>{formatMessagePreview(msg.message_type, msg.content)}</span>;
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col h-full w-full relative overflow-hidden" style={{ backgroundColor: "#F0F2F5" }}>
        <div className="h-[56px] shrink-0">
          <ConversationHeader>
            <Avatar src={group.profile_pic_url || undefined} name={displayName} />
            <ConversationHeader.Content name={displayName} info={group.participant_count ? `${group.participant_count} anggota` : "Grup WhatsApp"} />
            <ConversationHeader.Actions>
              <div className="flex items-center gap-1 pr-1">
                <InfoButton onClick={toggleInfo} />
              </div>
            </ConversationHeader.Actions>
          </ConversationHeader>
        </div>

        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto overscroll-behavior-contain"
          style={{ backgroundColor: "#E8E9ED", scrollBehavior: "smooth" }}
        >
          {isLoadingMore && (
            <div className="flex justify-center py-3">
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
            <div className="px-4 py-3 space-y-1">
              {messages.map((msg, idx) => {
                const isFromMe = msg.is_from_me === 1;
                const prev = idx > 0 ? messages[idx - 1] : null;
                const showDate = !prev || isDifferentDay(prev.timestamp, msg.timestamp);
                const showSender = !isFromMe && (!prev || prev.from_jid !== msg.from_jid || isDifferentDay(prev.timestamp, msg.timestamp));
                const senderName = cleanName(msg.sender_name || msg.from_jid?.split("@")[0] || "Anggota");

                return (
                  <React.Fragment key={msg.message_id || idx}>
                    {showDate && (
                      <div className="flex justify-center my-3">
                        <span className="text-[11px] px-3 py-1 rounded-full font-medium" style={{ backgroundColor: "#E4E6EB", color: "#65676B" }}>
                          {formatDateSeparator(msg.timestamp)}
                        </span>
                      </div>
                    )}
                    <div className={`flex items-end gap-1.5 mb-1 group ${isFromMe ? "justify-end" : "justify-start"}`}>
                      {!isFromMe && (
                        <div
                          className="w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0 mb-1 text-white text-[10px] font-bold"
                          style={{ backgroundColor: getAvatarColor(msg.from_jid || "") }}
                        >
                          {senderName.substring(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div
                        className={`relative w-[75%] md:w-[65%] overflow-hidden ${
                          isFromMe ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm"
                        } px-4 py-2.5`}
                        style={{
                          backgroundColor: isFromMe ? "#1877F2" : "#FFFFFF",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        }}
                      >
                        {!isFromMe && showSender && (
                          <p className="text-[12px] font-semibold mb-0.5 truncate pr-6" style={{ color: getAvatarColor(msg.from_jid || "") }}>
                            {senderName}
                          </p>
                        )}

                        {msg.quoted_content && (
                          <div className="mb-1.5 pl-2 border-l-2 rounded-r py-1 pr-2" style={{
                            borderColor: isFromMe ? "rgba(255,255,255,0.5)" : "#1877F2",
                            backgroundColor: isFromMe ? "rgba(255,255,255,0.1)" : "#F0F2F5",
                          }}>
                            <p className="text-[11px] font-medium" style={{ color: isFromMe ? "rgba(255,255,255,0.8)" : "#1877F2" }}>Dikutip</p>
                            <p className="text-[11px] truncate" style={{ color: isFromMe ? "rgba(255,255,255,0.6)" : "#65676B" }}>{msg.quoted_content}</p>
                          </div>
                        )}

                        <div className="text-[14px] leading-[1.55] whitespace-pre-wrap break-words" style={{ color: isFromMe ? "#FFFFFF" : "#050505", wordBreak: "break-word" }}>
                          {renderMessageContent(msg, isFromMe)}
                        </div>

                        <div className="flex items-center justify-end gap-1 mt-1 h-3">
                          <span className="text-[10px] font-medium leading-none" style={{ color: isFromMe ? "rgba(255,255,255,0.65)" : "#8C939D" }}>
                            {formatMessageTime(msg.timestamp)}
                          </span>
                          {isFromMe && (
                            <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "10px", lineHeight: 1 }}>
                              {msg.status === "pending" ? "⏳" : (
                                <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                                  <path d="M1 5.5L4 8.5L13 1" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  {msg.status === "read" && <path d="M7 5.5L10 8.5L13 5.5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>}
                                </svg>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {showScrollBtn && (
          <button onClick={() => scrollToBottom()} className="absolute bottom-24 right-5 w-9 h-9 bg-white rounded-full border flex items-center justify-center shadow-lg z-10" style={{ borderColor: "#E4E6EB", color: "#65676B" }}>
            <ChevronDown className="w-[18px] h-[18px]" />
          </button>
        )}

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

        <div className="bg-white px-3 py-2.5 flex items-end gap-1.5 shrink-0 border-t" style={{ borderColor: "#E4E6EB" }}>
          <button className="p-2 rounded-lg hover:bg-[#F2F3F5] shrink-0" style={{ color: "#65676B" }} title="Emoji">
            <Smile className="w-[20px] h-[20px]" />
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg hover:bg-[#F2F3F5] shrink-0" style={{ color: "#65676B" }} title="Lampirkan file">
            <Paperclip className="w-[20px] h-[20px]" />
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />

          <div className="flex-1 min-w-0 rounded-2xl px-4 py-1.5" style={{ backgroundColor: "#F0F2F5" }}>
            <MessageInput
              placeholder={`Pesan ke ${displayName}...`}
              onSend={handleSend}
              autoFocus
              attachButton={false}
              sendButton={false}
            />
          </div>
        </div>
      </div>

      {showInfo && (
        <div className="w-72 flex-shrink-0 flex flex-col bg-white border-l overflow-hidden" style={{ borderColor: "#E4E6EB" }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "#E4E6EB" }}>
            <span className="text-[14px] font-semibold" style={{ color: "#050505" }}>Info Grup</span>
            <button onClick={() => setShowInfo(false)} className="p-1 rounded hover:bg-[#F2F3F5]" style={{ color: "#65676B" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
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
                {group.participant_count ? <p className="text-[12px] mt-0.5" style={{ color: "#65676B" }}>{group.participant_count} anggota</p> : null}
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
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "#1877F2" }} /></div>
              ) : participants.length === 0 ? (
                <p className="text-[12px] text-center py-4" style={{ color: "#65676B" }}>Data anggota belum tersedia</p>
              ) : (
                <div className="space-y-0.5">
                  {participants.map((p) => <ParticipantItem key={p.jid} participant={p} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ParticipantItem: React.FC<{ participant: GroupParticipant }> = ({ participant }) => {
  const name = participant.display_name || participant.jid?.split("@")[0] || "Anggota";
  const phoneDisplay = participant.phone_number
    ? `+${participant.phone_number}`
    : `+${participant.jid?.split("@")[0]}`;
  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors hover:bg-[#F2F3F5]">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: getAvatarColor(participant.jid) }}>
        {participant.profile_pic_url ? (
          <img src={participant.profile_pic_url} alt={name} className="w-8 h-8 rounded-full object-cover" />
        ) : name.substring(0, 1).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate" style={{ color: "#050505" }}>{name}</p>
        <p className="text-[10px] truncate" style={{ color: "#65676B" }}>{phoneDisplay}</p>
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
