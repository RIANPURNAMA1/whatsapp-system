import React, { useState, useEffect, useMemo } from "react";
import { Instagram, Music, Smartphone, Loader2, GripVertical, LayoutGrid } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

interface SocialLeadsSectionProps {
  isDarkMode: boolean;
  sessions: any[];
  messages: any[]; // Tambahkan props messages untuk filter keyword
  filterId: string;
  setFilterId: (id: string) => void;
}

const SocialLeadsSection: React.FC<SocialLeadsSectionProps> = ({
  isDarkMode,
  sessions,
  messages,
  filterId,
  setFilterId,
}) => {
  const [items, setItems] = useState<any[]>([]);

  // --- LOGIKA FILTER KEYWORD ---
  const processedLeads = useMemo(() => {
    return sessions.map((s) => {
      // Filter pesan yang masuk hanya untuk session/device ini
      const deviceMessages = messages.filter((m) => m.session_id === s.id);

      // Hitung Leads TikTok: "Hallo Teh Rindu, saya mau tanya Kelas Mendunia.."
      const ttCount = deviceMessages.filter((m) =>
        m.body?.includes("Hallo Teh Rindu, saya mau tanya Kelas Mendunia..")
      ).length;

      // Hitung Leads IG: "Hallo Teh, saya mau tanya Kelas Mendunia..."
      // (Pastikan tidak mengandung kata 'Rindu' agar tidak double count)
      const igCount = deviceMessages.filter((m) =>
        m.body?.includes("Hallo Teh, saya mau tanya Kelas Mendunia...") &&
        !m.body?.includes("Rindu")
      ).length;

      return {
        id: s.id,
        name: s.name,
        igCount,
        ttCount,
        status: s.status,
      };
    });
  }, [sessions, messages]);

  // Sinkronisasi ke state lokal untuk Drag & Drop
  useEffect(() => {
    let filtered = processedLeads;
    if (filterId !== "all") {
      filtered = processedLeads.filter((item) => item.id === filterId);
    }
    setItems(filtered);
  }, [processedLeads, filterId]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);
    setItems(newItems);
  };

  return (
    <div className={`rounded-2xl border mb-8 overflow-hidden transition-all duration-300 ${
      isDarkMode ? "bg-[#202C33] border-[#313D45]" : "bg-white border-[#E9EDEF] shadow-sm"
    }`}>
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between px-6 py-4 border-b gap-4 ${
        isDarkMode ? "border-[#313D45]" : "border-[#E9EDEF]"
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-pink-500/10 rounded-lg">
            <LayoutGrid size={15} className="text-pink-500" />
          </div>
          <div>
            <h2 className={`text-sm font-black uppercase tracking-wider ${isDarkMode ? "text-white" : "text-[#3B4A54]"}`}>
              Social Media Leads
            </h2>
            <p className={`text-[10px] mt-0.5 ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}>
              Berdasarkan Keyword Pesan Masuk
            </p>
          </div>
        </div>

        {/* Device Switcher */}
        <div className={`flex items-center gap-1 p-1 rounded-xl border ${isDarkMode ? "bg-[#111B21] border-[#2a3942]" : "bg-[#F0F2F5] border-[#E9EDEF]"}`}>
          <button
            onClick={() => setFilterId("all")}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
              filterId === "all" ? "bg-[#00a884] text-white shadow-sm" : isDarkMode ? "text-[#8696A0]" : "text-[#667781]"
            }`}
          >
            Semua Device
          </button>
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => setFilterId(s.id)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                filterId === s.id ? "bg-[#00a884] text-white shadow-sm" : isDarkMode ? "text-[#8696A0]" : "text-[#667781]"
              }`}
            >
              {s.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Drag n Drop */}
      <div className="p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="social-grid" direction="horizontal">
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {items.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          transition: snapshot.isDragging ? "none" : "transform 500ms cubic-bezier(0.2, 1, 0.1, 1)"
                        }}
                        className={`relative p-5 rounded-2xl border transition-colors duration-300 ${
                          snapshot.isDragging 
                            ? "z-50 shadow-2xl scale-105 border-pink-500 bg-opacity-100 ring-2 ring-pink-500/20" 
                            : isDarkMode ? "bg-[#111B21] border-[#2a3942]" : "bg-white border-[#E9EDEF]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-tight ${isDarkMode ? "text-white" : "text-[#3B4A54]"}`}>
                              {item.name}
                            </span>
                          </div>
                          <GripVertical size={14} className="opacity-20" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Instagram Card */}
                          <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-[#202C33] border-[#313D45]" : "bg-gray-50 border-gray-100"}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <Instagram size={12} className="text-pink-500" />
                              <span className="text-[9px] font-black uppercase opacity-50">Instagram</span>
                            </div>
                            <span className={`text-2xl font-black ${isDarkMode ? "text-white" : "text-[#3B4A54]"}`}>
                              {item.igCount}
                            </span>
                          </div>

                          {/* TikTok Card */}
                          <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-[#202C33] border-[#313D45]" : "bg-gray-50 border-gray-100"}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <Music size={12} className="text-sky-400" />
                              <span className="text-[9px] font-black uppercase opacity-50">TikTok</span>
                            </div>
                            <span className={`text-2xl font-black ${isDarkMode ? "text-white" : "text-[#3B4A54]"}`}>
                              {item.ttCount}
                            </span>
                          </div>
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
      </div>
    </div>
  );
};

export default SocialLeadsSection;