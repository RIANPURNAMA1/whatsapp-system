import React, { useState, useEffect, useMemo, useRef } from "react";
import { Loader2, BarChart3, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from "recharts";
import { tiktokLiveReportService } from "../../services/liveReportService";

interface Props {
  onBack: () => void;
}

type Period = "all" | "today" | "yesterday" | "week" | "month" | "custom";

const PERIODS: { key: Period; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "today", label: "Hari Ini" },
  { key: "yesterday", label: "Kemarin" },
  { key: "week", label: "Minggu Ini" },
  { key: "month", label: "Bulan Ini" },
  { key: "custom", label: "Kustom" },
];

function getDateRange(period: Period): { startDate?: string; endDate?: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const today = `${y}-${m}-${d}`;

  switch (period) {
    case "today":
      return { startDate: today, endDate: today };
    case "yesterday": {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const ys = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, "0")}-${String(yest.getDate()).padStart(2, "0")}`;
      return { startDate: ys, endDate: ys };
    }
    case "week": {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay());
      const sd = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
      return { startDate: sd, endDate: today };
    }
    case "month":
      return { startDate: `${y}-${m}-01`, endDate: today };
    default:
      return {};
  }
}

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

const ChartCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg border border-[#E4E6EB] overflow-hidden ${className}`}>
    {children}
  </div>
);

const ChartHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="px-5 pt-4 pb-3 border-b border-[#E4E6EB]">
    <h3 className="text-[13px] font-semibold text-[#050505]">{title}</h3>
  </div>
);

const cardMeta = [
  { label: "Total Laporan", key: "reports", bg: FB.blueLight, iconBg: FB.blue, icon: "📊" },
  { label: "Total Tayangan", key: "viewers", bg: "#EDE9FE", iconBg: "#8B5CF6", icon: "👁" },
  { label: "Total Berlian", key: "diamonds", bg: "#FEF3C7", iconBg: FB.orange, icon: "💎" },
  { label: "Total Hadiah", key: "gifts", bg: "#D1FAE5", iconBg: FB.green, icon: "🎁" },
  { label: "Total Pengikut", key: "followers", bg: "#E0F2FE", iconBg: "#0EA5E9", icon: "👥" },
  { label: "Leads TikTok", key: "leads", bg: "#FFE4E6", iconBg: FB.red, icon: "👤" },
];

const TikTokAnalyticsDashboard: React.FC<Props> = ({ onBack }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<Period>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const [fetchKey, setFetchKey] = useState(0);
  const tableLimit = 5;
  const fetchIdRef = useRef(0);

  const fetchData = async (p: Period, cs: string, ce: string) => {
    const id = ++fetchIdRef.current;
    setLoading(true);
    try {
      let startDate: string | undefined;
      let endDate: string | undefined;
      if (p === "custom") {
        startDate = cs || undefined;
        endDate = ce || undefined;
      } else {
        const range = getDateRange(p);
        startDate = range.startDate;
        endDate = range.endDate;
      }
      const reportsRes = await tiktokLiveReportService.getReports({ page: 1, limit: 1000, startDate, endDate });
      if (id === fetchIdRef.current) {
        setData(reportsRes.data);
        setTablePage(1);
      }
    } catch (err) {
      if (id === fetchIdRef.current) {
        console.error("Error fetching TikTok data:", err);
      }
    } finally {
      if (id === fetchIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData(period, customStart, customEnd);
  }, [period, fetchKey]);

  const handlePeriodClick = (p: Period) => {
    setPeriod(p);
    if (p !== "custom") {
      setFetchKey(k => k + 1);
    }
  };

  const handleCustomFilter = () => {
    if (customStart && customEnd) {
      setPeriod("custom");
      setFetchKey(k => k + 1);
    }
  };

  const totals = useMemo(() => ({
    viewers: data.reduce((a, r) => a + (parseInt(r.viewers) || 0), 0),
    diamonds: data.reduce((a, r) => a + (parseInt(r.diamonds) || 0), 0),
    gifts: data.reduce((a, r) => a + (parseInt(r.gift_givers) || 0), 0),
    followers: data.reduce((a, r) => a + (parseInt(r.new_followers) || 0), 0),
  }), [data]);

  const leadsCount = useMemo(() =>
    data.reduce((sum, r) => {
      try {
        const ld = typeof r.leads_data === "string" ? JSON.parse(r.leads_data) : r.leads_data;
        if (!ld) return sum;
        if (typeof ld === "number") return sum + ld;
        if (typeof ld.total === "number") return sum + ld.total;
        if (Array.isArray(ld)) return sum + ld.length;
        return sum;
      } catch { return sum; }
    }, 0),
  [data]);

  const chartData = useMemo(() =>
    data.map((r) => ({
      name: r.report_title?.length > 12 ? r.report_title.slice(0, 12) + ".." : r.report_title || "Laporan",
      Tayangan: parseInt(r.viewers) || 0,
      Berlian: parseInt(r.diamonds) || 0,
      Hadiah: parseInt(r.gift_givers) || 0,
    })),
  [data]);

  const pieData = useMemo(() =>
    [
      { name: "Tayangan", value: totals.viewers || 1 },
      { name: "Berlian", value: totals.diamonds || 1 },
      { name: "Hadiah", value: totals.gifts || 1 },
      { name: "Pengikut", value: totals.followers || 1 },
    ].filter((d) => d.value > 0),
  [totals]);

  const getReportDate = (r: any) => r.report_date || r.created_at;

  const trendData = useMemo(() =>
    [...data].reverse().map((r) => {
      let ld: any;
      try { ld = typeof r.leads_data === 'string' ? JSON.parse(r.leads_data) : r.leads_data; } catch {}
      const leads = ld?.total ?? (Array.isArray(ld) ? ld.length : 0);
      return {
        tayangan: parseInt(r.viewers) || 0,
        pengikut: parseInt(r.new_followers) || 0,
        leads,
        label: new Date(getReportDate(r)).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      };
    }),
  [data]);

  const PIECOLORS = [FB.blue, "#8B5CF6", FB.orange, FB.green];

  const summaryCards = [
    { value: data.length, ...cardMeta[0] },
    { value: totals.viewers.toLocaleString(), ...cardMeta[1] },
    { value: totals.diamonds.toLocaleString(), ...cardMeta[2] },
    { value: totals.gifts.toLocaleString(), ...cardMeta[3] },
    { value: totals.followers.toLocaleString(), ...cardMeta[4] },
    { value: leadsCount.toLocaleString(), ...cardMeta[5] },
  ];

  const gridColor = FB.grayLight;
  const axisColor = FB.gray;

  return (
    <div className="min-h-screen" style={{ backgroundColor: FB.grayBg }}>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* ─── Header ──────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#EE1D52" }}>
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#050505]">Live Analytics</h1>
              <p className="text-xs" style={{ color: FB.gray }}>Dashboard monitoring live</p>
            </div>
          </div>
          <button onClick={onBack}
            className="h-8 px-4 text-xs font-semibold rounded-lg border transition-all hover:bg-slate-50"
            style={{ borderColor: "#CCD0D5", color: FB.gray }}>
            Kembali
          </button>
        </div>

        {/* ─── Date Filter ──────────────────────────── */}
        <div className="bg-white rounded-lg border p-3 mb-4 flex flex-wrap items-center gap-2" style={{ borderColor: FB.grayLight }}>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => handlePeriodClick(p.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                period === p.key
                  ? "text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
              style={period === p.key ? { backgroundColor: "#EE1D52" } : {}}
            >
              {p.label}
            </button>
          ))}
          {period === "custom" && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l" style={{ borderColor: FB.grayLight }}>
              <Calendar className="w-3.5 h-3.5" style={{ color: FB.gray }} />
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                className="px-2 py-1 text-xs border rounded-lg" style={{ borderColor: FB.grayLight }} />
              <span className="text-xs" style={{ color: FB.gray }}>s/d</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                className="px-2 py-1 text-xs border rounded-lg" style={{ borderColor: FB.grayLight }} />
              <button onClick={handleCustomFilter}
                className="px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-all" style={{ backgroundColor: "#EE1D52" }}>
                Terapkan
              </button>
            </div>
          )}
        </div>

        {/* ─── Loading ─────────────────────────────── */}
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: FB.blue }} />
            <p className="text-sm" style={{ color: FB.gray }}>Memuat data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ─── Summary Cards ────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {summaryCards.map((card, i) => (
                <div key={i} className="bg-white rounded-lg border p-4" style={{ borderColor: FB.grayLight }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: card.bg, color: card.iconBg }}
                    >
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

            {/* ─── Charts Row ───────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <ChartCard className="lg:col-span-2">
                <ChartHeader title="Perbandingan per Laporan" />
                <div className="p-2" style={{ height: 280 }}>
                  {chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm" style={{ color: FB.gray }}>Belum ada data</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} barSize={20} barGap={6} margin={{ top: 16, right: 16, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ border: `1px solid ${gridColor}`, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                        <Bar dataKey="Tayangan" fill={FB.blue} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Berlian" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Hadiah" fill={FB.orange} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ChartCard>

              <ChartCard>
                <ChartHeader title="Distribusi Total" />
                <div className="p-2" style={{ height: 280 }}>
                  {pieData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm" style={{ color: FB.gray }}>Belum ada data</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={3}>
                          {pieData.map((_, idx) => (
                            <Cell key={idx} fill={PIECOLORS[idx % PIECOLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ border: `1px solid ${gridColor}`, borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ChartCard>
            </div>

            {/* ─── Growth Line ──────────────────────── */}
            {trendData.length > 1 && (
              <ChartCard>
                <ChartHeader title="Pertumbuhan Tayangan, Pengikut & Leads" />
                <div style={{ height: 220 }} className="p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 16, right: 16, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ border: `1px solid ${gridColor}`, borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                      <Line type="monotone" dataKey="tayangan" name="Tayangan" stroke={FB.blue} strokeWidth={2} dot={{ r: 3, fill: FB.blue }} />
                      <Line type="monotone" dataKey="pengikut" name="Pengikut" stroke={FB.green} strokeWidth={2} dot={{ r: 3, fill: FB.green }} />
                      <Line type="monotone" dataKey="leads" name="Leads" stroke={FB.red} strokeWidth={2} dot={{ r: 3, fill: FB.red }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            )}

            {/* ─── Table ────────────────────────────── */}
            <ChartCard>
              <ChartHeader title="Riwayat Laporan" />
              {data.length === 0 ? (
                <div className="p-12 text-center text-sm" style={{ color: FB.gray }}>Belum ada laporan</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border" style={{ borderColor: FB.grayLight }}>
                    <thead>
                      <tr>
                        {["Judul", "Tayangan", "Berlian", "Hadiah", "Pengikut", "Komentar", "Leads", "Tanggal", "Dibuat oleh"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-semibold text-[11px] uppercase tracking-wide border" style={{ color: FB.gray, borderColor: FB.grayLight, backgroundColor: FB.grayBg }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.slice((tablePage - 1) * tableLimit, tablePage * tableLimit).map((r) => {
                        const leads = (() => {
                          try {
                            const d = typeof r.leads_data === "string" ? JSON.parse(r.leads_data) : r.leads_data;
                            if (!d) return "-";
                            if (typeof d.total === "number") return d.total;
                            if (Array.isArray(d)) return d.length;
                            return "-";
                          } catch { return "-"; }
                        })();
                        return (
                          <tr key={r.id} className="hover:bg-[#F5F6F8] transition-colors">
                            <td className="px-4 py-3 font-medium text-[#050505] border" style={{ borderColor: FB.grayLight }}>{r.report_title}</td>
                            <td className="px-4 py-3 border text-right" style={{ color: FB.blue, borderColor: FB.grayLight }}>{r.viewers || "-"}</td>
                            <td className="px-4 py-3 border text-right" style={{ color: "#8B5CF6", borderColor: FB.grayLight }}>{r.diamonds || "-"}</td>
                            <td className="px-4 py-3 border text-right" style={{ color: "#050505", borderColor: FB.grayLight }}>{r.gift_givers || "-"}</td>
                            <td className="px-4 py-3 border text-right" style={{ color: "#050505", borderColor: FB.grayLight }}>{r.new_followers || "-"}</td>
                            <td className="px-4 py-3 border text-right" style={{ color: "#050505", borderColor: FB.grayLight }}>{r.comments_count || "-"}</td>
                            <td className="px-4 py-3 border text-right" style={{ color: FB.green, borderColor: FB.grayLight }}>{leads}</td>
                            <td className="px-4 py-3 border text-center whitespace-nowrap" style={{ color: FB.gray, borderColor: FB.grayLight }}>
                              {new Date(getReportDate(r)).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </td>
                            <td className="px-4 py-3 border text-center whitespace-nowrap" style={{ color: FB.gray, borderColor: FB.grayLight }}>
                              {r.creator_name || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {data.length > tableLimit && (
                <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: FB.grayLight }}>
                  <span className="text-xs" style={{ color: FB.gray }}>
                    {(tablePage - 1) * tableLimit + 1}-{Math.min(tablePage * tableLimit, data.length)} dari {data.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setTablePage(p => Math.max(1, p - 1))} disabled={tablePage <= 1}
                      className={`p-1.5 rounded transition-colors ${tablePage <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#F0F2F5]'}`}>
                      <ChevronLeft className="w-4 h-4" style={{ color: FB.gray }} />
                    </button>
                    {Array.from({ length: Math.ceil(data.length / tableLimit) }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => setTablePage(p)}
                        className={`w-7 h-7 rounded text-xs font-medium transition-colors ${p === tablePage ? 'text-white' : ''}`}
                        style={p === tablePage ? { backgroundColor: "#EE1D52" } : { color: FB.gray }}>
                        {p}
                      </button>
                    ))}
                    <button onClick={() => setTablePage(p => Math.min(Math.ceil(data.length / tableLimit), p + 1))}
                      disabled={tablePage >= Math.ceil(data.length / tableLimit)}
                      className={`p-1.5 rounded transition-colors ${tablePage >= Math.ceil(data.length / tableLimit) ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#F0F2F5]'}`}>
                      <ChevronRight className="w-4 h-4" style={{ color: FB.gray }} />
                    </button>
                  </div>
                </div>
              )}
            </ChartCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default TikTokAnalyticsDashboard;
