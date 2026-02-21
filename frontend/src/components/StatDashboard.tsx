import React, { useState, useEffect, useMemo } from "react";
import {
  MessageSquare, Users, CheckCircle, AlertCircle,
  Smartphone, Send, Clock, Activity, ChevronDown, Loader2, Calendar
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";



// --- Komponen Sub: Kartu Statistik ---
const StatCard = ({ title, value, subValue, icon: Icon, color = "text-blue-400" }: any) => (
  <div className="bg-[#202C33] border border-[#313D45] p-5 rounded-xl flex flex-col justify-between hover:border-[#41525d] transition-all shadow-sm group">
    <div className="flex justify-between items-start">
      <h3 className="text-[#8696A0] text-[10px] font-bold uppercase tracking-[0.1em]">{title}</h3>
      <div className={`${color} p-2 rounded-lg bg-[#0B141A]/50 group-hover:scale-110 transition-transform`}>
        {Icon && <Icon size={18} />}
      </div>
    </div>
    <div className="mt-4">
      <div className="text-3xl font-black text-white">{(value || 0).toLocaleString("id-ID")}</div>
      {subValue && <div className="text-[10px] text-[#8696A0] mt-1 font-medium">{subValue}</div>}
    </div>
  </div>
);

const API_URL = `${import.meta.env.VITE_API_URL}/stats/dashboard`;
const FILTER_MAP: Record<string, string> = {
  "Hari ini": "Hari ini",
  "Kemarin": "Kemarin",
  "Minggu": "Minggu",
  "Bulan": "Bulan",
  "Custom": "Custom"
};

interface StatDashboardProps {
  stats: any; // Ini akan menerima objek apa pun
}


const StatDashboard:React.FC<StatDashboardProps> = () => {
  const [activeFilter, setActiveFilter] = useState("Hari ini");
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [loading, setLoading] = useState(true);

  // State untuk Custom Range Tanggal
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [stats, setStats] = useState<any>({
    pesanMasukAllTime: 0,
    pesanMasukToday: 0,
    pesanKeluar: 0,
    totalDevice: 0,
    deviceConnected: 0,
    leadMasuk: 0,
    leadAktif: 0,
    slowResponse: 0,
    unanswered: 0,
  });
  
  const [messages, setMessages] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [deviceStats, setDeviceStats] = useState<any[]>([]);

  const fetchDashboard = async () => {
    try {
      const period = FILTER_MAP[activeFilter];
      let url = `${API_URL}?period=${period}`;

      if (selectedDevice !== "all") {
        url += `&sessionId=${selectedDevice}`;
      }

      // Tambahkan parameter tanggal jika filter Custom dipilih
      if (activeFilter === "Custom") {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      
      const res = await fetch(url);
      const json = await res.json();

      if (json.success) {
        setStats(json.stats);
        setMessages(json.messages);
        setSessions(json.devices || []);
        setChartData(json.chartData || []);
        setDeviceStats(json.deviceStats || []);
      }
    } catch (err) {
      console.error("Gagal fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000); // Naikkan ke 30s agar tidak terlalu berat saat filter custom
    return () => clearInterval(interval);
  }, [activeFilter, selectedDevice, startDate, endDate]);

  const slaData = useMemo(() => [
    { name: 'Sesuai SLA', value: Math.max(0, stats.pesanMasukToday - stats.slowResponse), color: '#00a884' },
    { name: 'Slow Response', value: stats.slowResponse, color: '#f97316' },
    { name: 'Tak Terjawab', value: stats.unanswered, color: '#ef4444' },
  ], [stats]);

  if (loading && !stats.pesanMasukAllTime) {
    return (
      <div className="flex-1 bg-[#0B141A] flex items-center justify-center">
        <Loader2 className="text-[#00a884] animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0B141A] p-4 md:p-8 overflow-y-auto custom-scrollbar">
      
      {/* Header Dropdown & Filter */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 max-w-7xl mx-auto gap-6">
        
        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
          {/* Device Selector */}
          <div className="relative">
            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0]" size={16} />
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="pl-10 pr-10 py-2.5 bg-[#202C33] border border-[#313D45] rounded-xl text-sm text-white focus:ring-1 focus:ring-[#00a884] outline-none appearance-none cursor-pointer shadow-lg min-w-[220px] w-full"
            >
              <option value="all">Semua Device</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8696A0] pointer-events-none" size={14} />
          </div>

          {/* Date Range Inputs (Muncul hanya jika filter 'Custom') */}
          {activeFilter === "Custom" && (
            <div className="flex items-center gap-2 bg-[#202C33] border border-[#313D45] p-1.5 rounded-xl shadow-lg">
              <div className="relative flex items-center">
                <Calendar className="absolute left-2 text-[#8696A0]" size={14} />
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-[11px] text-white pl-8 pr-2 outline-none cursor-pointer"
                />
              </div>
              <span className="text-[#8696A0] text-xs">s/d</span>
              <div className="relative flex items-center">
                <Calendar className="absolute left-2 text-[#8696A0]" size={14} />
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-[11px] text-white pl-8 pr-2 outline-none cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Filter Period Buttons */}
        <div className="flex bg-[#202C33] p-1.5 rounded-xl border border-[#313D45] text-[10px] shadow-lg overflow-x-auto w-full md:w-auto">
          {Object.keys(FILTER_MAP).map((item) => (
            <button
              key={item}
              onClick={() => setActiveFilter(item)}
              className={`px-5 py-2 rounded-lg font-bold transition-all uppercase tracking-wider whitespace-nowrap ${
                activeFilter === item ? "bg-[#00a884] text-[#0B141A]" : "text-[#8696A0] hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* --- SECTION GRAFIK --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mb-5">
        
        {/* Tren Aktivitas */}
        <div className="lg:col-span-2 bg-[#202C33] border border-[#313D45] p-6 rounded-2xl h-[400px] shadow-xl">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8696A0] mb-6">Aktivitas Pesan</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#313D45" vertical={false} />
                <XAxis dataKey="time" stroke="#8696A0" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#8696A0" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#202C33', border: '1px solid #313D45', borderRadius: '8px' }} />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '10px', paddingBottom: '20px' }} />
                <Line type="monotone" dataKey="masuk" name="Masuk" stroke="#00a884" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="keluar" name="Keluar" stroke="#f97316" strokeWidth={3} dot={false} />
                </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLA Status */}
        <div className="bg-[#202C33] border border-[#313D45] p-6 rounded-2xl h-[400px] shadow-xl flex flex-col">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8696A0] mb-4">Efisiensi Respon</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slaData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {slaData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead per Device */}
        <div className="lg:col-span-3 bg-[#202C33] border border-[#313D45] p-6 rounded-2xl h-[350px] shadow-xl">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8696A0] mb-6">Performa Lead per Device</h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deviceStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#313D45" vertical={false} />
                <XAxis dataKey="name" stroke="#8696A0" fontSize={10} tickLine={false} />
                <YAxis stroke="#8696A0" fontSize={10} tickLine={false} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Bar dataKey="lead_count" name="Total Lead" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid Utama (Live Message & Stat Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 max-w-7xl mx-auto mb-10">
        
        {/* KOTAK LIVE STREAM */}
        <div className="md:col-span-2 md:row-span-2 bg-[#202C33] border border-[#313D45] p-6 rounded-2xl min-h-[450px] flex flex-col shadow-xl">
          <div className="flex justify-between items-start mb-6 pb-4 border-b border-[#313D45]/50">
            <div className="flex flex-col">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8696A0]">Live Stream</h3>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse"></div>
                <span className="text-[10px] text-[#00a884] uppercase font-bold tracking-tighter">Live Updates</span>
              </div>
            </div>
            <div className="text-right">
                <div className="text-4xl font-black text-white">
                    {(stats.pesanMasukAllTime || 0).toLocaleString("id-ID")}
                </div>
                <div className="text-[9px] text-[#8696A0] uppercase font-bold tracking-widest"> Total Pesan </div>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar max-h-[350px] space-y-3">
            {messages.length > 0 ? messages.map((chat, idx) => (
              <div key={idx} className="group flex gap-4 p-3 rounded-xl transition-all hover:bg-[#2A3942] border border-transparent hover:border-[#41525d]">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#313D45] flex items-center justify-center text-[#8696A0]"><Users size={18} /></div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[13px] font-bold text-white truncate">{chat.sender}</span>
                    <span className="text-[10px] text-[#8696A0]">{chat.received_at?.split(" ")[1]?.substring(0, 5)}</span>
                  </div>
                  <p className="text-[12px] text-[#8696A0] line-clamp-1">{chat.message_text}</p>
                </div>
              </div>
            )) : (
              <div className="h-full flex items-center justify-center text-[#8696A0] text-xs italic">Belum ada pesan masuk</div>
            )}
          </div>
        </div>

        {/* KARTU STATISTIK */}
        <StatCard title={`Masuk ${activeFilter}`} value={stats.pesanMasukToday} subValue="Berdasarkan Filter" icon={MessageSquare} color="text-[#00a884]" />
        <StatCard title="Pesan Terkirim" value={stats.pesanKeluar} subValue="Output WhatsApp" icon={Send} color="text-orange-400" />
        <StatCard title="Lead Masuk" value={stats.leadMasuk} subValue="Database Prospek" icon={Users} color="text-green-500" />
        <StatCard title="Lead Aktif" value={stats.leadAktif} subValue="Aktif 30 Menit" icon={Activity} color="text-cyan-500" />
        <StatCard title="Slow Response" value={stats.slowResponse} subValue="Respon > 10m" icon={Clock} color="text-red-500" />
        <StatCard title="Tak Terjawab" value={stats.unanswered} subValue="Batas > 24 Jam" icon={AlertCircle} color="text-gray-400" />
        <StatCard title="Device Online" value={stats.deviceConnected} subValue={`Dari ${stats.totalDevice} Device`} icon={Smartphone} color="text-indigo-400" />
        <StatCard title="Status Koneksi" value={stats.deviceConnected > 0 ? "Stabil" : "Offline"} subValue="Network Status" icon={CheckCircle} color="text-[#00a884]" />
      </div>
    </div>
  );
};

export default StatDashboard;