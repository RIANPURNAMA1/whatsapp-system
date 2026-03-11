import React, { useState, useEffect } from "react";
import {
  Loader2,
  GripVertical,
  LayoutGrid,
  AlertCircle,
  Calendar,
  Filter,
  MessageSquare,
  CheckCircle2,
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
  const [rawKeywords, setRawKeywords] = useState<any[]>([]);

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
        setRawKeywords(keywordsRes.data.data || []);
        const apiData = statsRes.data.data || [];

        const mergedData = sessions.map((s) => {
          const stats = apiData.find((d: any) => d.session_id === s.id);
          const totalLeads = stats?.totalLeads || 0;
          const totalClosing = stats?.totalClosing || 0;
const conversionRate =
  totalLeads > 0
    ? Math.round((totalClosing / totalLeads) * 100) // Menggunakan Math.round agar jadi angka bulat
    : 0;
          return {
            id: s.id,
            name: s.name,
            status: s.status,
            stats: stats || {},
            total: stats?.totalPesanMasuk || 0,
            totalLeads,
            totalClosing,
            convRate: conversionRate,
          };
        });

        setItems(mergedData);
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal memuat statistik");
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
    const [removed] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, removed);
    setItems(newItems);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div
      className={`rounded-xl border mb-10 overflow-hidden ${
        isDarkMode
          ? "bg-[#111B21] border-[#202C33] text-white"
          : "bg-white border-gray-200 text-gray-800"
      }`}
    >
      {/* HEADER */}
      <div className="px-8 py-6 flex flex-wrap justify-between items-center gap-6 border-b border-gray-200 dark:border-[#202C33]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <LayoutGrid size={18} />
          </div>

          <div>
            <h2 className="text-lg font-bold">Lead Performance</h2>
            <p className="text-xs opacity-50">
              Tracking konversi leads dari setiap device
            </p>
          </div>
        </div>

        {/* FILTER SECTION */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`flex flex-wrap items-center gap-3 px-3 py-2 rounded-lg border ${
              isDarkMode ? "bg-[#202C33] border-white/5" : "bg-gray-100 border-gray-200"
            }`}
          >
            {/* Input Tanggal */}
            <div className="flex items-center gap-2 border-r border-gray-300 dark:border-gray-600 pr-3">
              <Calendar size={14} className="text-emerald-500" />
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="bg-transparent outline-none text-xs "
              />
              <span className="opacity-50">—</span>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="bg-transparent outline-none text-xs "
              />
            </div>

            {/* Input Waktu */}
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-blue-500" />
              <input
                type="time"
                name="startTime"
                value={filters.startTime}
                onChange={handleFilterChange}
                className="bg-transparent outline-none text-xs"
              />
              <span className="opacity-50">:</span>
              <input
                type="time"
                name="endTime"
                value={filters.endTime}
                onChange={handleFilterChange}
                className="bg-transparent outline-none text-xs"
              />
            </div>
          </div>

          <button
            onClick={fetchSocialStats}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-all active:scale-95"
          >
            <Filter size={14} />
            Filter
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-emerald-500" size={30} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-12 text-red-400">
            <AlertCircle />
            <p className="text-sm mt-2">{error}</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="grid" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
                >
                  {items.map((item, index) => {
                    const devicePlatforms = rawKeywords
                      .filter((k: any) => k.session_id === item.id)
                      .map((k: any) => k.platform.toLowerCase());

                    return (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`p-6 rounded-xl border transition-all ${
                              snapshot.isDragging
                                ? "backdrop-blur-md bg-white/10 dark:bg-[#111B21]/50 border-emerald-500 shadow-2xl scale-105 z-50"
                                : isDarkMode
                                ? "bg-[#202C33] border-[#202C33] shadow-sm"
                                : "bg-white border-gray-200 shadow-sm"
                            }`}
                          >
                            {/* TOP */}
                            <div
                              className="flex justify-between items-center mb-6"
                              {...provided.dragHandleProps}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    item.status === "connected"
                                      ? "bg-emerald-500"
                                      : "bg-red-500"
                                  }`}
                                />
                                <span className="text-xs font-semibold uppercase">
                                  {item.name}
                                </span>
                              </div>

                              <GripVertical size={14} className="opacity-40" />
                            </div>

                            {/* METRICS */}
                            <div className="flex justify-between mb-6">
                              <div>
                                <p className="text-xs opacity-50">
                                  Total Leads
                                </p>
                                <h3 className="text-3xl font-bold">
                                  {item.totalLeads}
                                </h3>
                              </div>

                              <div className="text-right">
                                <p className="text-xs text-emerald-500 font-medium">
                                  Conversion
                                </p>
                                <h3 className="text-3xl font-bold text-emerald-500">
                                  {item.convRate}%
                                </h3>
                              </div>
                            </div>

                            {/* PLATFORM */}
                            <div className="space-y-2 mb-5">
                              {devicePlatforms.length > 0 ? (
                                [...new Set(devicePlatforms)].map(
                                  (platform) => (
                                    <div
                                      key={platform}
                                      className="flex justify-between text-sm"
                                    >
                                      <span className="flex items-center gap-2 opacity-70">
                                        <MessageSquare size={12} />
                                        {platform}
                                      </span>

                                      <span className="font-semibold">
                                        {item.stats[`leads_${platform}`] || 0}
                                      </span>
                                    </div>
                                  )
                                )
                              ) : (
                                <div className="text-center text-xs opacity-40 py-3 border border-dashed rounded-lg">
                                  No keywords
                                </div>
                              )}
                            </div>

                            {/* FOOTER */}
                            <div className="pt-4 border-t border-gray-200 dark:border-[#202C33]">
                              <div className="flex justify-between items-center mb-2">
                                <span className="flex items-center gap-2 text-emerald-500 text-xs font-medium">
                                  <CheckCircle2 size={14} />
                                  Closing
                                </span>

                                <span className="font-bold text-emerald-500">
                                  {item.totalClosing}
                                </span>
                              </div>

                              <div className="flex justify-between text-xs opacity-60">
                                <span>Total Messages</span>
                                <span>{item.total}</span>
                              </div>
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