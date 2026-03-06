import React, { useState, useEffect } from "react";
import {
  Instagram,
  Music,
  Facebook,
  Loader2,
  GripVertical,
  LayoutGrid,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import axios from "axios";

interface SocialLeadsSectionProps {
  isDarkMode: boolean;
  sessions: any[];
  dateRange?: any; // <--- Ubah jadi any agar fleksibel menerima object/array
}

const SocialLeadsSection: React.FC<SocialLeadsSectionProps> = ({ isDarkMode, sessions, dateRange }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSocialStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3001/api/social/media", {
        params: {
          startDate: dateRange?.startDate,
          endDate: dateRange?.endDate,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const apiData = response.data.data;

        // Gabungkan data session dengan hasil statistik dari API
        const mergedData = sessions.map((s) => {
          const stats = apiData.find((d: any) => d.session_id === s.id);
          return {
            id: s.id,
            name: s.name,
            status: s.status,
            igCount: parseInt(stats?.leadsIG || "0"),
            ttCount: parseInt(stats?.leadsTikTok || "0"),
            fbCount: parseInt(stats?.leadsFB || "0"),
            total: stats?.totalPesanMasuk || 0,
          };
        });

        setItems(mergedData);
        setError(null);
      }
    } catch (err: any) {
      setError("Gagal memuat statistik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialStats();
  }, [sessions, dateRange]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);
    setItems(newItems);
  };

  return (
    <div className={`rounded-3xl transition-all duration-300 ${isDarkMode ? "bg-[#111B21] text-white" : "bg-white shadow-sm text-[#3B4A54]"} overflow-hidden border ${isDarkMode ? "border-[#2a3942]" : "border-[#f0f2f5]"} mb-8`}>
      
      {/* Header - Bersih Tanpa Filter */}
      <div className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-2xl ${isDarkMode ? "bg-[#202C33]" : "bg-gray-50 text-emerald-500"}`}>
            <LayoutGrid size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight">Social Media Leads</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] font-medium opacity-60">Live Tracking (All Devices)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 pb-8 relative min-h-[160px]">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-[#00a884]" size={28} /></div>
        ) : error ? (
          <div className="flex items-center gap-2 justify-center py-12 text-red-400"><AlertCircle size={18} /> <span className="text-xs font-semibold uppercase">{error}</span></div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="social-grid" direction="horizontal">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                  {items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`group p-6 rounded-[24px] border transition-all duration-300 ${snapshot.isDragging ? "shadow-2xl scale-[1.02] border-[#00a884] bg-white dark:bg-[#202C33]" : isDarkMode ? "bg-[#202C33] border-transparent" : "bg-[#f8f9fa] border-transparent hover:border-gray-200"}`}
                        >
                          <div className="flex items-center justify-between mb-6">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${item.status === "connected" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                              {item.name}
                            </span>
                            <GripVertical size={14} className="opacity-0 group-hover:opacity-20 transition-opacity" />
                          </div>

                          <div className="space-y-4">
                            {/* Instagram */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-500/10 rounded-xl"><Instagram size={14} className="text-pink-500" /></div>
                                <span className="text-[11px] font-bold opacity-70">Instagram</span>
                              </div>
                              <span className="text-xl font-black">{item.igCount}</span>
                            </div>

                            {/* TikTok */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-sky-500/10 rounded-xl"><Music size={14} className="text-sky-500" /></div>
                                <span className="text-[11px] font-bold opacity-70">TikTok</span>
                              </div>
                              <span className="text-xl font-black">{item.ttCount}</span>
                            </div>

                            {/* Facebook Ads */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600/10 rounded-xl"><Facebook size={14} className="text-blue-600" /></div>
                                <span className="text-[11px] font-bold opacity-70">Facebook Ads</span>
                              </div>
                              <span className="text-xl font-black">{item.fbCount}</span>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-gray-200/50 flex items-center justify-between">
                            <div className="flex items-center gap-1 opacity-40">
                              <ArrowUpRight size={10} />
                              <span className="text-[9px] font-bold uppercase tracking-widest">Growth</span>
                            </div>
                            <span className="text-[10px] font-bold opacity-60">{item.total} total</span>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
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