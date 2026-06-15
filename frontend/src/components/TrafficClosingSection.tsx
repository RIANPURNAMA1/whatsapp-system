import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import useStore from "../store/useStore";
import {
  Clock, Calendar, RefreshCw, BarChart3, Users,
  MessageSquare, Timer, TrendingUp, Filter, Settings,
  KeyRound, Smartphone, Plus, Trash2, Edit, Save, X,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const PERIODS = ["Hari ini", "Kemarin", "Minggu", "Bulan", "Custom"];

interface TrafficClosingProps {
  onBack?: () => void;
  onNavigate?: (tab: string) => void;
}

export const TrafficClosingSection: React.FC<TrafficClosingProps> = ({ onBack, onNavigate }) => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("Hari ini");
  const [sessionId, setSessionId] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ total: 0, rataRataHari: 0, totalDevice: [] });
  const [isLoading, setIsLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/sessions`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (res.data.success) setSessions(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { period };
      if (sessionId !== "all") params.sessionId = sessionId;
      if (period === "Custom" && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/closing/traffic`,
        {
          params,
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );
      if (res.data.success) {
        setData(res.data.data || []);
        setPage(1);
        setSummary(res.data.summary || { total: 0, rataRataHari: 0, rataRata: 0, rataRataLabel: '0', tercepat: 0, tercepatLabel: '0', terlama: 0, terlamaLabel: '0', unit: 'hari', totalDevice: [] });
      }
    } catch (err: any) {
      console.error("Failed to fetch closing traffic:", err);
    } finally {
      setIsLoading(false);
    }
  }, [period, sessionId, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (ts: string) => {
    if (!ts) return "-";
    const d = new Date(ts);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeBucket = (hari: number) => {
    if (hari < 1) return "0-24 jam";
    if (hari < 3) return "1-3 hari";
    if (hari < 7) return "3-7 hari";
    if (hari < 14) return "1-2 minggu";
    return "> 2 minggu";
  };

  const bucketColors: Record<string, string> = {
    "0-24 jam": "bg-[#1591DC] text-[#1877F2]",
    "1-3 hari": "bg-[#E7F3FF] text-[#1877F2]",
    "3-7 hari": "bg-[#FFF8E7] text-[#F5A623]",
    "1-2 minggu": "bg-[#FFF8E7] text-[#F5A623]",
    "> 2 minggu": "bg-[#FFEBEE] text-red-500",
  };

  const buckets = ["0-24 jam", "1-3 hari", "3-7 hari", "1-2 minggu", "> 2 minggu"];
  const bucketCount: Record<string, number> = {};
  buckets.forEach(b => bucketCount[b] = 0);
  data.forEach(d => {
    const b = getTimeBucket(d.durasiHari);
    bucketCount[b] = (bucketCount[b] || 0) + 1;
  });

  const trendData = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(d => {
      if (d.closingTime) {
        const date = d.closingTime.slice(0, 10);
        map[date] = (map[date] || 0) + 1;
      }
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => {
        const d = new Date(date);
        const label = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
        return { date, label, closing: count };
      });
  }, [data]);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const paginatedData = data.slice((page - 1) * pageSize, page * pageSize);

  // ─── Closing Keywords inline management ───────────────
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [closingKeywords, setClosingKeywords] = useState<any[]>([]);
  const [kwLoading, setKwLoading] = useState(false);
  const [newKwSession, setNewKwSession] = useState("");
  const [newKwText, setNewKwText] = useState("");
  const [editKwId, setEditKwId] = useState<number | null>(null);
  const [editKwSession, setEditKwSession] = useState("");
  const [editKwText, setEditKwText] = useState("");

  const fetchClosingKeywords = useCallback(async () => {
    setKwLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/closing-keywords`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.data.success) setClosingKeywords(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch closing keywords:", err);
    } finally {
      setKwLoading(false);
    }
  }, []);

  const handleAddKeyword = async () => {
    if (!newKwSession || !newKwText.trim()) {
      toast.error("Pilih perangkat dan masukkan kata kunci");
      return;
    }
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/closing-keywords`,
        { session_id: newKwSession, keyword_text: newKwText.trim() },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setNewKwText("");
        setNewKwSession("");
        fetchClosingKeywords();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menambahkan");
    }
  };

  const handleEditKeyword = (kw: any) => {
    setEditKwId(kw.id);
    setEditKwSession(kw.session_id);
    setEditKwText(kw.keyword_text);
  };

  const handleUpdateKeyword = async () => {
    if (!editKwSession || !editKwText.trim() || !editKwId) return;
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/closing-keywords/${editKwId}`,
        { session_id: editKwSession, keyword_text: editKwText.trim() },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setEditKwId(null);
        fetchClosingKeywords();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal memperbarui");
    }
  };

  const handleDeleteKeyword = async (id: number) => {
    const result = await Swal.fire({
      title: "Hapus kata kunci?",
      text: "Kata kunci closing ini akan dihapus",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#1E3A5F",
      cancelButtonColor: "#E4E6EB",
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await axios.delete(`${import.meta.env.VITE_API_URL}/closing-keywords/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchClosingKeywords();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menghapus");
    }
  };

  const storeSessions = useStore((s) => s.sessions);
  const setActiveSession = useStore((s) => s.setActiveSession);
  const selectChat = useStore((s) => s.selectChat);

  const handleOpenChat = (chatJid: string, sessionId: string, contactName: string) => {
    const session = storeSessions.find((s: any) => s.id === sessionId);
    if (session) setActiveSession(session);
    selectChat({
      jid: chatJid,
      display_name: contactName,
      session_id: sessionId,
    } as any);
    if (onNavigate) onNavigate("chats");
  };

  const getSessionName = (id: string) => sessions.find((s: any) => s.id === id)?.name || id;

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <div className="mx-auto px-3 sm:px-4 lg:px-6 py-4">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-lg font-bold text-[#050505] flex items-center gap-2">
                <div className="w-7 h-7 bg-[#1877F2] rounded-lg flex items-center justify-center">
                  <Timer className="w-4 h-4 text-white" />
                </div>
                Trafik Closing
              </h1>
              <p className="text-[#65676B] text-xs mt-0.5">
                Lacak waktu dari tanya-tanya hingga closing
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => { fetchClosingKeywords(); setShowKeywordModal(true); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-[#CCD0D5] text-[#65676B] hover:bg-[#F0F2F5]"
              >
                <Settings className="w-3.5 h-3.5" /> Atur Kata Kunci
              </button>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg px-3 py-2 text-xs text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
              >
                {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {period === "Custom" && (
                <>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg px-3 py-2 text-xs text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg px-3 py-2 text-xs text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                  />
                </>
              )}
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg px-3 py-2 text-xs text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
              >
                <option value="all">Semua Device</option>
                {sessions.filter((s: any) => s.status === "connected").map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                onClick={fetchData}
                disabled={isLoading || (period === "Custom" && (!startDate || !endDate))}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all bg-[#1877F2] text-white hover:bg-[#166FE5] disabled:bg-[#E4E6EB] disabled:text-[#65676B] disabled:cursor-not-allowed"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Filter className="w-3.5 h-3.5" />}
                {isLoading ? "Memuat..." : "Tampilkan"}
              </button>
              {onBack && (
                <button onClick={onBack}
                  className="h-8 px-3 text-xs font-semibold rounded-lg border transition-all hover:bg-slate-50"
                  style={{ borderColor: "#CCD0D5", color: "#65676B" }}>
                  Kembali
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs mb-4" style={{ color: "#65676B" }}>
          <button onClick={() => navigate("/")} className="hover:underline font-medium" style={{ color: "#1877F2" }}>Dashboard</button>
          <span>/</span>
          <span className="font-semibold" style={{ color: "#050505" }}>Trafik Closing</span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-[#E4E6EB]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-[#E7F3FF] rounded-lg flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-[#1877F2]" />
              </div>
              <p className="text-xs text-[#65676B]">Total Closing</p>
            </div>
            <p className="text-xl font-bold text-[#050505]">{summary.total || 0}</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-[#E4E6EB]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-[#E7F3FF] rounded-lg flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-[#1877F2]" />
              </div>
              <p className="text-xs text-[#65676B]">Rata-rata Waktu Closing</p>
            </div>
            <p className="text-xl font-bold text-[#050505]">
              {summary.rataRataLabel || `0 ${summary.unit}`}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-[#E4E6EB]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-[#E7F3FF] rounded-lg flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-[#1877F2]" />
              </div>
              <p className="text-xs text-[#65676B]">Tercepat</p>
            </div>
            <p className="text-xl font-bold text-[#050505]">
              {data.length > 0
                ? summary.tercepatLabel
                : `0 ${summary.unit}`}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-[#E4E6EB]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-[#E7F3FF] rounded-lg flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-[#1877F2]" />
              </div>
              <p className="text-xs text-[#65676B]">Terlama</p>
            </div>
            <p className="text-xl font-bold text-[#050505]">
              {data.length > 0
                ? summary.terlamaLabel
                : `0 ${summary.unit}`}
            </p>
          </div>
        </div>

        {/* Trend Line Chart */}
        <div className="bg-white p-4 rounded-lg border border-[#E4E6EB] mb-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[#1877F2]" />
            <h2 className="text-xs font-bold text-[#050505] uppercase tracking-wider">
              Tren Closing Per Hari
            </h2>
          </div>
          {trendData.length > 0 ? (
            <div className="h-[180px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E6EB" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#65676B", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#65676B", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ border: "1px solid #E4E6EB", borderRadius: 8, background: "#fff" }}
                    labelStyle={{ fontWeight: 600, color: "#050505" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="closing"
                    name="Closing"
                    stroke="#1877F2"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#1877F2", strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#1877F2" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[150px] text-[#65676B] text-sm">
              Belum ada data tren
            </div>
          )}
        </div>

        {/* Device Summary */}
        {summary.totalDevice && summary.totalDevice.length > 0 && (
          <div className="bg-white p-4 rounded-lg border border-[#E4E6EB] mb-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-[#1877F2]" />
              <h2 className="text-xs font-bold text-[#050505] uppercase tracking-wider">
                Per Device
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {summary.totalDevice.map((d: any, i: number) => (
                <div key={i} className="bg-[#F0F2F5] p-3 rounded-lg border border-[#E4E6EB]">
                  <p className="text-xs text-[#65676B] font-medium">{d.name}</p>
                  <p className="text-base font-bold text-[#050505] mt-0.5">{d.total} closing</p>
                  <p className="text-xs text-[#65676B]">rata-rata {d.rataRataLabel}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Distribution Bucket */}
        <div className="bg-white p-4 rounded-lg border border-[#E4E6EB] mb-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-[#1877F2]" />
            <h2 className="text-xs font-bold text-[#050505] uppercase tracking-wider">
              Distribusi Waktu Closing
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {buckets.map(b => {
              const count = bucketCount[b] || 0;
              const maxCount = Math.max(...Object.values(bucketCount), 1);
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={b} className="bg-[#F0F2F5] p-3 rounded-lg border border-[#E4E6EB]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[#65676B]">{b}</span>
                    <span className="text-sm font-bold text-[#050505]">{count}</span>
                  </div>
                  <div className="w-full bg-[#E4E6EB] rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${count > 0 ? bucketColors[b]?.split(' ')[0] || 'bg-[#1877F2]' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Table */}
        <div className="bg-white rounded-lg border border-[#E4E6EB] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E4E6EB] bg-[#F0F2F5]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#1877F2]" />
              <h2 className="text-xs font-bold text-[#050505] uppercase tracking-wider">
                Detail Trafik Closing
              </h2>
              <span className="text-xs font-semibold bg-[#E7F3FF] text-[#1877F2] px-2.5 py-0.5 rounded-full ml-auto">
                {data.length} data
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-8 h-8 animate-spin text-[#E4E6EB]" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Timer className="w-12 h-12 text-[#E4E6EB] mb-4" />
              <p className="text-[#65676B] font-medium">Belum ada data closing</p>
              <p className="text-xs text-[#65676B] mt-1">
                Data akan muncul setelah ada chat yang mencapai tahap closing
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-[#050505]">
                <thead>
                  <tr>
                    <th className="px-3 py-2 font-semibold text-[#65676B] bg-[#F0F2F5]">Kontak</th>
                    <th className="px-3 py-2 font-semibold text-[#65676B] bg-[#F0F2F5]">Device</th>
                    <th className="px-3 py-2 font-semibold text-[#65676B] bg-[#F0F2F5]">Pertama Chat</th>
                    <th className="px-3 py-2 font-semibold text-[#65676B] bg-[#F0F2F5]">Waktu Closing</th>
                    <th className="px-3 py-2 font-semibold text-[#65676B] bg-[#F0F2F5]">Durasi</th>
                    <th className="px-3 py-2 font-semibold text-[#65676B] bg-[#F0F2F5]">Kategori</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((d, i) => {
                    const session = sessions.find((s: any) => s.id === d.session_id);
                    const bucket = getTimeBucket(d.durasiHari);
                    return (
                      <tr key={i} className="hover:bg-[#F2F3F5] border-b border-[#E4E6EB] cursor-pointer"
                          onClick={() => handleOpenChat(d.chat_jid, d.session_id, d.contactName)}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-[#1877F2] rounded-full flex items-center justify-center text-white text-2xs font-bold shrink-0">
                              {d.contactName?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <p className="font-semibold text-[#050505] truncate max-w-[160px] hover:text-[#1877F2] transition-colors">
                              {d.contactName}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[#65676B]">
                          {session?.name || d.session_id}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[#65676B]">
                          {formatDate(d.firstChat)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[#65676B]">
                          {formatDate(d.closingTime)}
                        </td>
                        <td className="px-3 py-2 font-semibold text-[#050505]">
                          {d.durasiLabel}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-2xs font-semibold ${bucketColors[bucket] || "bg-[#F0F2F5] text-[#65676B]"}`}>
                            {bucket}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {data.length > pageSize && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E4E6EB]">
              <span className="text-xs text-[#65676B]">
                {pageSize * (page - 1) + 1}–{Math.min(pageSize * page, data.length)} dari {data.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E4E6EB] text-[#65676B] disabled:opacity-40 hover:bg-[#F2F3F5]"
                >« Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="w-7 h-7 text-xs font-medium rounded-lg transition-all"
                    style={p === page ? { backgroundColor: "#1877F2", color: "#fff" } : { color: "#65676B" }}
                  >{p}</button>
                ))}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E4E6EB] text-[#65676B] disabled:opacity-40 hover:bg-[#F2F3F5]"
                >Next »</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Keyword Settings Modal ─────────────────────── */}
      {showKeywordModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-8 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4">
            <div className="sticky top-0 bg-white border-b border-[#E4E6EB] px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <KeyRound className="w-5 h-5 text-[#1877F2]" />
                <h2 className="text-lg font-bold text-[#050505]">Atur Kata Kunci Closing</h2>
              </div>
              <button
                onClick={() => setShowKeywordModal(false)}
                className="p-2 rounded-lg hover:bg-[#F0F2F5] text-[#65676B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-[#F0F2F5] p-4 rounded-lg mb-6">
                <p className="text-sm font-semibold text-[#050505] mb-3">Tambah Kata Kunci Baru</p>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[160px]">
                    <label className="block text-xs text-[#65676B] mb-1">Perangkat</label>
                    <select
                      value={newKwSession}
                      onChange={e => setNewKwSession(e.target.value)}
                      className="w-full bg-white border border-[#CCD0D5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                    >
                      <option value="">Pilih device...</option>
                      {sessions.filter((s: any) => s.status === "connected").map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-[2] min-w-[200px]">
                    <label className="block text-xs text-[#65676B] mb-1">Kata Kunci <span className="text-[#65676B]">(pesan admin harus mengandung kata kunci ini)</span></label>
                    <input
                      value={newKwText}
                      onChange={e => setNewKwText(e.target.value)}
                      placeholder="Baik ka terimakasih atas konfirmasinya saya bantu proses dulu"
                      className="w-full bg-white border border-[#CCD0D5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                    />
                  </div>
                  <button
                    onClick={handleAddKeyword}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#1877F2] text-white hover:bg-[#166FE5]"
                  >
                    <Plus className="w-4 h-4" /> Tambah
                  </button>
                </div>
              </div>

              <div className="divide-y divide-[#E4E6EB] border border-[#E4E6EB] rounded-lg">
                {kwLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#E4E6EB]" />
                  </div>
                ) : closingKeywords.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <KeyRound className="w-10 h-10 text-[#E4E6EB] mb-3" />
                    <p className="text-[#65676B] font-medium">Belum ada kata kunci closing</p>
                    <p className="text-xs text-[#65676B] mt-1">Tambah kata kunci di atas</p>
                  </div>
                ) : (
                  closingKeywords.map(kw => (
                    <div key={kw.id} className="px-4 py-3 flex items-center gap-3 hover:bg-[#F2F3F5]">
                      {editKwId === kw.id ? (
                        <>
                          <div className="flex-1 min-w-[140px]">
                            <select
                              value={editKwSession}
                              onChange={e => setEditKwSession(e.target.value)}
                              className="w-full bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                            >
                              {sessions.filter((s: any) => s.status === "connected").map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-[2]">
                            <input
                              value={editKwText}
                              onChange={e => setEditKwText(e.target.value)}
                              className="w-full bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                            />
                          </div>
                          <button onClick={handleUpdateKeyword} className="p-1.5 rounded bg-[#1877F2] text-white hover:bg-[#166FE5]">
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditKwId(null)} className="p-1.5 rounded bg-[#F0F2F5] text-[#65676B] hover:bg-[#E4E6EB]">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4 text-[#1877F2] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-[#050505]">{getSessionName(kw.session_id)}</span>
                            <span className="text-xs text-[#65676B] ml-2 break-words">{kw.keyword_text}</span>
                          </div>
                          <button onClick={() => handleEditKeyword(kw)} className="p-1.5 rounded text-[#65676B] hover:bg-[#F0F2F5]">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteKeyword(kw.id)} className="p-1.5 rounded text-red-500 hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficClosingSection;
