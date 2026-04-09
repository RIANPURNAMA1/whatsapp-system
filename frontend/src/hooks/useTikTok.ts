import { useState, useEffect, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL;

interface TikTokComment {
  id: number;
  comment_id: string;
  user_id: string;
  username: string;
  content: string;
  video_id: string;
  video_title: string;
  status: "new" | "replied" | "spam" | "deleted";
  created_at: string;
}

interface TikTokMessage {
  id: number;
  user_id: string;
  username: string;
  message: string;
  direction: "inbound" | "outbound";
  created_at: string;
}

interface TikTokLead {
  id: number;
  user_id: string;
  username: string;
  message: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  created_at: string;
}

interface TikTokRule {
  id: string;
  keyword: string;
  reply: string;
  is_active: boolean;
  match_type: "exact" | "contains" | "starts_with";
}

interface TikTokStats {
  comments: { total: number; new_comments: number; replied_comments: number };
  messages: { total: number; received: number; sent: number };
  leads: { total: number; new_leads: number; converted: number };
}

export function useTikTok() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<TikTokComment[]>([]);
  const [messages, setMessages] = useState<TikTokMessage[]>([]);
  const [leads, setLeads] = useState<TikTokLead[]>([]);
  const [rules, setRules] = useState<TikTokRule[]>([]);
  const [stats, setStats] = useState<TikTokStats | null>(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  const getToken = () => localStorage.getItem("token");

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }, []);

  // Fetch comments
  const fetchComments = useCallback(async (page = 1, status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (status) params.append("status", status);
      
      const data = await fetchWithAuth(`/tiktok/comments?${params}`);
      setComments(data.data || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  // Reply to comment
  const replyToComment = useCallback(async (commentId: number, message: string) => {
    try {
      await fetchWithAuth(`/tiktok/comments/${commentId}/reply`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      await fetchComments();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [fetchWithAuth, fetchComments]);

  // Update comment status
  const updateCommentStatus = useCallback(async (commentId: number, status: string) => {
    try {
      await fetchWithAuth(`/tiktok/comments/${commentId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      await fetchComments();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [fetchWithAuth, fetchComments]);

  // Fetch messages
  const fetchMessages = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`/tiktok/messages?page=${page}`);
      setMessages(data.data || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  // Send message
  const sendMessage = useCallback(async (userId: string, message: string) => {
    try {
      await fetchWithAuth("/tiktok/messages/send", {
        method: "POST",
        body: JSON.stringify({ userId, message }),
      });
      await fetchMessages();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [fetchWithAuth, fetchMessages]);

  // Fetch leads
  const fetchLeads = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithAuth(`/tiktok/leads?page=${page}`);
      setLeads(data.data || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  // Update lead status
  const updateLeadStatus = useCallback(async (leadId: number, status: string) => {
    try {
      await fetchWithAuth(`/tiktok/leads/${leadId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      await fetchLeads();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [fetchWithAuth, fetchLeads]);

  // Fetch rules
  const fetchRules = useCallback(async () => {
    try {
      const data = await fetchWithAuth("/tiktok/rules");
      setRules(data.data || []);
    } catch (err: any) {
      console.error("Error fetching rules:", err);
    }
  }, [fetchWithAuth]);

  // Create rule
  const createRule = useCallback(async (keyword: string, reply: string, isActive = true) => {
    try {
      await fetchWithAuth("/tiktok/rules", {
        method: "POST",
        body: JSON.stringify({ keyword, reply, isActive }),
      });
      await fetchRules();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [fetchWithAuth, fetchRules]);

  // Toggle rule
  const toggleRule = useCallback(async (ruleId: string) => {
    try {
      await fetchWithAuth(`/tiktok/rules/${ruleId}/toggle`, { method: "PUT" });
      await fetchRules();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [fetchWithAuth, fetchRules]);

  // Delete rule
  const deleteRule = useCallback(async (ruleId: string) => {
    try {
      await fetchWithAuth(`/tiktok/rules/${ruleId}`, { method: "DELETE" });
      await fetchRules();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [fetchWithAuth, fetchRules]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await fetchWithAuth("/tiktok/analytics");
      setStats(data.data);
    } catch (err: any) {
      console.error("Error fetching stats:", err);
    }
  }, [fetchWithAuth]);

  return {
    loading,
    error,
    comments,
    messages,
    leads,
    rules,
    stats,
    pagination,
    fetchComments,
    replyToComment,
    updateCommentStatus,
    fetchMessages,
    sendMessage,
    fetchLeads,
    updateLeadStatus,
    fetchRules,
    createRule,
    toggleRule,
    deleteRule,
    fetchStats,
  };
}

export default useTikTok;
