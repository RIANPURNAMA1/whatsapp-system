import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import {
  CheckCircle,
  Smartphone,
  Loader2,
  Search,
  MailCheck,
  Activity,
  Leaf,
  TrendingUp,
  Clock,
  Users,
  Timer,
  Package,
  MessageSquare,
  Bot,
  Sparkles,
} from "lucide-react";
import useStore from "../store/useStore";
import { LeadsActivityChart, DeviceBarChart, SLAChart } from "./DashboardCharts";
import LiveFeed from "./LiveChatFeed";
import StatCard from "./StatCard";
import AIAnalyticSection from "./AIAnalyticSection";
import OverallLeadsCard from "./stats/OverallLeadsCard";
import SocialLeadsSection from "./SocialLeadsSection";
import { BarChart3 } from "lucide-react";
import ClosingStatCard from "./stats/ClosingStatCard";

import AIAssistantModal from "./AIAssistantModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FILTER_MAP: Record<string, string> = {
  "Hari ini": "Hari ini",
  Kemarin: "Kemarin",
  Minggu: "Minggu",
  Bulan: "Bulan",
  Custom: "Custom",
};

interface StatDashboardProps {
  onNavigate?: (tab: string) => void;
}

const StatDashboard: React.FC<StatDashboardProps> = ({ onNavigate }) => {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const now = new Date();
  const todayStart = new Date(new Date(now).setHours(0, 0, 0, 0)).toISOString().slice(0, 16);
  const todayEnd = new Date(new Date(now).setHours(23, 59, 59, 999)).toISOString().slice(0, 16);

  const [overallSummary, setOverallSummary] = useState({
    totalLeads: 0, totalClosing: 0, averageConversionRate: 0, totalOrganik: 0,
  });
  const [activeFilter, setActiveFilter] = useState("Hari ini");
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [tempDates, setTempDates] = useState({ start: todayStart, end: todayEnd });
  const [appliedDates, setAppliedDates] = useState({ start: todayStart, end: todayEnd });
  const [loading, setLoading] = useState(true);
  const [loadingSocial, setLoadingSocial] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deviceLeadsData, setDeviceLeadsData] = useState([]);
  const [leadProducts, setLeadProducts] = useState<any[]>([]);

  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [data, setData] = useState<any>({
    stats: {
      pesanMasukAllTime: 0, pesanMasukToday: 0, pesanKeluar: 0,
      totalDevice: 0, deviceConnected: 0, leadMasuk: 0, leadAktif: 0,
      slowResponse: 0, unanswered: 0, leadsOrganik: 0,
    },
    messages: [], sessions: [], chartData: [], deviceStats: [],
  });

  const fetchDashboard = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("period", FILTER_MAP[activeFilter]);
      if (selectedDevice !== "all") params.append("sessionId", selectedDevice);
      if (activeFilter === "Custom") {
        params.append("startDate", appliedDates.start.replace("T", " ") + ":00");
        params.append("endDate", appliedDates.end.replace("T", " ") + ":59");
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/stats/dashboard?${params}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.success) {
        setData({
          stats: json.stats, messages: json.messages || [],
          sessions: json.devices || [], chartData: json.chartData || [],
          deviceStats: json.deviceStats || [],
        });
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, selectedDevice, appliedDates]);

  const fetchOverallLeads = useCallback(async () => {
    setLoadingSocial(true);
    try {
      const token = localStorage.getItem("token");
      const baseApi = import.meta.env.VITE_API_URL.replace(/\/$/, "");
      const params = new URLSearchParams();
      if (selectedDevice !== "all") params.append("sessionId", selectedDevice);
      if (activeFilter === "Custom" && appliedDates.start && appliedDates.end) {
        const [startDate, startTime] = appliedDates.start.split("T");
        const [endDate, endTime] = appliedDates.end.split("T");
        params.append("startDate", startDate);
        params.append("startTime", startTime + ":00");
        params.append("endDate", endDate);
        params.append("endTime", endTime + ":59");
      } else {
        params.append("period", FILTER_MAP[activeFilter]);
      }
      const res = await fetch(`${baseApi}/social/media/all/leads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        const allOrganik = (json.deviceData || []).reduce((acc: number, d: any) => acc + (Number(d.leads_organik) || 0), 0);
        setOverallSummary({
          totalLeads: Number(json.summary?.totalLeads || 0),
          totalClosing: Number(json.summary?.totalClosing || 0),
          averageConversionRate: Number(json.summary?.averageConversionRate || 0),
          totalOrganik: allOrganik,
        });
        setDeviceLeadsData((json.deviceData || []).map((d: any) => ({
          name: (d.name || "Unknown").toUpperCase(),
          lead_count: Number(d.lead_count || 0),
          closing_count: Number(d.closing_count || 0),
          leads_organik: Number(d.leads_organik || 0),
        })));
      }
    } catch (err) {
      console.error("Fetch Overall Leads Error:", err);
    } finally {
      setLoadingSocial(false);
    }
  }, [activeFilter, appliedDates, selectedDevice]);

  const fetchLeadProducts = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      const period = FILTER_MAP[activeFilter];
      if (period === "Hari ini") params.append("date_filter", "hari_ini");
      else if (period === "Kemarin") params.append("date_filter", "kemarin");
      else if (period === "Minggu") params.append("date_filter", "minggu_ini");
      else if (period === "Bulan") params.append("date_filter", "bulan_ini");
      else if (period === "Custom" && appliedDates.start && appliedDates.end) {
        params.append("date_filter", "custom");
        params.append("start_date", appliedDates.start.slice(0, 10));
        params.append("end_date", appliedDates.end.slice(0, 10));
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/lead-products/stats?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setLeadProducts(json.data || []);
    } catch {}
  }, [activeFilter, appliedDates]);

  useEffect(() => {
    (async () => {
      await Promise.all([fetchDashboard(true), fetchOverallLeads(), fetchLeadProducts()]);
    })();
    if (activeFilter !== "Custom") {
      const intervalMs = settings.autoRefresh ? parseInt(settings.refreshInterval, 10) * 1000 : 0;
      if (intervalMs <= 0) return;
      const interval = setInterval(() => { fetchDashboard(false); fetchOverallLeads(); fetchLeadProducts(); }, intervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchDashboard, fetchOverallLeads, fetchLeadProducts, activeFilter, appliedDates, selectedDevice, settings.autoRefresh, settings.refreshInterval]);

  const sessionIdsKey = useMemo(() => data.sessions.map((s: any) => s.id).join(","), [data.sessions]);
  const stableSessions = useMemo(() => data.sessions, [sessionIdsKey]);

  const handleApplyCustomFilter = () => {
    setRefreshing(true);
    setAppliedDates({ start: tempDates.start, end: tempDates.end });
  };

  const slaData = useMemo(() => [
    { name: "Sesuai SLA", value: Math.max(0, (data.stats.pesanMasukToday || 0) - (data.stats.slowResponse || 0)), color: "#00a884" },
    { name: "Slow Response", value: data.stats.slowResponse || 0, color: "#f97316" },
    { name: "Tak Terjawab", value: data.stats.unanswered || 0, color: "#ef4444" },
  ], [data.stats]);

  const statCards = useMemo(() => [
    { label: "Leads Organik", value: data.stats.leadsOrganik || 0, icon: Leaf, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Leads Aktif", value: data.stats.leadAktif || 0, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Device Online", value: data.stats.deviceConnected || 0, icon: Smartphone, color: "text-violet-600", bg: "bg-violet-50" },
    {
      label: "Status", value: data.stats.deviceConnected > 0 ? "Online" : "Offline",
      icon: CheckCircle, color: data.stats.deviceConnected > 0 ? "text-emerald-600" : "text-red-600",
      bg: data.stats.deviceConnected > 0 ? "bg-emerald-50" : "bg-red-50",
    },
  ], [data.stats.leadsOrganik, data.stats.leadAktif, data.stats.deviceConnected]);

  if (loading && !data.stats.pesanMasukAllTime) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F0F2F5" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] rounded-full animate-spin" style={{ borderColor: "#E4E6EB", borderTopColor: "#1877F2" }} />
          <p className="text-sm" style={{ color: "#65676B" }}>Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0F2F5" }}>
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Header */}
        <div className="mb-5 space-y-3">
          {/* Row 1: Title + monitoring text */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#1877F2" }}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: "#050505" }}>
                Dashboard
                {refreshing && <Loader2 size={14} className="animate-spin" style={{ color: "#1877F2" }} />}
              </h1>
              <p className="text-xs truncate" style={{ color: "#65676B" }}>Satu Pintu — Monitoring</p>
            </div>
          </div>

          {/* Row 2: Action buttons — responsive wrap */}
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => navigate("/live-analytics")}
              className="h-9 px-3 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shrink-0 border"
              style={{ borderColor: "#CCD0D5", color: "#050505", backgroundColor: "#FFFFFF" }}>
              <BarChart3 className="w-3.5 h-3.5" />
              Live TikTok
            </button>
            <button onClick={() => navigate("/analisis-leads")}
              className="h-9 px-3 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shrink-0 border"
              style={{ borderColor: "#CCD0D5", color: "#050505", backgroundColor: "#FFFFFF" }}>
              <BarChart3 className="w-3.5 h-3.5" />
              Analisis Leads
            </button>
            <button onClick={() => navigate("/traffic-closing")}
              className="h-9 px-3 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shrink-0 border"
              style={{ borderColor: "#CCD0D5", color: "#050505", backgroundColor: "#FFFFFF" }}>
              <Timer className="w-3.5 h-3.5" />
              Trafik & Penutupan
            </button>
            {/* Filter controls inline on desktop, wrap on mobile */}
            <div className="flex items-center gap-2 flex-wrap ml-auto">
              <select value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)}
                className="h-9 px-3 border rounded-lg text-xs font-medium outline-none text-gray-700 bg-white"
                style={{ borderColor: "#CCD0D5" }}>
                <option value="all">Semua Device</option>
                {data.sessions.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              <div className="flex h-9 bg-white border rounded-lg overflow-hidden" style={{ borderColor: "#CCD0D5" }}>
                {Object.keys(FILTER_MAP).map(item => (
                  <button key={item} onClick={() => { setActiveFilter(item); setRefreshing(true); }}
                    className={`px-3 text-[11px] font-semibold transition-all ${
                      activeFilter === item
                        ? "text-white"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                    style={activeFilter === item ? { backgroundColor: "#1877F2", color: "#FFFFFF" } : {}}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Custom Date Filter */}
        {activeFilter === "Custom" && (
          <div className="mb-5 bg-white border rounded-lg p-4" style={{ borderColor: "#E4E6EB" }}>
            <div className="flex flex-col md:flex-row items-center gap-3">
              <input type="datetime-local" value={tempDates.start} onChange={e => setTempDates({ ...tempDates, start: e.target.value })}
                className="flex-1 w-full h-9 px-3 border rounded-lg text-xs outline-none"
                style={{ backgroundColor: "#F0F2F5", borderColor: "#CCD0D5" }} />
              <span className="text-xs hidden md:block" style={{ color: "#65676B" }}>—</span>
              <input type="datetime-local" value={tempDates.end} onChange={e => setTempDates({ ...tempDates, end: e.target.value })}
                className="flex-1 w-full h-9 px-3 border rounded-lg text-xs outline-none"
                style={{ backgroundColor: "#F0F2F5", borderColor: "#CCD0D5" }} />
              <button onClick={handleApplyCustomFilter}
                className="h-9 px-4 text-white text-xs font-semibold rounded-lg transition-all shrink-0"
                style={{ backgroundColor: "#1877F2" }}>
                Terapkan
              </button>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {statCards.map((card, i) => (
            <div key={i} className="bg-white rounded-lg border p-4" style={{ borderColor: "#E4E6EB" }}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-tight" style={{ color: "#050505" }}>
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </p>
                  <p className="text-[11px] font-medium truncate" style={{ color: "#65676B" }}>{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Social Leads Section */}
        <SocialLeadsSection
          isDarkMode={false}
          sessions={data.sessions}
          activeFilter={activeFilter}
          appliedDates={appliedDates}
          selectedDevice={selectedDevice}
        />

        {/* Leads Product Section */}
        {leadProducts.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Package size={16} style={{ color: "#1877F2" }} />
              <span className="text-[13px] font-bold" style={{ color: "#050505" }}>Leads Product</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {leadProducts.map((p: any) => (
                <div key={p.id} className="bg-white rounded-lg border p-4" style={{ borderColor: "#E4E6EB" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Package size={14} style={{ color: "#1877F2" }} />
                    <span className="font-bold text-[14px] truncate" style={{ color: "#050505" }}>{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px]" style={{ color: "#65676B" }}>Leads:</span>
                    <span className="font-semibold text-[13px]" style={{ color: "#1877F2" }}>{p.total_leads}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px]" style={{ color: "#8C939D" }}>
                    <Smartphone size={11} />
                    {p.session_name || "Semua Device"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <LeadsActivityChart data={data.chartData} dark={false} />
          <SLAChart data={slaData} dark={false} />
          <DeviceBarChart data={deviceLeadsData} dark={false} />
        </div>

        {/* Bottom */}
        <div className="mb-6 space-y-4">
          <LiveFeed messages={data.messages} totalPesan={data.stats.pesanMasukAllTime} dark={false} onNavigate={onNavigate} sessions={data.sessions} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ClosingStatCard isDarkMode={false} loading={loadingSocial} totalClosing={overallSummary.totalClosing}
              conversionRate={overallSummary.averageConversionRate} totalLeads={overallSummary.totalLeads} deviceData={deviceLeadsData} />
            <OverallLeadsCard isDarkMode={false} loading={loadingSocial} totalLeads={overallSummary.totalLeads}
              totalClosing={overallSummary.totalClosing} conversionRate={overallSummary.averageConversionRate} />
          </div>
        </div>
      </div>

      <AIAssistantModal open={showAIAssistant} onClose={() => setShowAIAssistant(false)} />

      {/* Floating AI Assistant Button */}
      <button
        onClick={() => setShowAIAssistant(true)}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 hover:shadow-xl active:scale-95"
        style={{ backgroundColor: "#1877F2" }}
        title="Asisten AI"
      >
        <Bot className="w-6 h-6 text-white" />
      </button>
    </div>
  );
};

export default StatDashboard;
