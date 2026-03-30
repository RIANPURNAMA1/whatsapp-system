import React, { useState, useEffect } from "react";
import {
  Loader2,
  LayoutGrid,
  AlertCircle,
  Calendar,
  Filter,
  MessageSquare,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Smartphone,
  ArrowUpRight,
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
              ? Math.round((totalClosing / totalLeads) * 100)
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

  const totalLeadsAll = items.reduce((sum, item) => sum + item.totalLeads, 0);
  const totalClosingAll = items.reduce((sum, item) => sum + item.totalClosing, 0);
  const avgConversion = totalLeadsAll > 0 ? Math.round((totalClosingAll / totalLeadsAll) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-10">
      {/* HEADER */}
      <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <LayoutGrid size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Lead Performance</h2>
              <p className="text-xs text-gray-500">
                Tracking konversi leads dari setiap device
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
              <Users size={16} className="text-emerald-500" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Total Leads</p>
                <p className="text-sm font-bold text-gray-900">{totalLeadsAll.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
              <TrendingUp size={16} className="text-blue-500" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Conversion</p>
                <p className="text-sm font-bold text-gray-900">{avgConversion}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Closing</p>
                <p className="text-sm font-bold text-gray-900">{totalClosingAll.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* FILTER SECTION */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm">
            <Calendar size={14} className="text-emerald-500" />
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="bg-transparent outline-none text-xs text-gray-600 font-medium"
            />
            <span className="text-gray-300">—</span>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="bg-transparent outline-none text-xs text-gray-600 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm">
            <Clock size={14} className="text-blue-500" />
            <input
              type="time"
              name="startTime"
              value={filters.startTime}
              onChange={handleFilterChange}
              className="bg-transparent outline-none text-xs text-gray-600 font-medium w-14"
            />
            <span className="text-gray-300">:</span>
            <input
              type="time"
              name="endTime"
              value={filters.endTime}
              onChange={handleFilterChange}
              className="bg-transparent outline-none text-xs text-gray-600 font-medium w-14"
            />
          </div>

          <button
            onClick={fetchSocialStats}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            <Filter size={14} />
            Filter
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-emerald-500" size={36} />
              <p className="text-sm text-gray-400 font-medium">Memuat data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">{error}</p>
            <button
              onClick={fetchSocialStats}
              className="mt-4 px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="grid" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5"
                >
                  {items.map((item, index) => {
                    const devicePlatforms = rawKeywords
                      .filter((k: any) => k.session_id === item.id)
                      .map((k: any) => k.platform.toLowerCase());
                    const uniquePlatforms = [...new Set(devicePlatforms)];

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
                            className={`relative bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 ${
                              snapshot.isDragging
                                ? "shadow-2xl border-emerald-300 scale-105 z-50"
                                : "hover:shadow-lg hover:border-gray-200"
                            }`}
                          >
                            {/* Drag Handle */}
                            <div
                              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-50 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400"
                              {...provided.dragHandleProps}
                            >
                              <LayoutGrid size={14} />
                            </div>

                            {/* Card Header */}
                            <div className="p-5 pb-4">
                              <div className="flex items-center gap-2 mb-4">
                                <div className={`w-2.5 h-2.5 rounded-full ${
                                  item.status === "connected" ? "bg-emerald-500" : "bg-red-400"
                                }`} />
                                <div className="flex items-center gap-2">
                                  <Smartphone size={14} className="text-gray-400" />
                                  <span className="text-sm font-bold text-gray-800">
                                    {item.name}
                                  </span>
                                </div>
                                <span className={`ml-auto text-[10px] font-bold px-2 py-1 rounded-full ${
                                  item.status === "connected"
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-red-50 text-red-500"
                                }`}>
                                  {item.status === "connected" ? "Online" : "Offline"}
                                </span>
                              </div>

                              {/* Main Metrics */}
                              <div className="flex items-end justify-between mb-5">
                                <div>
                                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">
                                    Total Leads
                                  </p>
                                  <p className="text-3xl font-bold text-gray-900 tracking-tight">
                                    {item.totalLeads}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide mb-1">
                                    Conversion
                                  </p>
                                  <p className="text-3xl font-bold text-emerald-500 tracking-tight">
                                    {item.convRate}%
                                  </p>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(item.convRate, 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Platform Section */}
                            <div className="px-5 pb-4">
                              <div className="flex items-center gap-2 mb-3">
                                <MessageSquare size={12} className="text-gray-400" />
                                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                                  Platform Sources
                                </span>
                              </div>
                              {uniquePlatforms.length > 0 ? (
                                <div className="space-y-2">
                                  {uniquePlatforms.slice(0, 3).map((platform) => (
                                    <div
                                      key={platform}
                                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                                    >
                                      <span className="text-xs font-medium text-gray-600 capitalize">
                                        {platform}
                                      </span>
                                      <span className="text-xs font-bold text-gray-700">
                                        {item.stats[`leads_${platform}`] || 0} leads
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 border border-dashed border-gray-200 rounded-lg">
                                  <p className="text-[11px] text-gray-400">Belum ada keywords</p>
                                </div>
                              )}
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100 rounded-b-2xl">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 size={14} className="text-emerald-500" />
                                  <span className="text-[11px] font-semibold text-gray-500">
                                    Total Closing
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-emerald-600">
                                    {item.totalClosing}
                                  </span>
                                  <ArrowUpRight size={14} className="text-emerald-500" />
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/50">
                                <span className="text-[10px] text-gray-400">Total Messages</span>
                                <span className="text-[11px] font-bold text-gray-600">
                                  {item.total.toLocaleString()}
                                </span>
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
