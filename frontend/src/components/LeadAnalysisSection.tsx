import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  BarChart3, AlertTriangle, Settings2,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import CategoryManagementModal from "./CategoryManagementModal";

const FB = {
  blue: "#1877F2",
  blueLight: "#E7F3FF",
  green: "#31A24C",
  orange: "#F5A623",
  red: "#E74C3C",
  gray: "#65676B",
  grayLight: "#E4E6EB",
  grayBg: "#F0F2F5",
  white: "#FFFFFF",
};

type Period = "all" | "today" | "yesterday" | "week" | "month";

const PERIODS: { key: Period; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "today", label: "Hari Ini" },
  { key: "yesterday", label: "Kemarin" },
  { key: "week", label: "Minggu Ini" },
  { key: "month", label: "Bulan Ini" },
];

const ChartCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg border border-[#E4E6EB] overflow-hidden ${className}`}>
    {children}
  </div>
);

const ChartHeader: React.FC<{ title: string; count?: number }> = ({ title, count }) => (
  <div className="px-5 pt-4 pb-3 border-b border-[#E4E6EB] flex items-center justify-between">
    <h3 className="text-[13px] font-semibold text-[#050505]">{title}</h3>
    {count !== undefined && (
      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: FB.blueLight, color: FB.blue }}>
        {count} data
      </span>
    )}
  </div>
);

interface LeadAnalysisProps {
  onBack?: () => void;
}

export const LeadAnalysisSection: React.FC<LeadAnalysisProps> = ({ onBack }) => {
  const [period, setPeriod] = useState<Period>("week");
  const [sessionId, setSessionId] = useState("all");
  const [sessions, setSessions] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ total: 0 });
  const [deviceData, setDeviceData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

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
        setSummary(res.data.summary || { total: 0 });
        setDeviceData(res.data.deviceData || []);
        if (res.data.categories) setCategories(res.data.categories);
      }
    } catch (err) {
      console.error("Failed to fetch lead analysis:", err);
    } finally {
      setIsLoading(false);
    }
  }, [period, sessionId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (categories.length === 0) {
      axios.get(`${import.meta.env.VITE_API_URL}/lead-categories`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }).then(res => {
        if (res.data.success) {
          setCategories(res.data.data.map((c: any) => ({
            key: c.name, label: c.label, color: c.color, icon: c.icon,
          })));
        }
      }).catch(() => {});
    }
  }, []);

  const formatDate = (ts: string) => {
    if (!ts) return "-";
    return new Date(ts).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  };

  const summaryCards = categories.map(c => ({
    label: c.label,
    value: summary[c.key] || 0,
    icon: c.icon || "📊",
    bg: c.color + "18",
    iconBg: c.color,
  }));

  summaryCards.unshift({ label: "Total Analisis", value: summary.total || 0, icon: "📊", bg: FB.blueLight, iconBg: FB.blue });

  const pieData = categories
    .map(c => ({ name: c.label, value: summary[c.key] || 0, color: c.color }))
    .filter(d => d.value > 0);

  const gridColor = FB.grayLight;
  const axisColor = FB.gray;

  return (
    <div className="min-h-screen" style={{ backgroundColor: FB.grayBg }}>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: FB.blue }}>
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#050505]">Analisis Leads</h1>
              <p className="text-xs" style={{ color: FB.gray }}>
                Kategorisasi kendala leads
                {categories.length > 0 && `: ${categories.map(c => c.label).join(", ")}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg border hover:bg-[#F2F3F5] transition-all"
              style={{ borderColor: "#CCD0D5", color: FB.gray }}
            >
              <Settings2 className="w-3.5 h-3.5" />
              Kelola Kategori
            </button>
            <select value={sessionId} onChange={e => setSessionId(e.target.value)}
              className="h-8 px-3 text-xs border rounded-lg bg-white" style={{ borderColor: FB.grayLight, color: FB.gray }}>
              <option value="all">Semua Device</option>
              {sessions.filter((s: any) => s.status === "connected").map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {onBack && (
              <button onClick={onBack}
                className="h-8 px-4 text-xs font-semibold rounded-lg border transition-all hover:bg-slate-50"
                style={{ borderColor: "#CCD0D5", color: FB.gray }}>
                Kembali
              </button>
            )}
          </div>
        </div>

        {/* Date Filter */}
        <div className="bg-white rounded-lg border p-3 mb-4 flex flex-wrap items-center gap-2" style={{ borderColor: FB.grayLight }}>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                period === p.key ? "text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
              style={period === p.key ? { backgroundColor: FB.blue } : {}}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 rounded-full animate-spin mx-auto mb-2" style={{ borderColor: FB.grayLight, borderTopColor: FB.blue }} />
            <p className="text-sm" style={{ color: FB.gray }}>Memuat data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {summaryCards.map((card, i) => (
                <div key={i} className="bg-white rounded-lg border p-4" style={{ borderColor: FB.grayLight }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: card.bg, color: card.iconBg }}>
                      {card.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold leading-tight text-[#050505]">{card.value}</p>
                      <p className="text-[11px] font-medium truncate" style={{ color: FB.gray }}>{card.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard>
                <ChartHeader title="Distribusi Kategori" />
                <div className="p-2" style={{ height: 280 }}>
                  {pieData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm" style={{ color: FB.gray }}>Belum ada data</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                          {pieData.map((d, i) => (
                            <Cell key={i} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ border: `1px solid ${gridColor}`, borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={(v) => <span style={{ color: "#050505" }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ChartCard>

              <ChartCard>
                <ChartHeader title="Perbandingan Perangkat" />
                <div className="p-2" style={{ height: 280 }}>
                  {deviceData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm" style={{ color: FB.gray }}>Belum ada data</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deviceData} barSize={20} margin={{ top: 16, right: 16, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ border: `1px solid ${gridColor}`, borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                        {categories.map(c => (
                          <Bar key={c.key} dataKey={c.key} name={c.label} fill={c.color} radius={[4, 4, 0, 0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ChartCard>
            </div>

            {/* Detail Table */}
            <ChartCard>
              <ChartHeader title="Detail Analisis" count={data.length} />
              {data.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <AlertTriangle className="w-12 h-12 mb-4" style={{ color: FB.grayLight }} />
                  <p className="font-medium" style={{ color: FB.gray }}>Belum ada data analisis</p>
                  <p className="text-xs mt-1" style={{ color: FB.gray }}>Data akan muncul setelah admin merespon dengan kendala kategori atau lead tidak aktif</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse" style={{ borderColor: FB.grayLight }}>
                    <thead>
                      <tr>
                        {["Kontak", "Device", "Kategori", "Chat Pertama", "Terdeteksi", "Keterangan"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-semibold text-[11px] uppercase tracking-wide border" style={{ color: FB.gray, borderColor: FB.grayLight, backgroundColor: FB.grayBg }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((d: any, i: number) => {
                        const cat = categories.find(c => c.key === d.category);
                        return (
                          <tr key={i} className="hover:bg-[#F5F6F8] transition-colors">
                            <td className="px-4 py-3 border" style={{ borderColor: FB.grayLight }}>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: cat?.color || FB.blue }}>
                                  {d.contact_name?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                                <span className="font-semibold text-[#050505]">{d.contact_name || d.chat_jid?.split('@')[0]}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 border text-xs" style={{ color: FB.gray, borderColor: FB.grayLight }}>{d.session_name || d.session_id}</td>
                            <td className="px-4 py-3 border" style={{ borderColor: FB.grayLight }}>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: cat ? cat.color + "18" : FB.grayBg, color: cat?.color || FB.gray }}>
                                {d.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 border text-xs" style={{ color: FB.gray, borderColor: FB.grayLight }}>{formatDate(d.first_chat_time)}</td>
                            <td className="px-4 py-3 border text-xs" style={{ color: FB.gray, borderColor: FB.grayLight }}>{formatDate(d.detected_at)}</td>
                            <td className="px-4 py-3 border text-xs" style={{ color: FB.gray, borderColor: FB.grayLight }}>{d.notes || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </ChartCard>
          </div>
        )}
      </div>

      <CategoryManagementModal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSaved={() => { fetchData(); }}
      />
    </div>
  );
};

export default LeadAnalysisSection;
