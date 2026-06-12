import React, { useState, useEffect, useMemo } from "react";
import {
  Loader2,
  LayoutGrid,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  TrendingUp,
  Users,
  Leaf,
  BarChart3,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface SocialLeadsSectionProps {
  isDarkMode: boolean;
  sessions: any[];
  activeFilter?: string;
  appliedDates?: { start: string; end: string };
  selectedDevice?: string;
}

const SocialLeadsSection: React.FC<SocialLeadsSectionProps> = ({
  sessions,
  activeFilter,
  appliedDates,
  selectedDevice,
}) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawKeywords, setRawKeywords] = useState<any[]>([]);

  const displayItems = useMemo(() => {
    if (!selectedDevice || selectedDevice === "all") return items;
    return items.filter((item) => item.id === selectedDevice);
  }, [items, selectedDevice]);

  const fetchSocialStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const params: Record<string, string> = {};

      if (activeFilter === "Custom" && appliedDates?.start && appliedDates?.end) {
        params.startDate = appliedDates.start.replace("T", " ") + ":00";
        params.endDate = appliedDates.end.replace("T", " ") + ":59";
      } else {
        params.period = activeFilter || "Hari ini";
      }

      const [statsRes, keywordsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/social/media`, {
          params,
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
  }, [sessions, activeFilter, appliedDates]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newItems = Array.from(items);
    const [removed] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, removed);
    setItems(newItems);
  };

  const totalLeadsAll = displayItems.reduce((sum, item) => sum + item.totalLeads, 0);
  const totalClosingAll = displayItems.reduce((sum, item) => sum + item.totalClosing, 0);
  const totalOrganikAll = displayItems.reduce((sum, item) => sum + item.totalOrganik, 0);
  const avgConversion = totalLeadsAll > 0 ? Math.round((totalClosingAll / totalLeadsAll) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-10" style={{ borderColor: "#E4E6EB" }}>
      {/* HEADER */}
      <div className="px-5 py-4 border-b" style={{ borderColor: "#EAECF0", backgroundColor: "#FFFFFF" }}>
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          {/* Summary Stats */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#F9FAFB" }}>
              <Users size={14} style={{ color: "#1877F2" }} />
              <div>
                <p className="text-[9px] font-semibold uppercase" style={{ color: "#65676B" }}>Leads</p>
                <p className="text-xs font-bold" style={{ color: "#050505" }}>{(totalLeadsAll + totalOrganikAll).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#F9FAFB" }}>
              <Leaf size={14} style={{ color: "#31A24C" }} />
              <div>
                <p className="text-[9px] font-semibold uppercase" style={{ color: "#65676B" }}>Organik</p>
                <p className="text-xs font-bold" style={{ color: "#050505" }}>{totalOrganikAll.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#F9FAFB" }}>
              <TrendingUp size={14} style={{ color: "#F5A623" }} />
              <div>
                <p className="text-[9px] font-semibold uppercase" style={{ color: "#65676B" }}>Conv</p>
                <p className="text-xs font-bold" style={{ color: "#050505" }}>{avgConversion}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#F9FAFB" }}>
              <CheckCircle2 size={14} style={{ color: "#31A24C" }} />
              <div>
                <p className="text-[9px] font-semibold uppercase" style={{ color: "#65676B" }}>Closing</p>
                <p className="text-xs font-bold" style={{ color: "#050505" }}>{totalClosingAll.toLocaleString()}</p>
              </div>
            </div>
          </div>
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
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: "#FEF2F2" }}>
              <AlertCircle size={24} style={{ color: "#DC2626" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "#050505" }}>{error}</p>
            <button
              onClick={fetchSocialStats}
              className="mt-3 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all hover:opacity-80"
              style={{ color: "#1877F2", backgroundColor: "#F0F2F5" }}
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
                  {displayItems.map((item, index) => {
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
                            className={`relative bg-white rounded-xl border transition-all duration-200 ${
                              snapshot.isDragging
                                ? "shadow-lg z-50"
                                : "shadow-sm hover:shadow-md"
                            }`}
                            style={{
                              borderColor: snapshot.isDragging ? "#1877F2" : "#EAECF0",
                              transform: snapshot.isDragging ? "scale(1.02)" : undefined,
                            }}
                          >
                            {/* Drag Handle */}
                            <div
                              className="absolute top-3 right-3 p-1 rounded-md cursor-grab active:cursor-grabbing opacity-40 hover:opacity-100 transition-opacity"
                              style={{ color: "#98A2B3" }}
                              {...provided.dragHandleProps}
                            >
                              <LayoutGrid size={14} />
                            </div>

                            {/* Card Header */}
                            <div className="p-4 pb-3">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-2.5 h-2.5 rounded-full" style={{
                                  backgroundColor: item.status === "connected" ? "#31A24C" : "#DC2626"
                                }} />
                                <span className="text-sm font-semibold" style={{ color: "#050505" }}>
                                  {item.name}
                                </span>
                                <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-md ${
                                  item.status === "connected"
                                    ? "text-[#067647]"
                                    : "text-[#DC2626]"
                                }`} style={{
                                  backgroundColor: item.status === "connected" ? "#ECFDF3" : "#FEF2F2"
                                }}>
                                  {item.status === "connected" ? "Online" : "Offline"}
                                </span>
                              </div>

                              {/* Main Metrics */}
                              <div className="grid grid-cols-3 gap-3 mb-3">
                                <div>
                                  <p className="text-[10px] font-medium mb-0.5" style={{ color: "#98A2B3" }}>
                                    Total Leads
                                  </p>
                                  <p className="text-xl font-bold tracking-tight" style={{ color: "#050505" }}>
                                    {item.totalLeads + item.totalOrganik}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[10px] font-medium mb-0.5" style={{ color: "#98A2B3" }}>
                                    Conversion
                                  </p>
                                  <p className="text-xl font-bold tracking-tight" style={{ color: "#31A24C" }}>
                                    {item.convRate}%
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-medium mb-1" style={{ color: "#98A2B3" }}>
                                    Closing
                                  </p>
                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ backgroundColor: "#ECFDF3" }}>
                                    <CheckCircle2 size={14} style={{ color: "#31A24C" }} />
                                    <span className="text-lg font-bold" style={{ color: "#067647" }}>
                                      {item.totalClosing}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#F2F4F7" }}>
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
                                <MessageSquare size={11} style={{ color: "#98A2B3" }} />
                                <span className="text-[10px] font-medium" style={{ color: "#98A2B3" }}>
                                  Platform Sources
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                {item.totalOrganik > 0 && (
                                  <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg"
                                    style={{ backgroundColor: "#F9FAFB" }}>
                                    <span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "#344054" }}>
                                      <Leaf size={11} style={{ color: "#1877F2" }} />
                                      Leads Organik
                                    </span>
                                    <span className="text-[11px] font-semibold" style={{ color: "#1877F2" }}>
                                      {item.totalOrganik} leads
                                    </span>
                                  </div>
                                )}
                                {uniquePlatforms.length > 0 ? (
                                  uniquePlatforms.map((platform) => (
                                    <div key={platform}
                                      className="flex items-center justify-between py-1.5 px-2.5 rounded-lg"
                                      style={{ backgroundColor: "#F9FAFB" }}
                                    >
                                      <span className="text-[11px] font-medium capitalize" style={{ color: "#344054" }}>
                                        {platform}
                                      </span>
                                      <span className="text-[11px] font-semibold" style={{ color: "#667085" }}>
                                        {item.stats[`leads_${platform}`] || 0} leads
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center py-3 border border-dashed rounded-lg" style={{ borderColor: "#EAECF0" }}>
                                    <p className="text-[11px]" style={{ color: "#98A2B3" }}>Belum ada keywords</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-3 border-t" style={{ borderColor: "#EAECF0" }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate("/analisis-leads"); }}
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:opacity-80"
                                style={{ backgroundColor: "#F0F2F5", color: "#1877F2" }}
                              >
                                <BarChart3 size={13} />
                                Analisis Leads
                              </button>
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
