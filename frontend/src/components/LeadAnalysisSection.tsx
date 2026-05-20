import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  BarChart3,
  Users,
  RefreshCw,
  UserX,
  DollarSign,
  Clock,
  Filter,
  AlertTriangle,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const PERIODS = ["Hari ini", "Kemarin", "Minggu", "Bulan"];

export const LeadAnalysisSection: React.FC = () => {
  const [period, setPeriod] = useState("Minggu");
  const [sessionId, setSessionId] = useState("all");
  const [sessions, setSessions] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ total: 0, usia: 0, biaya: 0, bad: 0 });
  const [deviceData, setDeviceData] = useState<any[]>([]);
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

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { period };
      if (sessionId !== "all") params.sessionId = sessionId;
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/leads/analysis`,
        { params, headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (res.data.success) {
        setData(res.data.data || []);
        setSummary(res.data.summary || { total: 0, usia: 0, biaya: 0, bad: 0 });
        setDeviceData(res.data.deviceData || []);
      }
    } catch (err) {
      console.error("Failed to fetch lead analysis:", err);
    } finally {
      setIsLoading(false);
    }
  }, [period, sessionId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatDate = (ts: string) => {
    if (!ts) return "-";
    return new Date(ts).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  };

  const categoryMeta: Record<string, { label: string; icon: any; bg: string; text: string; light: string }> = {
    usia: { label: "Usia", icon: Clock, bg: "bg-[#E7F3FF]", text: "text-[#1877F2]", light: "bg-[#E7F3FF]" },
    biaya: { label: "Biaya", icon: DollarSign, bg: "bg-[#FFF8E7]", text: "text-[#F5A623]", light: "bg-[#FFF8E7]" },
    bad: { label: "BAD", icon: UserX, bg: "bg-[#FFEBEE]", text: "text-red-500", light: "bg-[#FFEBEE]" },
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#050505] flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1877F2] rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                Analisis Leads
              </h1>
              <p className="text-[#65676B] text-sm mt-1">
                Kategorisasi kendala leads: Usia, Biaya, dan BAD
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <select value={period} onChange={e => setPeriod(e.target.value)}
                className="bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg px-4 py-2.5 text-sm text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#1877F2]">
                {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={sessionId} onChange={e => setSessionId(e.target.value)}
                className="bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg px-4 py-2.5 text-sm text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#1877F2]">
                <option value="all">Semua Device</option>
                {sessions.filter((s: any) => s.status === "connected").map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button onClick={fetchData} disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#1877F2] text-white hover:bg-[#166FE5] disabled:bg-[#E4E6EB] disabled:text-[#65676B]">
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                {isLoading ? "Memuat..." : "Tampilkan"}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-[#E4E6EB]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#E7F3FF] rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-[#1877F2]" />
              </div>
              <p className="text-sm text-[#65676B]">Total Analisis</p>
            </div>
            <p className="text-3xl font-bold text-[#050505]">{summary.total}</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-[#E4E6EB]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#E7F3FF] rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#1877F2]" />
              </div>
              <p className="text-sm text-[#65676B]">Kendala Usia</p>
            </div>
            <p className="text-3xl font-bold text-[#1877F2]">{summary.usia}</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-[#E4E6EB]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#FFF8E7] rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#F5A623]" />
              </div>
              <p className="text-sm text-[#65676B]">Kendala Biaya</p>
            </div>
            <p className="text-3xl font-bold text-[#F5A623]">{summary.biaya}</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-[#E4E6EB]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#FFEBEE] rounded-lg flex items-center justify-center">
                <UserX className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-sm text-[#65676B]">BAD (Tidak Aktif)</p>
            </div>
            <p className="text-3xl font-bold text-red-500">{summary.bad}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-lg border border-[#E4E6EB]">
            <div className="flex items-center gap-3 mb-4">
              <PieChartIcon className="w-5 h-5 text-[#1877F2]" />
              <h2 className="text-sm font-bold text-[#050505] uppercase tracking-wider">Distribusi Kategori</h2>
            </div>
            {summary.total > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Usia", value: summary.usia, color: "#1877F2" },
                      { name: "Biaya", value: summary.biaya, color: "#F5A623" },
                      { name: "BAD", value: summary.bad, color: "#EF4444" },
                    ].filter(d => d.value > 0)}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                    paddingAngle={4} dataKey="value"
                  >
                    {[
                      { name: "Usia", color: "#1877F2" },
                      { name: "Biaya", color: "#F5A623" },
                      { name: "BAD", color: "#EF4444" },
                    ].filter(d => {
                      const val = d.name === "Usia" ? summary.usia : d.name === "Biaya" ? summary.biaya : summary.bad;
                      return val > 0;
                    }).map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    formatter={(value) => <span className="text-sm text-[#050505]">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-[#65676B] text-sm">
                Belum ada data
              </div>
            )}
          </div>

          {/* Bar Chart Per Device */}
          <div className="bg-white p-6 rounded-lg border border-[#E4E6EB]">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-5 h-5 text-[#1877F2]" />
              <h2 className="text-sm font-bold text-[#050505] uppercase tracking-wider">Per Device</h2>
            </div>
            {deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={deviceData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E6EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#65676B" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#65676B" }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="usia" name="Usia" fill="#1877F2" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="biaya" name="Biaya" fill="#F5A623" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="bad" name="BAD" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-[#65676B] text-sm">
                Belum ada data
              </div>
            )}
          </div>
        </div>

        {/* Detail Table */}
        <div className="bg-white rounded-lg border border-[#E4E6EB] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E4E6EB] bg-[#F0F2F5]">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-[#1877F2]" />
              <h2 className="text-sm font-bold text-[#050505] uppercase tracking-wider">Detail Analisis</h2>
              <span className="text-xs font-semibold bg-[#E7F3FF] text-[#1877F2] px-3 py-1 rounded-full ml-auto">
                {data.length} data
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16"><RefreshCw className="w-8 h-8 animate-spin text-[#E4E6EB]" /></div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <AlertTriangle className="w-12 h-12 text-[#E4E6EB] mb-4" />
              <p className="text-[#65676B] font-medium">Belum ada data analisis</p>
              <p className="text-xs text-[#65676B] mt-1">Data akan muncul setelah admin merespon dengan kendala usia/biaya atau lead tidak aktif</p>
            </div>
          ) : (
            <div className="overflow-x-auto p-4">
              <table className="w-full text-sm text-left text-[#050505]">
                <thead>
                  <tr>
                    <th className="px-4 py-3 font-semibold text-[#65676B] bg-[#F0F2F5]">Kontak</th>
                    <th className="px-4 py-3 font-semibold text-[#65676B] bg-[#F0F2F5]">Device</th>
                    <th className="px-4 py-3 font-semibold text-[#65676B] bg-[#F0F2F5]">Kategori</th>
                    <th className="px-4 py-3 font-semibold text-[#65676B] bg-[#F0F2F5]">Chat Pertama</th>
                    <th className="px-4 py-3 font-semibold text-[#65676B] bg-[#F0F2F5]">Terdeteksi</th>
                    <th className="px-4 py-3 font-semibold text-[#65676B] bg-[#F0F2F5]">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d: any, i: number) => {
                    const meta = categoryMeta[d.category] || { label: d.category, icon: AlertTriangle, bg: "bg-[#F0F2F5]", text: "text-[#65676B]", light: "bg-[#F0F2F5]" };
                    const Icon = meta.icon || AlertTriangle;
                    return (
                      <tr key={i} className="hover:bg-[#F2F3F5] border-b border-[#E4E6EB]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 bg-[#1877F2]">
                              {d.contact_name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <span className="font-semibold text-[#050505]">{d.contact_name || d.chat_jid.split('@')[0]}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#65676B]">{d.session_name || d.session_id}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.text}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#65676B]">{formatDate(d.first_chat_time)}</td>
                        <td className="px-4 py-3 text-xs text-[#65676B]">{formatDate(d.detected_at)}</td>
                        <td className="px-4 py-3 text-xs text-[#65676B]">{d.notes || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadAnalysisSection;
