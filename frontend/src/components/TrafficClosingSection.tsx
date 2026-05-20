import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Clock,
  Calendar,
  RefreshCw,
  BarChart3,
  Users,
  MessageSquare,
  Timer,
  TrendingUp,
  Filter,
} from "lucide-react";

const PERIODS = ["Hari ini", "Kemarin", "Minggu", "Bulan", "Custom"];

export const TrafficClosingSection: React.FC = () => {
  const [period, setPeriod] = useState("Minggu");
  const [sessionId, setSessionId] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ total: 0, rataRataJam: 0, totalDevice: [] });
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
        setSummary(res.data.summary || { total: 0, rataRataJam: 0, totalDevice: [] });
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

  const getTimeBucket = (jam: number) => {
    if (jam < 1) return "< 1 jam";
    if (jam < 6) return "1-6 jam";
    if (jam < 24) return "6-24 jam";
    if (jam < 72) return "1-3 hari";
    return "> 3 hari";
  };

  const bucketColors: Record<string, string> = {
    "< 1 jam": "bg-[#1591DC] text-[#1877F2]",
    "1-6 jam": "bg-[#E7F3FF] text-[#1877F2]",
    "6-24 jam": "bg-[#FFF8E7] text-[#F5A623]",
    "1-3 hari": "bg-[#FFF8E7] text-[#F5A623]",
    "> 3 hari": "bg-[#FFEBEE] text-red-500",
  };

  const buckets = ["< 1 jam", "1-6 jam", "6-24 jam", "1-3 hari", "> 3 hari"];
  const bucketCount: Record<string, number> = {};
  buckets.forEach(b => bucketCount[b] = 0);
  data.forEach(d => {
    const b = getTimeBucket(d.durasiJam);
    bucketCount[b] = (bucketCount[b] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#050505] flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1877F2] rounded-lg flex items-center justify-center">
                  <Timer className="w-5 h-5 text-white" />
                </div>
                Trafik Closing
              </h1>
              <p className="text-[#65676B] text-sm mt-1">
                Lacak waktu dari tanya-tanya hingga closing
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg px-4 py-2.5 text-sm text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
              >
                {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {period === "Custom" && (
                <>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg px-4 py-2.5 text-sm text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg px-4 py-2.5 text-sm text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                  />
                </>
              )}
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="bg-[#F0F2F5] border border-[#CCD0D5] rounded-lg px-4 py-2.5 text-sm text-[#050505] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
              >
                <option value="all">Semua Device</option>
                {sessions.filter((s: any) => s.status === "connected").map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                onClick={fetchData}
                disabled={isLoading || (period === "Custom" && (!startDate || !endDate))}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all bg-[#1877F2] text-white hover:bg-[#166FE5] disabled:bg-[#E4E6EB] disabled:text-[#65676B] disabled:cursor-not-allowed"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                {isLoading ? "Memuat..." : "Tampilkan"}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-[#E4E6EB]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#E7F3FF] rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-[#1877F2]" />
              </div>
              <p className="text-sm text-[#65676B]">Total Closing</p>
            </div>
            <p className="text-3xl font-bold text-[#050505]">{summary.total || 0}</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-[#E4E6EB]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#E7F3FF] rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#1877F2]" />
              </div>
              <p className="text-sm text-[#65676B]">Rata-rata Waktu Closing</p>
            </div>
            <p className="text-3xl font-bold text-[#050505]">
              {summary.rataRataJam > 0 ? `${summary.rataRataJam} jam` : "0 jam"}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-[#E4E6EB]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#E7F3FF] rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#1877F2]" />
              </div>
              <p className="text-sm text-[#65676B]">Tercepat</p>
            </div>
            <p className="text-3xl font-bold text-[#050505]">
              {data.length > 0
                ? `${Math.min(...data.map(d => d.durasiJam || Infinity))} jam`
                : "0 jam"}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-[#E4E6EB]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#E7F3FF] rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[#1877F2]" />
              </div>
              <p className="text-sm text-[#65676B]">Terlama</p>
            </div>
            <p className="text-3xl font-bold text-[#050505]">
              {data.length > 0
                ? `${Math.max(...data.map(d => d.durasiJam || 0))} jam`
                : "0 jam"}
            </p>
          </div>
        </div>

        {/* Device Summary */}
        {summary.totalDevice && summary.totalDevice.length > 0 && (
          <div className="bg-white p-6 rounded-lg border border-[#E4E6EB] mb-8">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-[#1877F2]" />
              <h2 className="text-sm font-bold text-[#050505] uppercase tracking-wider">
                Per Device
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {summary.totalDevice.map((d: any, i: number) => (
                <div key={i} className="bg-[#F0F2F5] p-4 rounded-lg border border-[#E4E6EB]">
                  <p className="text-xs text-[#65676B] font-medium">{d.name}</p>
                  <p className="text-lg font-bold text-[#050505] mt-1">{d.total} closing</p>
                  <p className="text-xs text-[#65676B]">rata-rata {d.rataRataJam} jam</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Distribution Bucket */}
        <div className="bg-white p-6 rounded-lg border border-[#E4E6EB] mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-[#1877F2]" />
            <h2 className="text-sm font-bold text-[#050505] uppercase tracking-wider">
              Distribusi Waktu Closing
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {buckets.map(b => {
              const count = bucketCount[b] || 0;
              const maxCount = Math.max(...Object.values(bucketCount), 1);
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={b} className="bg-[#F0F2F5] p-4 rounded-lg border border-[#E4E6EB]">
                  <div className="flex items-center justify-between mb-2">
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
          <div className="px-6 py-4 border-b border-[#E4E6EB] bg-[#F0F2F5]">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-[#1877F2]" />
              <h2 className="text-sm font-bold text-[#050505] uppercase tracking-wider">
                Detail Trafik Closing
              </h2>
              <span className="text-xs font-semibold bg-[#E7F3FF] text-[#1877F2] px-3 py-1 rounded-full ml-auto">
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
            <div className="overflow-x-auto p-4">
              <table className="w-full text-sm text-left text-[#050505]">
                <thead>
                  <tr>
                    <th className="px-4 py-3 font-semibold text-[#65676B] bg-[#F0F2F5]">Kontak</th>
                    <th className="px-4 py-3 font-semibold text-[#65676B] bg-[#F0F2F5]">Device</th>
                    <th className="px-4 py-3 font-semibold text-[#65676B] bg-[#F0F2F5]">Pertama Chat</th>
                    <th className="px-4 py-3 font-semibold text-[#65676B] bg-[#F0F2F5]">Waktu Closing</th>
                    <th className="px-4 py-3 font-semibold text-[#65676B] bg-[#F0F2F5]">Durasi</th>
                    <th className="px-4 py-3 font-semibold text-[#65676B] bg-[#F0F2F5]">Kategori</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d, i) => {
                    const session = sessions.find((s: any) => s.id === d.session_id);
                    const bucket = getTimeBucket(d.durasiJam);
                    return (
                      <tr key={i} className="hover:bg-[#F2F3F5] border-b border-[#E4E6EB]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#1877F2] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {d.contactName?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="font-semibold text-[#050505] truncate max-w-[200px]">
                                {d.contactName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#65676B]">
                          {session?.name || d.session_id}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-[#65676B]">
                          {formatDate(d.firstChat)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-[#65676B]">
                          {formatDate(d.closingTime)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#050505]">
                          {d.durasiLabel}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${bucketColors[bucket] || "bg-[#F0F2F5] text-[#65676B]"}`}>
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
        </div>
      </div>
    </div>
  );
};

export default TrafficClosingSection;
