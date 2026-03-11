import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  MessageSquare,
  Users,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Send,
  Clock,
  Moon,
  Sun,
  Loader2,
  Search,
  MailCheck,
  TrendingUp,
  Palette,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
  XAxis,
  Tooltip,
} from "recharts";
import useStore from "../store/useStore";
import { ActivityChart, DeviceBarChart, SLAChart } from "./DashboardCharts";
import LiveFeed from "./LiveChatFeed";
import StatCard from "./StatCard";
import AIAnalyticSection from "./AIAnalyticSection";
import LabelSection from "./LabelSection";
import SocialLeadsSection from "./SocialLeadsSection";
import OverallLeadsCard from "./stats/OverallLeadsCard";
import ClosingStatCard from "./stats/ClosingStatCard";

const FILTER_MAP: Record<string, string> = {
  "Hari ini": "Hari ini",
  Kemarin: "Kemarin",
  Minggu: "Minggu",
  Bulan: "Bulan",
  Custom: "Custom",
};

const StatDashboard: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useStore();

  // Waktu Default
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

  // States
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

  // Label States
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

  // --- FITUR BACKGROUND IMAGE ---
  const themes = useMemo(
    () => [
      {
        name: "Deep Black",
        darkImg:
          "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop",
        lightImg:
          "https://images.unsplash.com/photo-1554034483-04fda0d3507b?q=80&w=2070&auto=format&fit=crop",
        cardDark: "bg-black/60",
        cardLight: "bg-white/80",
      },
      {
        name: "Cyber Punk",
        darkImg:
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
        lightImg:
          "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop",
        cardDark: "bg-[#0B141A]/70",
        cardLight: "bg-white/90",
      },
      {
        name: "Abstract Blue",
        darkImg:
          "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=2070&auto=format&fit=crop",
        lightImg:
          "https://images.unsplash.com/photo-1519750783826-e2420f4d687f?q=80&w=1974&auto=format&fit=crop",
        cardDark: "bg-slate-900/60",
        cardLight: "bg-white/85",
      },
      {
        name: "Emerald Nature",
        darkImg:
          "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=2070&auto=format&fit=crop",
        lightImg:
          "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=2074&auto=format&fit=crop",
        cardDark: "bg-emerald-950/60",
        cardLight: "bg-white/80",
      },
      {
        name: "Midnight Purple",
        darkImg:
          "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2071&auto=format&fit=crop",
        lightImg:
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop",
        cardDark: "bg-purple-950/60",
        cardLight: "bg-white/85",
      },
    ],
    [],
  );

  // Ambil data dari localStorage saat pertama kali render (Inisialisasi)
  const [themeIndex, setThemeIndex] = useState(() => {
    const saved = localStorage.getItem("dashboard-theme-index");
    return saved ? parseInt(saved, 10) : 0;
  });

  // Fungsi cycle yang otomatis menyimpan ke localStorage
  const cycleTheme = () => {
    setThemeIndex((prev) => {
      const next = (prev + 1) % themes.length;
      localStorage.setItem("dashboard-theme-index", next.toString());
      return next;
    });
  };

  const currentBgImg = isDarkMode
    ? themes[themeIndex].darkImg
    : themes[themeIndex].lightImg;
  const currentCardClass = isDarkMode
    ? themes[themeIndex].cardDark
    : themes[themeIndex].cardLight;

  // --- LOGIC FETCHING DASHBOARD ---
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

    params.append("period", FILTER_MAP[activeFilter]);

    if (activeFilter === "Custom" && appliedDates.start && appliedDates.end) {
      params.append("startDate", appliedDates.start.replace("T", " ") + ":00");
      params.append("endDate", appliedDates.end.replace("T", " ") + ":59");
    }

    const url = `${baseApi}/social/media/all/leads?${params.toString()}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const json = await res.json();

    // DEBUG: Cek struktur asli data dari backend di console browser
    console.log("Raw Backend Data:", json);

    if (json.success) {
      // 1. Set Summary Stats
      setOverallSummary({
        totalLeads: Number(json.summary?.totalLeads || 0),
        totalClosing: Number(json.summary?.totalClosing || 0),
        averageConversionRate: Number(json.summary?.averageConversionRate || 0),
      });

      // 2. Mapping Data untuk DeviceBarChart
      // Kita lakukan normalisasi properti agar sinkron dengan dataKey di Recharts
      const mappedDeviceData = (json.deviceData || []).map((device: any) => {
        // Logika pencarian nilai Leads yang fleksibel
        const leads = 
          device.lead_count ?? 
          device.totalLeads ?? 
          device.leads ?? 
          0;

        // Logika pencarian nilai Closing yang fleksibel (Masalah utama biasanya di sini)
        const closing = 
          device.closing_count ?? 
          device.totalClosing ?? 
          device.closing ?? 
          device.total_closing ?? 
          0;

        return {
          // Pastikan name adalah string
          name: (device.name || device.deviceName || "Unknown").toUpperCase(),
          // Pastikan nilai adalah Number agar Recharts bisa merender
          lead_count: Number(leads),
          closing_count: Number(closing),
        };
      });

      // DEBUG: Pastikan hasil mapping sudah memiliki 'closing_count' berbentuk angka
      console.log("Mapped Data for Chart:", mappedDeviceData);

      setDeviceLeadsData(mappedDeviceData);
    }
  } catch (err) {
    console.error("Fetch Overall Leads Error:", err);
  } finally {
    setLoadingSocial(false);
  }
}, [activeFilter, appliedDates]);



  // --- LOGIC FETCHING LABELS ---
  const fetchAllLabels = useCallback(async () => {
    setLoadingLabels(true);
    try {
      const token = localStorage.getItem("token");
      const baseApi = import.meta.env.VITE_API_URL.replace(/\/$/, "");

      // 1. Siapkan Parameter Filter
      const params = new URLSearchParams();

      // Gunakan FILTER_MAP yang sama dengan fetchDashboard
      if (activeFilter !== "Custom") {
        params.append("period", FILTER_MAP[activeFilter]);
      } else {
        // Jika Custom, kirim rentang waktu lengkap (tanggal + jam)
        params.append(
          "startDate",
          appliedDates.start.replace("T", " ") + ":00",
        );
        params.append("endDate", appliedDates.end.replace("T", " ") + ":59");
      }

      // 2. Mencoba endpoint global terlebih dahulu
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

      // 3. Fallback: Jika endpoint global tidak ada, fetch per session yang aktif
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
  }, [data.sessions, activeFilter, appliedDates]); // Tambahkan activeFilter & appliedDates di sini

  const fetchSocialStats = useCallback(async () => {
    setLoadingSocial(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      // Sesuaikan filter tanggal jika diperlukan
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

  // Hitung total closing berdasarkan label yang mengandung kata "closing"
  const totalClosingFromLabels = useMemo(() => {
    return allLabels
      .filter((label) => label.name.toLowerCase().includes("closing"))
      .reduce((acc, curr) => acc + (parseInt(curr.chat_count) || 0), 0);
  }, [allLabels]);

  const conversionRate = useMemo(() => {
    // Hitung total leads dengan aman
    const totalLeads =
      socialMediaData?.reduce((acc, curr) => {
        return acc + (Number(curr.totalLeads) || 0);
      }, 0) || 0;

    if (totalLeads === 0) return "0";

    // Hitung rasio
    const rate = (totalClosingFromLabels / totalLeads) * 100;
    return rate.toFixed(1);
  }, [socialMediaData, totalClosingFromLabels]);

// Pastikan useEffect untuk Refreshing terlihat seperti ini
useEffect(() => {
  // Jalankan fetch awal
  const loadData = async () => {
    await Promise.all([
      fetchDashboard(true),
      fetchSocialStats(),
      fetchOverallLeads()
    ]);
  };
  loadData();

  // Logika Interval yang aman
  if (activeFilter !== "Custom") {
    const interval = setInterval(() => {
      // Panggil tanpa Loader agar tidak mengganggu UI (Silent Refresh)
      fetchDashboard(false); 
      fetchSocialStats();
      fetchOverallLeads();
    }, 30000);

    return () => clearInterval(interval);
  }
}, [fetchDashboard, fetchSocialStats, fetchOverallLeads, activeFilter, appliedDates]);


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
      <div
        className={`flex-1 flex items-center justify-center min-h-screen ${isDarkMode ? "bg-[#0B141A]" : "bg-[#F0F2F5]"}`}
      >
        <Loader2 className="text-[#00a884] animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div
      className="flex-1 p-4 md:p-8 overflow-y-auto transition-all duration-700 bg-cover bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,${isDarkMode ? 0.7 : 0.2}), rgba(0,0,0,${isDarkMode ? 0.7 : 0.2})), url(${currentBgImg})`,
      }}
    >
      <div className="max-w-7xl mx-auto mb-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
          <div>
            <h1
              className={`text-2xl font-black uppercase flex items-center gap-3 ${isDarkMode ? "text-white" : "text-[#3B4A54]"}`}
            >
              SATU PINTU{" "}
              {refreshing && (
                <Loader2 size={18} className="animate-spin text-[#00a884]" />
              )}
            </h1>
            <p
              className={`text-[9px] font-bold tracking-widest uppercase mt-1 ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}
            >
              Monitoring Dashboard
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-fit">
            {/* Tombol Ganti Background */}
            <button
              onClick={cycleTheme}
              className={`p-2.5 rounded-xl border transition-all ${isDarkMode ? "bg-black/40 border-white/10 text-emerald-400" : "bg-white border-gray-200 text-emerald-600"}`}
            >
              <Palette size={16} />
            </button>
            <button
              onClick={toggleDarkMode}
              className={`p-2.5 rounded-xl border ${isDarkMode ? "bg-[#202C33] border-[#313D45] text-yellow-400" : "bg-white border-[#E9EDEF] text-gray-600"}`}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className={`pl-4 pr-10 py-2.5 border rounded-xl text-[11px] font-bold outline-none ${isDarkMode ? "bg-[#202C33] border-[#313D45] text-white" : "bg-white border-[#E9EDEF] text-[#3B4A54]"}`}
            >
              <option value="all">SEMUA DEVICE</option>
              {data.sessions.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name.toUpperCase()}
                </option>
              ))}
            </select>

            <div
              className={`flex items-center p-1 rounded-xl border ${isDarkMode ? "bg-[#202C33] border-[#313D45]" : "bg-white border-[#E9EDEF]"}`}
            >
              {Object.keys(FILTER_MAP).map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setActiveFilter(item);
                    setRefreshing(true);
                  }}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeFilter === item ? "bg-[#00a884] text-white shadow-md" : isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Date Filter */}
        {activeFilter === "Custom" && (
          <div className="flex justify-end mb-6 animate-in fade-in slide-in-from-top-2">
            <div
              className={`flex flex-col md:flex-row items-center gap-4 p-4 rounded-2xl border ${isDarkMode ? "bg-[#202C33] border-[#313D45]" : "bg-white border-[#E9EDEF] shadow-sm"}`}
            >
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="datetime-local"
                  value={tempDates.start}
                  onChange={(e) =>
                    setTempDates({ ...tempDates, start: e.target.value })
                  }
                  className={`bg-transparent text-xs font-bold outline-none ${isDarkMode ? "text-white [color-scheme:dark]" : "text-[#3B4A54]"}`}
                />
                <input
                  type="datetime-local"
                  value={tempDates.end}
                  onChange={(e) =>
                    setTempDates({ ...tempDates, end: e.target.value })
                  }
                  className={`bg-transparent text-xs font-bold outline-none ${isDarkMode ? "text-white [color-scheme:dark]" : "text-[#3B4A54]"}`}
                />
              </div>
              <button
                onClick={handleApplyCustomFilter}
                className="bg-[#00a884] hover:bg-[#008f6f] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all shadow-lg"
              >
                <Search size={14} /> Terapkan
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto">
        <AIAnalyticSection stats={data.stats} dark={isDarkMode} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <ActivityChart data={data.chartData} dark={isDarkMode} />
          <SLAChart data={slaData} dark={isDarkMode} />
          <DeviceBarChart
            data={deviceLeadsData} // Data ini harus berisi hasil fetch terbaru yang sudah difilter
            dark={isDarkMode}
          />
        </div>

        {/* --- KOMPONEN LABEL YANG DIPISAH --- */}
        <LabelSection
          isDarkMode={isDarkMode}
          loadingLabels={loadingLabels}
          allLabels={allLabels}
          sessions={data.sessions}
          labelDeviceFilter={labelDeviceFilter}
          setLabelDeviceFilter={setLabelDeviceFilter}
        />
        <SocialLeadsSection isDarkMode={isDarkMode} sessions={data.sessions} />

        {/* Stats Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 pb-6">
          <LiveFeed
            messages={data.messages}
            totalPesan={data.stats.pesanMasukAllTime}
            dark={isDarkMode}
          />
          {/* Stat Card Closing dengan Grafik Dinamis */}
          <ClosingStatCard
            isDarkMode={isDarkMode}
            loading={loadingSocial}
            totalClosing={overallSummary.totalClosing}
            conversionRate={overallSummary.averageConversionRate}
            totalLeads={overallSummary.totalLeads}
            chartData={data?.chartData || []} // Pastikan data grafik tersedia di state utama
          />
          <OverallLeadsCard
            isDarkMode={isDarkMode}
            loading={loadingSocial}
            totalLeads={overallSummary.totalLeads}
            totalClosing={overallSummary.totalClosing}
            conversionRate={overallSummary.averageConversionRate}
          />

          <StatCard
            dark={isDarkMode}
            title={`Masuk ${activeFilter}`}
            value={data.stats.pesanMasukToday}
            icon={MessageSquare}
            color="text-[#00a884]"
          />
          <StatCard
            dark={isDarkMode}
            title="Pesan Terkirim"
            value={data.stats.pesanKeluar}
            icon={Send}
            color="text-orange-500"
          />

          <StatCard
            dark={isDarkMode}
            title="Leads Aktif"
            value={data.stats.leadAktif}
            icon={MailCheck}
            color="text-blue-500"
          />
          <StatCard
            dark={isDarkMode}
            title="Slow Response"
            value={data.stats.slowResponse}
            icon={Clock}
            color="text-red-500"
          />
          <StatCard
            dark={isDarkMode}
            title="Tak Terjawab"
            value={data.stats.unanswered}
            icon={AlertCircle}
            color="text-gray-400"
          />
          <StatCard
            dark={isDarkMode}
            title="Device Online"
            value={data.stats.deviceConnected}
            subValue={`Dari ${data.stats.totalDevice} Device`}
            icon={Smartphone}
            color="text-indigo-400"
          />
          <StatCard
            dark={isDarkMode}
            title="Status"
            value={data.stats.deviceConnected > 0 ? "STABIL" : "OFFLINE"}
            icon={CheckCircle}
            color={
              data.stats.deviceConnected > 0 ? "text-[#00a884]" : "text-red-500"
            }
          />
        </div>
      </div>
    </div>
  );
};

export default StatDashboard;
