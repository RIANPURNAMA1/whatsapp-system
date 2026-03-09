import React, { useState, useEffect } from "react";
import {
  Loader2,
  GripVertical,
  LayoutGrid,
  AlertCircle,
  Calendar,
  Filter,
  MessageSquare,
  Clock,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import axios from "axios";

interface SocialLeadsSectionProps {
  isDarkMode: boolean;
  sessions: any[];
  dateRange?: any;
}

const SocialLeadsSection: React.FC<SocialLeadsSectionProps> = ({
  isDarkMode,
  sessions,
  dateRange,
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);
  const [rawKeywords, setRawKeywords] = useState<any[]>([]);

  // State untuk filter Tanggal dan Waktu
  const [filters, setFilters] = useState({
    startDate: dateRange?.startDate || new Date().toISOString().split("T")[0],
    endDate: dateRange?.endDate || new Date().toISOString().split("T")[0],
    startTime: "00:00",
    endTime: "23:59",
  });

  const fetchSocialStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Menggabungkan tanggal dan waktu untuk parameter API
      const fullStart = `${filters.startDate} ${filters.startTime}:00`;
      const fullEnd = `${filters.endDate} ${filters.endTime}:59`;

      const [statsRes, keywordsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/social/media`, {
          params: { startDate: fullStart, endDate: fullEnd },
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/keywords`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.data.success) {
        const keywordsData = keywordsRes.data.data || [];
        setRawKeywords(keywordsData);

        const platforms: string[] = Array.from(
          new Set(keywordsData.map((k: any) => String(k.platform).toLowerCase()))
        );
        setAvailablePlatforms(platforms);

        const apiData = statsRes.data.data || [];
        const mergedData = sessions.map((s) => {
          const stats = apiData.find((d: any) => d.session_id === s.id);
          return {
            id: s.id,
            name: s.name,
            status: s.status,
            stats: stats || {},
            total: stats?.totalPesanMasuk || 0,
          };
        });

        setItems(mergedData);
        setError(null);
      }
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError("Gagal memuat statistik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialStats();
  }, [sessions]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);
    setItems(newItems);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div
      className={`rounded-3xl transition-all duration-300 ${
        isDarkMode ? "bg-[#111B21] text-white" : "bg-white shadow-sm text-[#3B4A54]"
      } overflow-hidden border ${
        isDarkMode ? "border-[#2a3942]" : "border-[#f0f2f5]"
      } mb-8`}
    >
      {/* Header & Filter Section */}
      <div className="px-8 py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className={`p-2.5 rounded-2xl ${
              isDarkMode ? "bg-[#202C33]" : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <LayoutGrid size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight">Social Media Leads</h2>
            <span className="text-[11px] font-medium opacity-60 italic">
              Statistik Per Perangkat & Waktu
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div
          className={`flex flex-wrap items-center gap-4 p-3 rounded-2xl ${
            isDarkMode ? "bg-[#202C33]" : "bg-gray-50"
          }`}
        >
          {/* Tanggal */}
          <div className="flex items-center gap-2 px-3 border-r border-gray-500/20">
            <Calendar size={14} className="opacity-40" />
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="text-[11px] font-bold bg-transparent border-none focus:ring-0 cursor-pointer"
            />
            <span className="opacity-30 text-[10px]">-</span>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="text-[11px] font-bold bg-transparent border-none focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Waktu */}
          <div className="flex items-center gap-2 px-3 border-r border-gray-500/20">
            <Clock size={14} className="opacity-40" />
            <input
              type="time"
              name="startTime"
              value={filters.startTime}
              onChange={handleFilterChange}
              className="text-[11px] font-bold bg-transparent border-none focus:ring-0 cursor-pointer"
            />
            <span className="opacity-30 text-[10px]">-</span>
            <input
              type="time"
              name="endTime"
              value={filters.endTime}
              onChange={handleFilterChange}
              className="text-[11px] font-bold bg-transparent border-none focus:ring-0 cursor-pointer"
            />
          </div>

          <button
            onClick={fetchSocialStats}
            className="p-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Filter size={16} />
          </button>
        </div>
      </div>

      <div className="px-8 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-red-400 gap-2">
            <AlertCircle size={24} />
            <span className="text-[10px] font-bold uppercase">{error}</span>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="social-grid" direction="horizontal">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5"
                >
                  {items.map((item, index) => {
                    // Hanya tampilkan platform yang memang ada di session_id ini
                    const devicePlatforms = rawKeywords
                      .filter((k: any) => k.session_id === item.id)
                      .map((k: any) => k.platform.toLowerCase());

                    return (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-6 rounded-[24px] border transition-all duration-300 ${
                              snapshot.isDragging
                                ? "shadow-2xl border-emerald-500 z-50 bg-white dark:bg-[#202C33] scale-[1.02]"
                                : isDarkMode
                                ? "bg-[#202C33] border-transparent"
                                : "bg-gray-50 border-transparent hover:border-gray-200"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-6">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                                  item.status === "connected"
                                    ? "bg-green-500/10 text-green-500"
                                    : "bg-red-500/10 text-red-500"
                                }`}
                              >
                                {item.name}
                              </span>
                              <GripVertical size={14} className="opacity-20" />
                            </div>

                            <div className="space-y-4">
                              {devicePlatforms.length > 0 ? (
                                devicePlatforms.map((platform) => (
                                  <div
                                    key={platform}
                                    className="flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-emerald-500/10 rounded-xl">
                                        <MessageSquare
                                          size={14}
                                          className="text-emerald-500"
                                        />
                                      </div>
                                      <span className="text-[11px] font-bold opacity-70 capitalize">
                                        {platform}
                                      </span>
                                    </div>
                                    <span className="text-xl font-black text-emerald-500">
                                      {item.stats[`leads_${platform}`] || 0}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div className="py-4 text-center border-2 border-dashed border-gray-500/10 rounded-xl">
                                  <p className="text-[10px] opacity-40 italic">
                                    Keyword belum diatur
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-500/10 flex justify-between items-center">
                              <span className="text-[9px] font-bold opacity-40 uppercase tracking-tight">
                                Total Chat Masuk
                              </span>
                              <span className="text-[11px] font-bold">
                                {item.total}
                              </span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
};

export default SocialLeadsSection;