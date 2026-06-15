import React, { useState, useEffect, useCallback, createElement } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useStore from "../store/useStore";
import type { LucideIcon } from "lucide-react";
import {
  Activity, BarChart3, User, DollarSign, MapPin, Phone, Mail, Home,
  Users, Briefcase, GraduationCap, Heart, Clock, Calendar, Flame, Gem,
  Tag, CheckCircle, AlertTriangle, Ban, RefreshCw, FileText, Target,
  MessageSquare, ClipboardList, ShoppingCart, Star, PartyPopper, HelpCircle, ThumbsUp,
  Settings2, Plus, Pencil, Trash2, Save, X,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Activity, BarChart3, User, DollarSign, MapPin, Phone, Mail, Home,
  Users, Briefcase, GraduationCap, Heart, Clock, Calendar, Flame, Gem,
  Tag, CheckCircle, AlertTriangle, Ban, RefreshCw, FileText, Target,
  MessageSquare, ClipboardList, ShoppingCart, Star, PartyPopper, HelpCircle, ThumbsUp,
};

const IconDisplay = ({ name, size = 16 }: { name: string; size?: number }) => {
  const Icon = ICON_MAP[name];
  if (Icon) return createElement(Icon, { size });
  return <span style={{ fontSize: size }}>{name || "📊"}</span>;
};
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Smartphone, TrendingUp, UserCheck } from "lucide-react";

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
  onNavigate?: (tab: string) => void;
}

export const LeadAnalysisSection: React.FC<LeadAnalysisProps> = ({ onBack, onNavigate }) => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("all");
  const [sessionId, setSessionId] = useState("all");
  const [sessions, setSessions] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ total: 0 });
  const [deviceData, setDeviceData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [socialStats, setSocialStats] = useState<any[]>([]);
  const [rawKeywords, setRawKeywords] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const paginatedData = data.slice((page - 1) * pageSize, page * pageSize);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // Navigate to chat
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

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Hapus ${selectedIds.size} data analisis terpilih?`)) return;
    setDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/leads/analysis`,
        {
          data: { ids },
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setData(prev => prev.filter(d => !ids.includes(d.id)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Gagal hapus data:", err);
      alert("Gagal menghapus data");
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedData.map(d => d.id)));
    }
  };

  // Modal category management
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [localCategories, setLocalCategories] = useState<any[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [catForm, setCatForm] = useState({ name: "", label: "", color: "#1877F2", icon: "BarChart3", keywords: "" });

  // Category drill-down modal
  const [drillDownCategory, setDrillDownCategory] = useState<any>(null);

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
      const token = localStorage.getItem("token");
      const params: any = { period };
      if (sessionId !== "all") params.sessionId = sessionId;

      const socialParams: Record<string, string> = {};
      if (period === "all") socialParams.period = "Semua";
      else if (period === "today") socialParams.period = "Hari ini";
      else if (period === "yesterday") socialParams.period = "Kemarin";
      else if (period === "week") socialParams.period = "Minggu";
      else if (period === "month") socialParams.period = "Bulan";

      const [analysisRes, socialRes, kwRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/leads/analysis`, {
          params, headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/social/media`, {
          params: socialParams,
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/keywords`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (analysisRes.data.success) {
        setData(analysisRes.data.data || []);
        setPage(1);
        setSummary(analysisRes.data.summary || { total: 0 });
        setDeviceData(analysisRes.data.deviceData || []);
        if (analysisRes.data.categories) setCategories(analysisRes.data.categories);
      }

      if (socialRes.data.success) {
        setSocialStats(socialRes.data.data || []);
      }
      setRawKeywords(kwRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch lead analysis:", err);
    } finally {
      setIsLoading(false);
    }
  }, [period, sessionId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => { setSelectedIds(new Set()); }, [data]);

  const fetchLocalCategories = useCallback(async () => {
    setCatLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/lead-categories`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.data.success) {
        setLocalCategories(res.data.data);
        setCategories(res.data.data.map((c: any) => ({
          key: c.name, label: c.label, color: c.color, icon: c.icon,
        })));
      }
    } catch {} finally { setCatLoading(false); }
  }, []);

  useEffect(() => {
    if (categories.length === 0) fetchLocalCategories();
  }, [fetchLocalCategories]);

  const resetCatForm = () => {
    setCatForm({ name: "", label: "", color: "#1877F2", icon: "BarChart3", keywords: "" });
    setEditingCatId(null);
  };

  const openAddCategory = () => {
    resetCatForm();
    fetchLocalCategories();
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    if (!catForm.name || !catForm.label) return;
    const payload = {
      ...catForm,
      keywords: catForm.keywords.split(",").map(k => k.trim()).filter(Boolean),
    };
    try {
      if (editingCatId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/lead-categories/${editingCatId}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/lead-categories`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
      }
      resetCatForm();
      fetchLocalCategories();
    } catch {
      console.error("Failed to save category");
    }
  };

  const handleEditCategory = (cat: any) => {
    setEditingCatId(cat.id);
    const kw = typeof cat.keywords === "string" ? cat.keywords : (cat.keywords || []).join(", ");
    setCatForm({ name: cat.name, label: cat.label, color: cat.color, icon: cat.icon, keywords: kw });
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Hapus kategori ini?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/lead-categories/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchLocalCategories();
    } catch {
      console.error("Failed to delete category");
    }
  };

  const COLORS = [
    "#1877F2", "#F5A623", "#E74C3C", "#8B5CF6", "#EC4899",
    "#0EA5E9", "#F59E0B", "#10B981", "#6366F1", "#EF4444",
  ];

  const ICON_LIST: { name: string; icon: LucideIcon }[] = [
    { name: "Activity", icon: Activity }, { name: "BarChart3", icon: BarChart3 },
    { name: "User", icon: User }, { name: "Users", icon: Users },
    { name: "DollarSign", icon: DollarSign }, { name: "MapPin", icon: MapPin },
    { name: "Phone", icon: Phone }, { name: "Mail", icon: Mail },
    { name: "Home", icon: Home }, { name: "Briefcase", icon: Briefcase },
    { name: "GraduationCap", icon: GraduationCap }, { name: "Heart", icon: Heart },
    { name: "Clock", icon: Clock }, { name: "Calendar", icon: Calendar },
    { name: "Flame", icon: Flame }, { name: "Gem", icon: Gem },
    { name: "Tag", icon: Tag }, { name: "CheckCircle", icon: CheckCircle },
    { name: "AlertTriangle", icon: AlertTriangle }, { name: "Ban", icon: Ban },
    { name: "RefreshCw", icon: RefreshCw }, { name: "FileText", icon: FileText },
    { name: "Target", icon: Target }, { name: "MessageSquare", icon: MessageSquare },
    { name: "ClipboardList", icon: ClipboardList }, { name: "ShoppingCart", icon: ShoppingCart },
    { name: "Star", icon: Star }, { name: "PartyPopper", icon: PartyPopper },
    { name: "HelpCircle", icon: HelpCircle }, { name: "ThumbsUp", icon: ThumbsUp },
  ];

  const formatDate = (ts: string) => {
    if (!ts) return "-";
    return new Date(ts).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  };

  const summaryCards = categories.map(c => ({
    label: c.label,
    value: summary[c.key] || 0,
    icon: c.icon || "BarChart3",
    bg: c.color + "18",
    iconBg: c.color,
  }));

  summaryCards.unshift({ label: "Total Analisis", value: summary.total || 0, icon: "BarChart3", bg: FB.blueLight, iconBg: FB.blue });

  const pieData = categories
    .map(c => ({ name: c.label, value: summary[c.key] || 0, color: c.color }))
    .filter(d => d.value > 0);

  const gridColor = FB.grayLight;
  const axisColor = FB.gray;

  return (
    <div className="min-h-screen" style={{ backgroundColor: FB.grayBg }}>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: FB.blue }}>
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#050505]">Analisis Leads</h1>
              <p className="text-sm" style={{ color: FB.gray }}>Analisis kendala kategori leads</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={openAddCategory}
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

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs mb-4" style={{ color: FB.gray }}>
          <button onClick={() => navigate("/")} className="hover:underline font-medium" style={{ color: FB.blue }}>Dashboard</button>
          <span>/</span>
          <span className="font-semibold" style={{ color: "#050505" }}>Analisis Leads</span>
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
              {summaryCards.map((card, i) => {
                const cat = categories[i - 1];
                const total = summary.total || 1;
                const pct = total > 0 ? Math.round((card.value / total) * 100) : 0;
                return (
                  <div key={i}
                    onClick={() => {
                      if (i === 0 || !cat) return;
                      setDrillDownCategory({ ...cat, count: card.value, pct });
                    }}
                    className="bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-sm"
                    style={{ borderColor: FB.grayLight }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: card.bg, color: card.iconBg }}>
                        <IconDisplay name={card.icon} size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-bold leading-tight text-[#050505]">{card.value}</p>
                        <p className="text-[11px] font-medium truncate" style={{ color: FB.gray }}>{card.label}</p>
                      </div>
                      {i > 0 && (
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold leading-tight" style={{ color: cat?.color || FB.blue }}>{pct}%</p>
                        </div>
                      )}
                    </div>
                    {i > 0 && (
                      <div className="mt-2 h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: FB.grayBg }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cat?.color || FB.blue }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Social Media Ringkasan */}
            {socialStats.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={15} style={{ color: FB.blue }} />
                  <span className="text-[13px] font-bold" style={{ color: "#050505" }}>Ringkasan Social Media</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {socialStats.filter((s: any) => s.totalLeads > 0 || s.totalOrganik > 0).map((s: any) => {
                    const deviceName = sessions.find((x: any) => x.id === s.session_id)?.name || "Unknown";
                    const deviceKeywords = rawKeywords
                      .filter((k: any) => k.session_id === s.session_id)
                      .map((k: any) => k.platform.toLowerCase());
                    const platforms = [...new Set(deviceKeywords)];
                    const totalLeads = (s.totalLeads || 0) + (s.totalOrganik || 0);
                    const convRate = s.totalLeads > 0 ? Math.round((s.totalClosing / s.totalLeads) * 100) : 0;
                    return (
                      <div key={s.session_id} className="bg-white rounded-lg border p-4" style={{ borderColor: FB.grayLight }}>
                        <div className="flex items-center gap-2 mb-3">
                          <Smartphone size={14} style={{ color: FB.blue }} />
                          <span className="font-bold text-[13px]" style={{ color: "#050505" }}>{deviceName}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div>
                            <p className="text-[10px] font-medium" style={{ color: FB.gray }}>Total Leads</p>
                            <p className="text-base font-bold" style={{ color: "#050505" }}>{totalLeads}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-medium" style={{ color: FB.gray }}>Conversion</p>
                            <p className="text-base font-bold" style={{ color: FB.green }}>{convRate}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-medium" style={{ color: FB.gray }}>Closing</p>
                            <p className="text-base font-bold" style={{ color: FB.green }}>{s.totalClosing || 0}</p>
                          </div>
                        </div>
                        {platforms.length > 0 && (
                          <div className="border-t pt-2" style={{ borderColor: FB.grayLight }}>
                            <p className="text-[10px] font-medium mb-1.5" style={{ color: FB.gray }}>Platform Sources</p>
                            <div className="space-y-1">
                              {s.totalOrganik > 0 && (
                                <div className="flex items-center justify-between py-1 px-2 rounded" style={{ backgroundColor: FB.grayBg }}>
                                  <span className="text-[10px] font-medium" style={{ color: "#344054" }}>Leads Organik</span>
                                  <span className="text-[10px] font-semibold" style={{ color: FB.blue }}>{s.totalOrganik}</span>
                                </div>
                              )}
                              {platforms.map((p: string) => (
                                <div key={p} className="flex items-center justify-between py-1 px-2 rounded" style={{ backgroundColor: FB.grayBg }}>
                                  <span className="text-[10px] font-medium capitalize" style={{ color: "#344054" }}>{p}</span>
                                  <span className="text-[10px] font-semibold" style={{ color: FB.gray }}>{s[`leads_${p}`] || 0}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                  {selectedIds.size > 0 && (
                    <div className="flex items-center gap-3 px-4 py-2 border-b" style={{ backgroundColor: FB.blueLight, borderColor: FB.grayLight }}>
                      <span className="text-xs font-medium" style={{ color: FB.blue }}>
                        {selectedIds.size} data terpilih
                      </span>
                      <button
                        onClick={handleBulkDelete}
                        disabled={deleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                        style={{ backgroundColor: FB.red, color: FB.white }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deleting ? "Menghapus..." : "Hapus"}
                      </button>
                    </div>
                  )}
                  <table className="w-full text-sm border-collapse" style={{ borderColor: FB.grayLight }}>
                    <thead>
                      <tr>
                        <th className="px-4 py-3 border text-left" style={{ color: FB.gray, borderColor: FB.grayLight, backgroundColor: FB.grayBg, width: 40 }}>
                          <input
                            type="checkbox"
                            checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded cursor-pointer accent-[#1877F2]"
                          />
                        </th>
                        {["Kontak", "Device", "Kategori", "Chat Pertama", "Terdeteksi", "Keterangan"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-semibold text-[11px] uppercase tracking-wide border" style={{ color: FB.gray, borderColor: FB.grayLight, backgroundColor: FB.grayBg }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((d: any, i: number) => {
                        const cat = categories.find(c => c.key === d.category);
                        return (
                          <tr key={i} className="hover:bg-[#F5F6F8] transition-colors cursor-pointer"
                              onClick={() => handleOpenChat(d.chat_jid, d.session_id, d.contact_name)}>
                            <td className="px-4 py-3 border" style={{ borderColor: FB.grayLight, width: 40 }} onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedIds.has(d.id)}
                                onChange={() => toggleSelect(d.id)}
                                className="w-4 h-4 rounded cursor-pointer accent-[#1877F2]"
                              />
                            </td>
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
              {data.length > pageSize && (
                <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: FB.grayLight }}>
                  <span className="text-xs" style={{ color: FB.gray }}>
                    {pageSize * (page - 1) + 1}–{Math.min(pageSize * page, data.length)} dari {data.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border disabled:opacity-40 hover:bg-[#F2F3F5] transition-all"
                      style={{ borderColor: FB.grayLight, color: FB.gray }}
                    >« Prev</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className="w-7 h-7 text-xs font-medium rounded-lg transition-all"
                        style={p === page ? { backgroundColor: FB.blue, color: FB.white } : { color: FB.gray, backgroundColor: 'transparent' }}
                      >{p}</button>
                    ))}
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border disabled:opacity-40 hover:bg-[#F2F3F5] transition-all"
                      style={{ borderColor: FB.grayLight, color: FB.gray }}
                    >Next »</button>
                  </div>
                </div>
              )}
            </ChartCard>
          </div>
        )}
      </div>

      {/* Category Drill-Down Modal */}
      {drillDownCategory && (() => {
        const catKey = drillDownCategory.key;
        const catCount = drillDownCategory.count;
        const catPct = drillDownCategory.pct;

        const deviceBreakdown = deviceData
          .filter((d: any) => (d as any)[catKey] > 0)
          .map(d => ({
            name: d.name,
            value: d[catKey],
            pct: catCount > 0 ? Math.round((d[catKey] / catCount) * 100) : 0,
          }));

        const colors = ["#1877F2", "#F5A623", "#E74C3C", "#8B5CF6", "#EC4899", "#0EA5E9", "#10B981", "#6366F1"];

        return (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="bg-white rounded-xl border w-full max-w-lg mx-4" style={{ borderColor: "#E4E6EB" }}>
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "#E4E6EB" }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: drillDownCategory.color + "20", color: drillDownCategory.color }}>
                    <IconDisplay name={drillDownCategory.icon} size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#050505]">{drillDownCategory.label}</h3>
                    <p className="text-[11px]" style={{ color: "#65676B" }}>{catCount} dari {summary.total} leads ({catPct}%)</p>
                  </div>
                </div>
                <button onClick={() => setDrillDownCategory(null)} className="p-1 rounded-lg hover:bg-[#F2F3F5]" style={{ color: "#65676B" }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold" style={{ color: "#050505" }}>Total Leads</span>
                    <span className="text-xs font-bold" style={{ color: drillDownCategory.color }}>{catCount} ({catPct}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: FB.grayBg }}>
                    <div className="h-full rounded-full" style={{ width: `${catPct}%`, backgroundColor: drillDownCategory.color }} />
                  </div>
                </div>

                <h4 className="text-xs font-semibold mb-3" style={{ color: "#050505" }}>Perangkat</h4>

                {deviceBreakdown.length === 0 ? (
                  <div className="text-center py-8 text-sm" style={{ color: "#65676B" }}>Tidak ada data perangkat</div>
                ) : (
                  <>
                    <div className="space-y-2 mb-4">
                      {deviceBreakdown.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: colors[i % colors.length] }}>
                            {d.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-medium truncate" style={{ color: "#050505" }}>{d.name}</span>
                              <span className="text-xs font-semibold shrink-0 ml-2" style={{ color: colors[i % colors.length] }}>{d.value} ({d.pct}%)</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: FB.grayBg }}>
                              <div className="h-full rounded-full" style={{ width: `${d.pct}%`, backgroundColor: colors[i % colors.length] }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ height: Math.max(120, deviceBreakdown.length * 40) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deviceBreakdown} layout="vertical" margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E4E6EB" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: "#65676B" }} axisLine={false} tickLine={false} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#65676B" }} axisLine={false} tickLine={false} width={60} />
                          <Tooltip contentStyle={{ border: "1px solid #E4E6EB", borderRadius: 8, fontSize: 12 }} />
                          <Bar dataKey="value" fill={drillDownCategory.color} radius={[0, 4, 4, 0]} name="Leads" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-xl border w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto" style={{ borderColor: "#E4E6EB" }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "#E4E6EB" }}>
              <h3 className="text-sm font-semibold text-[#050505]">
                {editingCatId ? "Edit Kategori" : "Tambah Kategori Baru"}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-1 rounded-lg hover:bg-[#F2F3F5]" style={{ color: "#65676B" }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b" style={{ borderColor: "#E4E6EB" }}>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input placeholder="Nama (contoh: usia)"
                  value={catForm.name}
                  onChange={e => setCatForm({ ...catForm, name: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                  className="px-3 py-2 text-sm border rounded-lg bg-white outline-none"
                  style={{ borderColor: "#E4E6EB" }} />
                <input placeholder="Label (contoh: Usia)"
                  value={catForm.label}
                  onChange={e => setCatForm({ ...catForm, label: e.target.value })}
                  className="px-3 py-2 text-sm border rounded-lg bg-white outline-none"
                  style={{ borderColor: "#E4E6EB" }} />
              </div>
              <div className="flex items-center gap-4 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: "#65676B" }}>Warna:</span>
                  <div className="flex gap-1">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setCatForm({ ...catForm, color: c })}
                        className="w-6 h-6 rounded-full border-2 transition-all"
                        style={{ backgroundColor: c, borderColor: catForm.color === c ? "#050505" : "transparent" }} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: "#65676B" }}>Icon:</span>
                  <div className="flex gap-1 flex-wrap max-w-xs">
                    {ICON_LIST.map(({ name, icon: Icon }) => (
                      <button key={name} onClick={() => setCatForm({ ...catForm, icon: name })}
                        className="w-7 h-7 flex items-center justify-center rounded-md border-2 transition-all hover:bg-[#F0F2F5]"
                        style={{ borderColor: catForm.icon === name ? "#1877F2" : "transparent" }}
                        title={name}>
                        <Icon size={14} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <label className="text-xs font-medium block mb-1" style={{ color: "#65676B" }}>Keywords (pisahkan dengan koma)</label>
                <textarea placeholder="usia, umur, terlalu muda, terlalu tua"
                  value={catForm.keywords}
                  onChange={e => setCatForm({ ...catForm, keywords: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white outline-none resize-none"
                  style={{ borderColor: "#E4E6EB" }} rows={2} />
              </div>
              <button onClick={handleSaveCategory}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg hover:brightness-110 transition-all"
                style={{ backgroundColor: "#1877F2" }}>
                <Save className="w-4 h-4" />
                {editingCatId ? "Simpan" : "Tambah"}
              </button>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-[#050505] mb-3">Daftar Kategori ({localCategories.length})</h3>
              {catLoading ? (
                <div className="text-center py-8 text-sm" style={{ color: "#65676B" }}>Memuat...</div>
              ) : localCategories.length === 0 ? (
                <div className="text-center py-8 text-sm" style={{ color: "#65676B" }}>Belum ada kategori</div>
              ) : (
                <div className="space-y-2">
                  {localCategories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border" style={{ borderColor: "#E4E6EB" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: cat.color + "20", color: cat.color }}>
                        {(() => {
                          const found = ICON_LIST.find(i => i.name === cat.icon);
                          if (found) return createElement(found.icon, { size: 16 });
                          return <span className="text-sm">{cat.icon || "📊"}</span>;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#050505]">{cat.label}</p>
                        <p className="text-xs" style={{ color: "#65676B" }}>
                          {cat.name}
                          {cat.keywords && Array.isArray(cat.keywords) && cat.keywords.length > 0 && (
                            <> &middot; Keywords: {cat.keywords.join(", ")}</>
                          )}
                        </p>
                      </div>
                      <button onClick={() => { handleEditCategory(cat); }} className="p-1.5 rounded-lg hover:bg-[#F2F3F5]" style={{ color: "#65676B" }} title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadAnalysisSection;
