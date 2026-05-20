import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSettings } from "../context/SettingsContext";
import {
  MessageSquare,
  CheckCircle,
  Smartphone,
  Send,
  Loader2,
  Search,
  MailCheck,
  Activity,
  Leaf,
  TrendingUp,
  Clock,
  Users,
} from "lucide-react";
import useStore from "../store/useStore";
import { ActivityChart, DeviceBarChart, SLAChart } from "./DashboardCharts";
import LiveFeed from "./LiveChatFeed";
import StatCard from "./StatCard";
import AIAnalyticSection from "./AIAnalyticSection";
import LabelSection from "./LabelSection";
import SocialLeadsSection from "./SocialLeadsSection";
import OverallLeadsCard from "./stats/OverallLeadsCard";
import ClosingStatCard from "./stats/ClosingStatCard";
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
  const [socialMediaData, setSocialMediaData] = useState<any[]>([]);
  const [loadingSocial, setLoadingSocial] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deviceLeadsData, setDeviceLeadsData] = useState([]);
  const [allLabels, setAllLabels] = useState<any[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [labelDeviceFilter, setLabelDeviceFilter] = useState("all");
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

  const fetchAllLabels = useCallback(async () => {
    setLoadingLabels(true);
    try {
      const token = localStorage.getItem("token");
      const baseApi = import.meta.env.VITE_API_URL.replace(/\/$/, "");
      const params = new URLSearchParams();
      if (activeFilter !== "Custom") {
        params.append("period", FILTER_MAP[activeFilter]);
      } else {
        params.append("startDate", appliedDates.start.replace("T", " ") + ":00");
        params.append("endDate", appliedDates.end.replace("T", " ") + ":59");
      }
      const res = await fetch(`${baseApi}/labels/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) { setAllLabels(json.data || []); setLoadingLabels(false); return; }
      }
      if (data.sessions.length > 0) {
        const allFetched: any[] = [];
        for (const session of data.sessions) {
          const r = await fetch(`${baseApi}/sessions/${session.id}/labels?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const d = await r.json();
          if (d.success) allFetched.push(...(d.data || []).map((l: any) => ({ ...l, sessionName: session.name, session_id: session.id })));
        }
        setAllLabels(allFetched);
      }
    } catch (err) { console.error("Fetch labels error:", err); }
    finally { setLoadingLabels(false); }
  }, [data.sessions, activeFilter, appliedDates]);

  const fetchSocialStats = useCallback(async () => {
    setLoadingSocial(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (activeFilter === "Custom") { params.append("startDate", appliedDates.start); params.append("endDate", appliedDates.end); }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/stats/social/media?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setSocialMediaData(json.data || []);
    } catch (err) { console.error("Fetch Social Error:", err); }
    finally { setLoadingSocial(false); }
  }, [activeFilter, appliedDates]);

  const totalClosingFromLabels = useMemo(() => {
    return allLabels.filter(l => l.name.toLowerCase().includes("closing")).reduce((acc, curr) => acc + (parseInt(curr.chat_count) || 0), 0);
  }, [allLabels]);

  useEffect(() => {
    (async () => {
      await Promise.all([fetchDashboard(true), fetchSocialStats(), fetchOverallLeads()]);
    })();
    if (activeFilter !== "Custom") {
      const intervalMs = settings.autoRefresh ? parseInt(settings.refreshInterval, 10) * 1000 : 0;
      if (intervalMs <= 0) return;
      const interval = setInterval(() => { fetchDashboard(false); fetchSocialStats(); fetchOverallLeads(); }, intervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchDashboard, fetchSocialStats, fetchOverallLeads, activeFilter, appliedDates, selectedDevice, settings.autoRefresh, settings.refreshInterval]);

  useEffect(() => {
    if (data.sessions.length > 0) fetchAllLabels();
  }, [data.sessions, fetchAllLabels]);

  const handleApplyCustomFilter = () => {
    setRefreshing(true);
    setAppliedDates({ start: tempDates.start, end: tempDates.end });
  };

  const slaData = useMemo(() => [
    { name: "Sesuai SLA", value: Math.max(0, (data.stats.pesanMasukToday || 0) - (data.stats.slowResponse || 0)), color: "#00a884" },
    { name: "Slow Response", value: data.stats.slowResponse || 0, color: "#f97316" },
    { name: "Tak Terjawab", value: data.stats.unanswered || 0, color: "#ef4444" },
  ], [data.stats]);

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

  const statCards = [
    { label: "Pesan Masuk", value: data.stats.pesanMasukToday || 0, icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Terkirim", value: data.stats.pesanKeluar || 0, icon: Send, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Leads Organik", value: data.stats.leadsOrganik || 0, icon: Leaf, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Leads Aktif", value: data.stats.leadAktif || 0, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Device Online", value: data.stats.deviceConnected || 0, icon: Smartphone, color: "text-violet-600", bg: "bg-violet-50" },
    {
      label: "Status", value: data.stats.deviceConnected > 0 ? "Online" : "Offline",
      icon: CheckCircle, color: data.stats.deviceConnected > 0 ? "text-emerald-600" : "text-red-600",
      bg: data.stats.deviceConnected > 0 ? "bg-emerald-50" : "bg-red-50",
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0F2F5" }}>
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#1877F2" }}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: "#050505" }}>
                Dashboard
                {refreshing && <Loader2 size={14} className="animate-spin" style={{ color: "#1877F2" }} />}
              </h1>
              <p className="text-xs" style={{ color: "#65676B" }}>Satu Pintu — Monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)}
              className="h-9 px-3 border rounded-lg text-xs font-medium outline-none text-gray-700"
              style={{ backgroundColor: "#FFFFFF", borderColor: "#CCD0D5" }}>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
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

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <ActivityChart data={data.chartData} dark={false} />
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

        <LabelSection isDarkMode={false} loadingLabels={loadingLabels} allLabels={allLabels}
          sessions={data.sessions} labelDeviceFilter={labelDeviceFilter} setLabelDeviceFilter={setLabelDeviceFilter} />
        <SocialLeadsSection isDarkMode={false} sessions={data.sessions} />
      </div>
    </div>
  );
};

export default StatDashboard;
