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
  Leaf,
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
          const totalOrganik = stats?.totalOrganik || 0;
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
            totalOrganik,
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
  const totalOrganikAll = items.reduce((sum, item) => sum + item.totalOrganik, 0);
  const avgConversion = totalLeadsAll > 0 ? Math.round((totalClosingAll / totalLeadsAll) * 100) : 0;

  return (
    <div className="bg-white rounded-lg border overflow-hidden mb-10" style={{ borderColor: "#E4E6EB" }}>
      {/* HEADER */}
      <div className="px-5 py-4 border-b" style={{ borderColor: "#E4E6EB", backgroundColor: "#FFFFFF" }}>
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E7F3FF" }}>
              <LayoutGrid size={18} style={{ color: "#1877F2" }} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: "#050505" }}>Lead Performance</h2>
              <p className="text-[11px]" style={{ color: "#65676B" }}>
                Tracking konversi leads dari setiap device
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: "#E4E6EB" }}>
              <Users size={14} style={{ color: "#1877F2" }} />
              <div>
                <p className="text-[9px] font-semibold uppercase" style={{ color: "#65676B" }}>Leads</p>
                <p className="text-xs font-bold" style={{ color: "#050505" }}>{(totalLeadsAll + totalOrganikAll).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: "#E4E6EB" }}>
              <Leaf size={14} style={{ color: "#31A24C" }} />
              <div>
                <p className="text-[9px] font-semibold uppercase" style={{ color: "#65676B" }}>Organik</p>
                <p className="text-xs font-bold" style={{ color: "#050505" }}>{totalOrganikAll.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: "#E4E6EB" }}>
              <TrendingUp size={14} style={{ color: "#F5A623" }} />
              <div>
                <p className="text-[9px] font-semibold uppercase" style={{ color: "#65676B" }}>Conv</p>
                <p className="text-xs font-bold" style={{ color: "#050505" }}>{avgConversion}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: "#E4E6EB" }}>
              <CheckCircle2 size={14} style={{ color: "#31A24C" }} />
              <div>
                <p className="text-[9px] font-semibold uppercase" style={{ color: "#65676B" }}>Closing</p>
                <p className="text-xs font-bold" style={{ color: "#050505" }}>{totalClosingAll.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* FILTER SECTION */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: "#CCD0D5", backgroundColor: "#F0F2F5" }}>
            <Calendar size={13} style={{ color: "#65676B" }} />
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="bg-transparent outline-none text-[11px] font-medium"
              style={{ color: "#050505" }}
            />
            <span style={{ color: "#BCC0C4" }}>—</span>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="bg-transparent outline-none text-[11px] font-medium"
              style={{ color: "#050505" }}
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: "#CCD0D5", backgroundColor: "#F0F2F5" }}>
            <Clock size={13} style={{ color: "#65676B" }} />
            <input
              type="time"
              name="startTime"
              value={filters.startTime}
              onChange={handleFilterChange}
              className="bg-transparent outline-none text-[11px] font-medium w-14"
              style={{ color: "#050505" }}
            />
            <span style={{ color: "#BCC0C4" }}>:</span>
            <input
              type="time"
              name="endTime"
              value={filters.endTime}
              onChange={handleFilterChange}
              className="bg-transparent outline-none text-[11px] font-medium w-14"
              style={{ color: "#050505" }}
            />
          </div>

          <button
            onClick={fetchSocialStats}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all"
            style={{ backgroundColor: "#1877F2" }}
          >
            <Filter size={13} />
            Filter
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin" size={28} style={{ color: "#1877F2" }} />
              <p className="text-sm font-medium" style={{ color: "#65676B" }}>Memuat data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-12">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: "#FFEBEE" }}>
              <AlertCircle size={24} style={{ color: "#E74C3C" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "#050505" }}>{error}</p>
            <button
              onClick={fetchSocialStats}
              className="mt-3 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all"
              style={{ color: "#1877F2", backgroundColor: "#E7F3FF" }}
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
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
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
                            className={`relative bg-white rounded-lg border transition-all duration-200 ${
                              snapshot.isDragging
                                ? "shadow-lg z-50"
                                : "hover:shadow-sm"
                            }`}
                            style={{
                              borderColor: snapshot.isDragging ? "#1877F2" : "#E4E6EB",
                              transform: snapshot.isDragging ? "scale(1.02)" : undefined,
                            }}
                          >
                            {/* Drag Handle */}
                            <div
                              className="absolute top-2.5 right-2.5 p-1 rounded-md cursor-grab active:cursor-grabbing"
                              style={{ color: "#BCC0C4" }}
                              {...provided.dragHandleProps}
                            >
                              <LayoutGrid size={13} />
                            </div>

                            {/* Card Header */}
                            <div className="p-4 pb-3">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full" style={{
                                  backgroundColor: item.status === "connected" ? "#31A24C" : "#E74C3C"
                                }} />
                                <Smartphone size={13} style={{ color: "#65676B" }} />
                                <span className="text-sm font-semibold" style={{ color: "#050505" }}>
                                  {item.name}
                                </span>
                                <span className={`ml-auto text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                                  item.status === "connected"
                                    ? "bg-[#E7F3FF] text-[#1877F2]"
                                    : "bg-[#FFEBEE] text-[#E74C3C]"
                                }`}>
                                  {item.status === "connected" ? "Online" : "Offline"}
                                </span>
                              </div>

                              {/* Main Metrics */}
                              <div className="flex items-end justify-between mb-3">
                                <div>
                                  <p className="text-[9px] font-semibold uppercase mb-0.5" style={{ color: "#65676B" }}>
                                    Total Leads
                                  </p>
                                  <p className="text-2xl font-bold tracking-tight" style={{ color: "#050505" }}>
                                    {item.totalLeads + item.totalOrganik}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] font-semibold uppercase mb-0.5" style={{ color: "#65676B" }}>
                                    Conversion
                                  </p>
                                  <p className="text-2xl font-bold tracking-tight" style={{ color: "#31A24C" }}>
                                    {item.convRate}%
                                  </p>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "#E4E6EB" }}>
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(item.convRate, 100)}%`,
                                    backgroundColor: "#31A24C",
                                  }}
                                />
                              </div>
                            </div>

                            {/* Platform Section */}
                            <div className="px-4 pb-3">
                              <div className="flex items-center gap-1.5 mb-2">
                                <MessageSquare size={11} style={{ color: "#65676B" }} />
                                <span className="text-[9px] font-semibold uppercase" style={{ color: "#65676B" }}>
                                  Platform Sources
                                </span>
                              </div>
                              {uniquePlatforms.length > 0 ? (
                                <div className="space-y-1.5">
                                  {uniquePlatforms.map((platform) => (
                                    <div
                                      key={platform}
                                      className="flex items-center justify-between py-1.5 px-2.5 rounded-md"
                                      style={{ backgroundColor: "#F0F2F5" }}
                                    >
                                      <span className="text-[11px] font-medium capitalize" style={{ color: "#050505" }}>
                                        {platform}
                                      </span>
                                      <span className="text-[11px] font-bold" style={{ color: "#050505" }}>
                                        {item.stats[`leads_${platform}`] || 0} leads
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-3 border border-dashed rounded-md" style={{ borderColor: "#E4E6EB" }}>
                                  <p className="text-[11px]" style={{ color: "#BCC0C4" }}>Belum ada keywords</p>
                                </div>
                              )}
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-3 border-t rounded-b-lg" style={{ borderColor: "#E4E6EB", backgroundColor: "#F8F9FA" }}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle2 size={13} style={{ color: "#31A24C" }} />
                                  <span className="text-[10px] font-medium" style={{ color: "#65676B" }}>
                                    Closing
                                  </span>
                                </div>
                                <span className="text-sm font-bold" style={{ color: "#31A24C" }}>
                                  {item.totalClosing}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-1.5">
                                <div className="flex items-center gap-1.5">
                                  <Leaf size={13} style={{ color: "#1877F2" }} />
                                  <span className="text-[10px] font-medium" style={{ color: "#65676B" }}>
                                    Organik
                                  </span>
                                </div>
                                <span className="text-sm font-bold" style={{ color: "#1877F2" }}>
                                  {item.totalOrganik}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-1.5 pt-1.5" style={{ borderTop: "1px solid #E4E6EB" }}>
                                <span className="text-[9px]" style={{ color: "#65676B" }}>Messages</span>
                                <span className="text-[10px] font-bold" style={{ color: "#050505" }}>
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
