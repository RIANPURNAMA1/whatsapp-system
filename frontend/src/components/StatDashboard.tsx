import React, { useState, useEffect } from "react";
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
} from "lucide-react";

// --- Komponen Sub: Kartu Statistik ---
const StatCard = ({
  title,
  value,
  subValue,
  icon: Icon,
  color = "text-blue-400",
}: any) => (
  <div className="bg-[#202C33] border border-[#313D45] p-5 rounded-xl flex flex-col justify-between hover:border-[#41525d] transition-all shadow-sm group">
    <div className="flex justify-between items-start">
      <h3 className="text-[#8696A0] text-[10px] font-bold uppercase tracking-[0.1em]">
        {title}
      </h3>
      <div
        className={`${color} p-2 rounded-lg bg-[#0B141A]/50 group-hover:scale-110 transition-transform`}
      >
        {Icon && <Icon size={18} />}
      </div>
    </div>
    <div className="mt-4">
      <div className="text-3xl font-black text-white">
        {value}
      </div>
      {subValue && (
        <div className="text-[10px] text-[#8696A0] mt-1 font-medium">
          {subValue}
        </div>
      )}
    </div>
  </div>
);

// --- Interface ---
interface DashboardStats {
  pesanMasuk: number;
  pesanMasukToday: number;
  pesanKeluar: number;
  totalDevice: number;
  deviceConnected: number;
  leadMasuk: number;
  leadAktif: number;
  slowResponse: number;
  unanswered: number;
}

interface LiveMessage {
  id: number;
  sender: string;
  message_text: string;
  received_via: string;
  received_at: string;
}

interface SessionOption {
  id: string;
  name: string;
}

// BACKEND URL (Port 3001 sesuai permintaan)
const API_URL = "http://localhost:3001/api/stats/dashboard";

const FILTER_MAP: Record<string, string> = {
  "Hari ini": "today",
  "Kemarin": "yesterday",
  "Minggu": "week",
  "Bulan": "month",
};

const StatDashboard: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState("Hari ini");
  const [selectedDevice, setSelectedDevice] = useState("all");

  const [stats, setStats] = useState<DashboardStats>({
    pesanMasuk: 0,
    pesanMasukToday: 0,
    pesanKeluar: 0,
    totalDevice: 0,
    deviceConnected: 0,
    leadMasuk: 0,
    leadAktif: 0,
    slowResponse: 0,
    unanswered: 0,
  });
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH DATA
  const fetchDashboard = async () => {
    try {
      const period = FILTER_MAP[activeFilter] || "today";
      // Gunakan "Semua Device" atau "all" untuk mengirim query kosong/all ke backend
      const sessionParam = selectedDevice !== "all" ? `&sessionId=${selectedDevice}` : "";
      
      const res = await fetch(`${API_URL}?period=${period}${sessionParam}`);
      const json = await res.json();

      if (json.success) {
        setStats(json.stats); // Langsung ke json.stats
        setMessages(json.messages); // Langsung ke json.messages
        setSessions(json.devices || []); // Mengambil daftar device untuk dropdown
      }
    } catch (err) {
      console.error("Gagal fetch data dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 10000); // Refresh tiap 10 detik
    return () => clearInterval(interval);
  }, [activeFilter, selectedDevice]);

  const activeSessionLabel =
    selectedDevice === "all"
      ? "Semua Device"
      : sessions.find((s) => s.id === selectedDevice)?.name || selectedDevice;

  return (
    <div className="flex-1 bg-[#0B141A] p-4 md:p-8 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col items-center mb-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Dropdown Device */}
          <div className="relative group">
            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0]" size={16} />
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="pl-10 pr-10 py-2.5 bg-[#202C33] border border-[#313D45] rounded-xl text-sm text-white focus:ring-1 focus:ring-[#00a884] outline-none appearance-none cursor-pointer shadow-lg min-w-[200px]"
            >
              <option value="all">Semua Device</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8696A0] pointer-events-none" size={14} />
          </div>

          {/* Filter Waktu */}
          <div className="flex bg-[#202C33] p-1.5 rounded-xl border border-[#313D45] text-[10px] shadow-lg">
            {["Hari ini", "Kemarin", "Minggu", "Bulan"].map((item) => (
              <button
                key={item}
                onClick={() => setActiveFilter(item)}
                className={`px-5 py-2 rounded-lg font-bold transition-all uppercase tracking-wider ${
                  activeFilter === item ? "bg-[#00a884] text-[#0B141A]" : "text-[#8696A0] hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 max-w-7xl mx-auto">
        {/* LIVE MESSAGE FEED */}
        <div className="md:col-span-2 md:row-span-2 bg-[#202C33] border border-[#313D45] p-6 rounded-2xl min-h-[450px] flex flex-col shadow-xl">
          <div className="flex justify-between items-start mb-6 pb-4 border-b border-[#313D45]/50">
            <div className="flex flex-col">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8696A0]">Live Stream</h3>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse"></div>
                <span className="text-[10px] text-[#00a884] uppercase font-bold tracking-tighter">
                  {activeSessionLabel} • Online
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-5xl font-black text-white leading-none tracking-tight">
                {stats.pesanMasuk.toLocaleString("id-ID")}
              </span>
              <span className="text-[9px] text-[#8696A0] mt-2 uppercase font-bold tracking-widest">Total Inbound</span>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar max-h-[380px] space-y-3">
            {messages.length === 0 ? (
              <div className="text-[#8696A0] text-center mt-10 text-xs tracking-widest uppercase opacity-50">Belum ada pesan</div>
            ) : (
              messages.map((chat, idx) => (
                <div key={chat.id || idx} className="group relative flex gap-4 p-4 rounded-xl transition-all hover:bg-[#2A3942] border border-transparent hover:border-[#41525d]">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#313D45] flex items-center justify-center border border-[#41525d] text-[#8696A0]">
                    <Users size={20} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-white">{chat.sender}</span>
                        <span className="text-[8px] px-1.5 py-0.5 bg-[#0B141A] text-[#00a884] rounded font-black uppercase">{chat.received_via}</span>
                      </div>
                      <span className="text-[10px] text-[#8696A0]">{chat.received_at.split(" ")[1]?.substring(0, 5)}</span>
                    </div>
                    <p className="text-[13px] text-[#8696A0] line-clamp-2 group-hover:text-[#E9EDEF]">{chat.message_text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* STATS CARDS */}
        <StatCard title="Masuk Hari Ini" value={stats.pesanMasukToday} subValue="Total Chat Baru" icon={MessageSquare} color="text-[#00a884]" />
        <StatCard title="Pesan Terkirim" value={stats.pesanKeluar} subValue="Output WhatsApp" icon={Send} color="text-orange-400" />
        <StatCard title="Lead Masuk" value={stats.leadMasuk} subValue="Database Prospek" icon={Users} color="text-green-500" />
        <StatCard title="Lead Aktif" value={stats.leadAktif} subValue="Aktif 30 Menit Terakhir" icon={Activity} color="text-cyan-500" />
        <StatCard title="Slow Response" value={stats.slowResponse} subValue="Response Time > 10m" icon={Clock} color="text-red-500" />
        <StatCard title="Tak Terjawab" value={stats.unanswered} subValue="Belum dibalas > 24 Jam" icon={AlertCircle} color="text-[#8696A0]" />
        <StatCard title="Device Online" value={stats.deviceConnected} subValue={`Dari ${stats.totalDevice} Device`} icon={Smartphone} color="text-indigo-400" />
        <StatCard title="Status Koneksi" value={stats.deviceConnected > 0 ? "Stabil" : "Offline"} subValue="Network Engine Status" icon={CheckCircle} color="text-[#00a884]" />
      </div>
    </div>
  );
};

export default StatDashboard;