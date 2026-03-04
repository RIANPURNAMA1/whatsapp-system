import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  MessageSquare,
  Users,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Send,
  Clock,
  Activity,
  RotateCcw,
  Moon,
  Sun,
  Calendar,
  Loader2,
} from "lucide-react";
import useStore from "../store/useStore";
import { ActivityChart, DeviceBarChart, SLAChart } from "./DashboardCharts";
import LiveFeed from "./LiveChatFeed";
import StatCard from "./StatCard";
import AIAnalyticSection from "./AIAnalyticSection";

interface StatDashboardProps {
  onOpenChat?: () => void;
  stats?: any;
}

const FILTER_MAP: Record<string, string> = {
  "Hari ini": "Hari ini",
  Kemarin: "Kemarin",
  Minggu: "Minggu",
  Bulan: "Bulan",
  Custom: "Custom",
};

const StatDashboard: React.FC<StatDashboardProps> = ({ onOpenChat }) => {
  // Setup format tanggal dan jam awal (YYYY-MM-DDTHH:mm)
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0))
    .toISOString()
    .slice(0, 16);
  const todayEnd = new Date(now.setHours(23, 59, 59, 999))
    .toISOString()
    .slice(0, 16);

  const { isDarkMode, toggleDarkMode } = useStore();

  const [activeFilter, setActiveFilter] = useState("Hari ini");
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State untuk tanggal + jam
  const [startDate, setStartDate] = useState(todayStart);
  const [endDate, setEndDate] = useState(todayEnd);

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
          // Mengirim format lengkap ke backend (Backend harus siap menerima format datetime)
          params.append("startDate", startDate);
          params.append("endDate", endDate);
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
            messages: json.messages,
            sessions: json.devices || [],
            chartData: json.chartData || [],
            deviceStats: json.deviceStats || [],
          });
        }
      } catch (err) {
        console.error("Dashboard Error:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeFilter, selectedDevice, startDate, endDate],
  );

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => fetchDashboard(false), 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const handleReset = () => {
    setRefreshing(true);
    setActiveFilter("Hari ini");
    setSelectedDevice("all");
    setStartDate(todayStart);
    setEndDate(todayEnd);
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
      className={`flex-1 p-4 md:p-8 overflow-y-auto transition-colors duration-300 ${isDarkMode ? "bg-[#0B141A] custom-scrollbar" : "bg-[#F0F2F5] custom-scrollbar-light"}`}
    >
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto mb-6">
        {/* Baris Utama: Judul & Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
          {/* Branding */}
          <div className="flex-shrink-0">
            <h1
              className={`text-2xl font-black tracking-widest uppercase flex items-center gap-3 ${isDarkMode ? "text-white" : "text-[#3B4A54]"}`}
            >
              SATU PINTU
              {refreshing && (
                <Loader2 size={18} className="animate-spin text-[#00a884]" />
              )}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse"></div>
              <p
                className={`text-[9px] font-bold tracking-[0.2em] uppercase ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}
              >
                Monitoring Dashboard
              </p>
            </div>
          </div>

          {/* Controls Group */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-fit">
            {/* Mode & Reset Buttons */}
            <div className="flex gap-2">
              <button
                onClick={toggleDarkMode}
                className={`p-2.5 rounded-xl border transition-all shadow-sm ${isDarkMode ? "bg-[#202C33] border-[#313D45] text-yellow-400" : "bg-white border-[#E9EDEF] text-gray-600"}`}
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                onClick={handleReset}
                className={`p-2.5 border rounded-xl transition-all ${isDarkMode ? "bg-[#202C33] border-[#313D45] text-[#8696A0]" : "bg-white border-[#E9EDEF] text-[#667781]"}`}
              >
                <RotateCcw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
            </div>

            {/* Device Selector */}
            <div className="relative flex-1 md:flex-none">
              <Smartphone
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00a884]"
                size={14}
              />
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className={`pl-9 pr-10 py-2.5 border rounded-xl text-[11px] font-bold outline-none appearance-none w-full md:min-w-[180px] ${isDarkMode ? "bg-[#202C33] border-[#313D45] text-white" : "bg-white border-[#E9EDEF] text-[#3B4A54]"}`}
              >
                <option value="all">SEMUA DEVICE SAYA</option>
                {data.sessions.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Tabs */}
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
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeFilter === item ? "bg-[#00a884] text-white shadow-md" : isDarkMode ? "text-[#8696A0] hover:text-white" : "text-[#667781] hover:bg-gray-100"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Baris Kedua: Custom Date Range (Hanya muncul jika filter "Custom" dipilih) */}
        {activeFilter === "Custom" && (
          <div className="flex justify-end animate-in fade-in slide-in-from-top-4 duration-500">
            <div
              className={`flex flex-col md:flex-row items-center gap-4 p-3 px-6 rounded-2xl border w-full md:w-fit ${isDarkMode ? "bg-[#202C33]/40 border-[#313D45] backdrop-blur-sm" : "bg-white border-[#E9EDEF] shadow-sm"}`}
            >
              <div className="flex items-center gap-3 md:border-r md:pr-4 border-gray-500/20">
                <Calendar size={16} className="text-[#00a884]" />
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}
                >
                  Custom Range
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-bold text-[#00a884] uppercase">
                    Mulai Dari
                  </span>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`bg-transparent text-xs font-bold outline-none [color-scheme:dark] ${isDarkMode ? "text-white" : "text-[#3B4A54]"}`}
                  />
                </div>
                <div className="h-8 w-px bg-gray-500/20 hidden md:block" />
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-bold text-[#00a884] uppercase">
                    Sampai
                  </span>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`bg-transparent text-xs font-bold outline-none [color-scheme:dark] ${isDarkMode ? "text-white" : "text-[#3B4A54]"}`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="max-w-7xl mx-auto">
        <AIAnalyticSection stats={data.stats} dark={isDarkMode} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <ActivityChart data={data.chartData} dark={isDarkMode} />
          <SLAChart data={slaData} dark={isDarkMode} />
          <DeviceBarChart data={data.deviceStats} dark={isDarkMode} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 pb-10">
          <LiveFeed
            messages={data.messages}
            totalPesan={data.stats.pesanMasukAllTime}
            dark={isDarkMode}
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
            title="Lead Masuk"
            value={data.stats.leadMasuk}
            icon={Users}
            color="text-green-500"
          />
          <StatCard
            dark={isDarkMode}
            title="Lead Aktif"
            value={data.stats.leadAktif}
            icon={Activity}
            color="text-cyan-500"
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
            title="Status Koneksi"
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
