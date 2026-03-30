import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  MessageSquare,
  CheckCircle,
  Smartphone,
  Send,
  Moon,
  Sun,
  Loader2,
  Search,
  MailCheck,
  Activity,
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

const StatDashboard: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useStore();

  const now = new Date();
  const todayStart = new Date(new Date(now).setHours(0, 0, 0, 0))
    .toISOString()
    .slice(0, 16);
  const todayEnd = new Date(new Date(now).setHours(23, 59, 59, 999))
    .toISOString()
    .slice(0, 16);

  const [overallSummary, setOverallSummary] = useState({
    totalLeads: 0,
    totalClosing: 0,
    averageConversionRate: 0,
  });

  const [activeFilter, setActiveFilter] = useState("Hari ini");
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [tempDates, setTempDates] = useState({
    start: todayStart,
    end: todayEnd,
  });
  const [appliedDates, setAppliedDates] = useState({
    start: todayStart,
    end: todayEnd,
  });
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
      pesanMasukAllTime: 0,
      pesanMasukToday: 0,
      pesanKeluar: 0,
      totalDevice: 0,
      deviceConnected: 0,
      leadMasuk: 0,
      leadAktif: 0,
      slowResponse: 0,
      unanswered: 0,
    },
    messages: [],
    sessions: [],
    chartData: [],
    deviceStats: [],
  });

  const fetchDashboard = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) setLoading(true);
        const token = localStorage.getItem("token");
        const params = new URLSearchParams();
        params.append("period", FILTER_MAP[activeFilter]);

        if (selectedDevice !== "all")
          params.append("sessionId", selectedDevice);

        if (activeFilter === "Custom") {
          params.append(
            "startDate",
            appliedDates.start.replace("T", " ") + ":00",
          );
          params.append("endDate", appliedDates.end.replace("T", " ") + ":59");
        }

        const url = `${import.meta.env.VITE_API_URL}/stats/dashboard?${params.toString()}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const json = await res.json();
        if (json.success) {
          setData({
            stats: json.stats,
            messages: json.messages || [],
            sessions: json.devices || [],
            chartData: json.chartData || [],
            deviceStats: json.deviceStats || [],
          });
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeFilter, selectedDevice, appliedDates],
  );

  const fetchOverallLeads = useCallback(async () => {
    setLoadingSocial(true);
    try {
      const token = localStorage.getItem("token");
      const baseApi = import.meta.env.VITE_API_URL.replace(/\/$/, "");
      const params = new URLSearchParams();

      if (selectedDevice !== "all") {
        params.append("sessionId", selectedDevice);
      }

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

      const url = `${baseApi}/social/media/all/leads?${params.toString()}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const json = await res.json();

      if (json.success) {
        setOverallSummary({
          totalLeads: Number(json.summary?.totalLeads || 0),
          totalClosing: Number(json.summary?.totalClosing || 0),
          averageConversionRate: Number(json.summary?.averageConversionRate || 0),
        });

        const mappedDeviceData = (json.deviceData || []).map((device: any) => ({
          name: (device.name || "Unknown").toUpperCase(),
          lead_count: Number(device.lead_count || 0),
          closing_count: Number(device.closing_count || 0),
        }));

        setDeviceLeadsData(mappedDeviceData);
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
        params.append(
          "startDate",
          appliedDates.start.replace("T", " ") + ":00",
        );
        params.append("endDate", appliedDates.end.replace("T", " ") + ":59");
      }

      const res = await fetch(`${baseApi}/labels/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setAllLabels(json.data || []);
          return;
        }
      }

      if (data.sessions.length > 0) {
        const allFetched: any[] = [];
        for (const session of data.sessions) {
          try {
            const r = await fetch(
              `${baseApi}/sessions/${session.id}/labels?${params.toString()}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            const d = await r.json();
            if (d.success) {
              allFetched.push(
                ...(d.data || []).map((l: any) => ({
                  ...l,
                  sessionName: session.name,
                  session_id: session.id,
                })),
              );
            }
          } catch (e) {
            console.error("Session label error", e);
          }
        }
        setAllLabels(allFetched);
      }
    } catch (err) {
      console.error("Fetch labels error:", err);
    } finally {
      setLoadingLabels(false);
    }
  }, [data.sessions, activeFilter, appliedDates]);

  const fetchSocialStats = useCallback(async () => {
    setLoadingSocial(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (activeFilter === "Custom") {
        params.append("startDate", appliedDates.start);
        params.append("endDate", appliedDates.end);
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/stats/social/media?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const json = await res.json();
      if (json.success) {
        setSocialMediaData(json.data || []);
      }
    } catch (err) {
      console.error("Fetch Social Error:", err);
    } finally {
      setLoadingSocial(false);
    }
  }, [activeFilter, appliedDates]);

  const totalClosingFromLabels = useMemo(() => {
    return allLabels
      .filter((label) => label.name.toLowerCase().includes("closing"))
      .reduce((acc, curr) => acc + (parseInt(curr.chat_count) || 0), 0);
  }, [allLabels]);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchDashboard(true),
        fetchSocialStats(),
        fetchOverallLeads()
      ]);
    };
    loadData();

    if (activeFilter !== "Custom") {
      const interval = setInterval(() => {
        fetchDashboard(false); 
        fetchSocialStats();
        fetchOverallLeads();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchDashboard, fetchSocialStats, fetchOverallLeads, activeFilter, appliedDates, selectedDevice]);

  useEffect(() => {
    if (data.sessions.length > 0) {
      fetchAllLabels();
    }
  }, [data.sessions, fetchAllLabels]);

  const handleApplyCustomFilter = () => {
    setRefreshing(true);
    setAppliedDates({ start: tempDates.start, end: tempDates.end });
  };

  const slaData = useMemo(
    () => [
      {
        name: "Sesuai SLA",
        value: Math.max(
          0,
          (data.stats.pesanMasukToday || 0) - (data.stats.slowResponse || 0),
        ),
        color: "#00a884",
      },
      {
        name: "Slow Response",
        value: data.stats.slowResponse || 0,
        color: "#f97316",
      },
      {
        name: "Tak Terjawab",
        value: data.stats.unanswered || 0,
        color: "#ef4444",
      },
    ],
    [data.stats],
  );

  if (loading && !data.stats.pesanMasukAllTime) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-700 text-sm font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                Dashboard Monitoring
                {refreshing && (
                  <Loader2 size={18} className="animate-spin text-blue-500" />
                )}
              </h1>
              <p className="text-gray-600 text-sm mt-0.5 font-medium">
                Satu Pintu - Monitoring Dashboard
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 text-slate-700"
            >
              <option value="all">SEMUA DEVICE</option>
              {data.sessions.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name.toUpperCase()}
                </option>
              ))}
            </select>

            <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl">
              {Object.keys(FILTER_MAP).map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setActiveFilter(item);
                    setRefreshing(true);
                  }}
                  className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase transition-all ${
                    activeFilter === item
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              onClick={toggleDarkMode}
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-all"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Custom Date Filter */}
        {activeFilter === "Custom" && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col md:flex-row items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700">Tanggal Mulai</label>
                  <input
                    type="datetime-local"
                    value={tempDates.start}
                    onChange={(e) =>
                      setTempDates({ ...tempDates, start: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium outline-none focus:border-blue-500 text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700">Tanggal Akhir</label>
                  <input
                    type="datetime-local"
                    value={tempDates.end}
                    onChange={(e) =>
                      setTempDates({ ...tempDates, end: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium outline-none focus:border-blue-500 text-slate-700"
                  />
                </div>
              </div>
              <Button
                onClick={handleApplyCustomFilter}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg gap-2"
              >
                <Search size={14} />
                Terapkan Filter
              </Button>
            </div>
          </div>
        )}

        {/* AI Analytic Section */}
        <AIAnalyticSection stats={data.stats} dark={false} />

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.stats.pesanMasukToday || 0}</p>
                <p className="text-xs text-gray-600 font-medium">Pesan Masuk {activeFilter}</p>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Send className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.stats.pesanKeluar || 0}</p>
                <p className="text-xs text-gray-600 font-medium">Pesan Terkirim</p>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <MailCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.stats.leadAktif || 0}</p>
                <p className="text-xs text-gray-600 font-medium">Leads Aktif</p>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.stats.deviceConnected || 0}</p>
                <p className="text-xs text-gray-600 font-medium">Device Online</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500">dari {data.stats.totalDevice || 0} device</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${data.stats.deviceConnected > 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                <CheckCircle className={`w-5 h-5 ${data.stats.deviceConnected > 0 ? 'text-emerald-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className={`text-lg font-bold ${data.stats.deviceConnected > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {data.stats.deviceConnected > 0 ? 'STABIL' : 'OFFLINE'}
                </p>
                <p className="text-xs text-gray-600 font-medium">Status Sistem</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <ActivityChart data={data.chartData} dark={false} />
          <SLAChart data={slaData} dark={false} />
          <DeviceBarChart
            data={deviceLeadsData}
            dark={false}
          />
        </div>

        {/* Bottom Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <LiveFeed
            messages={data.messages}
            totalPesan={data.stats.pesanMasukAllTime}
            dark={false}
          />
          <ClosingStatCard
            isDarkMode={false}
            loading={loadingSocial}
            totalClosing={overallSummary.totalClosing}
            conversionRate={overallSummary.averageConversionRate}
            totalLeads={overallSummary.totalLeads}
            chartData={data?.chartData || []}
          />
          <OverallLeadsCard
            isDarkMode={false}
            loading={loadingSocial}
            totalLeads={overallSummary.totalLeads}
            totalClosing={overallSummary.totalClosing}
            conversionRate={overallSummary.averageConversionRate}
          />
        </div>

        {/* Label & Social Sections */}
        <LabelSection
          isDarkMode={false}
          loadingLabels={loadingLabels}
          allLabels={allLabels}
          sessions={data.sessions}
          labelDeviceFilter={labelDeviceFilter}
          setLabelDeviceFilter={setLabelDeviceFilter}
        />
        <SocialLeadsSection isDarkMode={false} sessions={data.sessions} />
      </div>
    </div>
  );
};

export default StatDashboard;
