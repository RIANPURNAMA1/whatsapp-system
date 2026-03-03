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
  ChevronDown,
  Loader2,
  RotateCcw,
  Moon,
  Sun,
} from "lucide-react";
import useStore from "../store/useStore"; // <--- Import Store
import { ActivityChart, DeviceBarChart, SLAChart } from "./DashboardCharts";
import LiveFeed from "./LiveChatFeed";
import StatCard from "./StatCard";

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
  const initialDate = new Date().toISOString().split("T")[0];

  // Ambil state dan action tema dari Zustand Store
  const { isDarkMode, toggleDarkMode } = useStore();

  const [activeFilter, setActiveFilter] = useState("Hari ini");
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialDate);

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
        const period = FILTER_MAP[activeFilter];

        let url = `${import.meta.env.VITE_API_URL}/stats/dashboard?period=${period}`;
        if (selectedDevice !== "all") url += `&sessionId=${selectedDevice}`;
        if (activeFilter === "Custom")
          url += `&startDate=${startDate}&endDate=${endDate}`;

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
    setStartDate(initialDate);
    setEndDate(initialDate);
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
      className={`flex-1 p-4 md:p-8 overflow-y-auto transition-colors duration-300 ${
        isDarkMode
          ? "bg-[#0B141A] custom-scrollbar"
          : "bg-[#F0F2F5] custom-scrollbar-light"
      }`}
    >
      {/* --- HEADER & FILTERS --- */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-10 max-w-7xl mx-auto gap-6">
        <div className="flex justify-between items-start lg:block">
          <div>
            <h1
              className={`text-2xl font-black tracking-widest uppercase flex items-center gap-3 ${
                isDarkMode ? "text-white" : "text-[#3B4A54]"
              }`}
            >
              SATU PINTU
              {refreshing && (
                <Loader2 size={18} className="animate-spin text-[#00a884]" />
              )}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse"></div>
              <p
                className={`text-[9px] font-bold tracking-[0.2em] uppercase ${
                  isDarkMode ? "text-[#8696A0]" : "text-[#667781]"
                }`}
              >
                Monitoring Dashboard
              </p>
            </div>
          </div>

          {/* Theme Switcher Mobile Only */}
          <button
            onClick={toggleDarkMode}
            className="lg:hidden p-2 rounded-full bg-[#00a884]/10 text-[#00a884]"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Theme Switcher Desktop */}
          <button
            onClick={toggleDarkMode}
            className={`hidden lg:flex p-2.5 rounded-xl border transition-all shadow-sm ${
              isDarkMode
                ? "bg-[#202C33] border-[#313D45] text-yellow-400 hover:bg-[#2A3942]"
                : "bg-white border-[#E9EDEF] text-gray-600 hover:bg-gray-50"
            }`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className={`p-2.5 border rounded-xl transition-all group shadow-sm ${
              isDarkMode
                ? "bg-[#202C33] border-[#313D45] text-[#8696A0] hover:text-[#ef4444]"
                : "bg-white border-[#E9EDEF] text-[#667781] hover:text-[#ef4444]"
            }`}
          >
            <RotateCcw
              size={16}
              className={`${refreshing ? "animate-spin" : ""} group-active:scale-90`}
            />
          </button>

          {/* Device Dropdown */}
          <div className="relative w-full md:w-auto">
            <Smartphone
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00a884]"
              size={15}
            />
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className={`pl-9 pr-10 py-2.5 border rounded-xl text-[11px] font-bold focus:ring-1 focus:ring-[#00a884] outline-none appearance-none cursor-pointer w-full transition-all shadow-sm ${
                isDarkMode
                  ? "bg-[#202C33] border-[#313D45] text-white"
                  : "bg-white border-[#E9EDEF] text-[#3B4A54]"
              }`}
            >
              <option value="all">SEMUA DEVICE SAYA</option>
              {data.sessions.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name.toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronDown
              className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                isDarkMode ? "text-[#8696A0]" : "text-[#667781]"
              }`}
              size={14}
            />
          </div>

          {/* Period Filter */}
          <div
            className={`flex items-center p-1 rounded-xl border w-full md:w-auto overflow-x-auto no-scrollbar shadow-sm ${
              isDarkMode
                ? "bg-[#202C33] border-[#313D45]"
                : "bg-white border-[#E9EDEF]"
            }`}
          >
            {Object.keys(FILTER_MAP).map((item) => (
              <button
                key={item}
                onClick={() => setActiveFilter(item)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                  activeFilter === item
                    ? "bg-[#00a884] text-white shadow-lg"
                    : isDarkMode
                      ? "text-[#8696A0] hover:text-white"
                      : "text-[#667781] hover:bg-gray-100"
                }`}
              >
                {item}
              </button>
            ))}

            {activeFilter === "Custom" && (
              <div
                className={`flex items-center gap-2 ml-2 pl-2 border-l animate-in fade-in slide-in-from-right-2 ${
                  isDarkMode ? "border-[#313D45]" : "border-[#E9EDEF]"
                }`}
              >
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`bg-transparent text-[10px] font-bold outline-none w-24 ${isDarkMode ? "text-white [color-scheme:dark]" : "text-[#3B4A54]"}`}
                />
                <span className="text-gray-500 text-[10px]">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`bg-transparent text-[10px] font-bold outline-none w-24 ${isDarkMode ? "text-white [color-scheme:dark]" : "text-[#3B4A54]"}`}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- CHARTS GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mb-8">
        <ActivityChart data={data.chartData} dark={isDarkMode} />
        <SLAChart data={slaData} dark={isDarkMode} />
        <DeviceBarChart data={data.deviceStats} dark={isDarkMode} />
      </div>

      {/* --- STAT CARDS & LIVE FEED --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 max-w-7xl mx-auto pb-10">
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
          subValue="Service Engine"
          icon={CheckCircle}
          color={
            data.stats.deviceConnected > 0 ? "text-[#00a884]" : "text-red-500"
          }
        />
      </div>
    </div>
  );
};

export default StatDashboard;
