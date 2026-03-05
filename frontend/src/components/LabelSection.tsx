import React, { useState, useEffect, useMemo } from "react";
import { Tag, Smartphone, Loader2, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

interface LabelSectionProps {
  isDarkMode: boolean;
  loadingLabels: boolean;
  allLabels: any[];
  sessions: any[];
  labelDeviceFilter: string;
  setLabelDeviceFilter: (id: string) => void;
}

const LabelSection: React.FC<LabelSectionProps> = ({
  isDarkMode,
  loadingLabels,
  allLabels,
  sessions,
  labelDeviceFilter,
  setLabelDeviceFilter,
}) => {
  // State lokal untuk menyimpan urutan label yang bisa di-drag
  const [items, setItems] = useState<any[]>([]);

  // Update items saat data dari props berubah atau filter berubah
  useEffect(() => {
    let filtered = allLabels;
    if (labelDeviceFilter !== "all") {
      filtered = allLabels.filter((l) => l.session_id === labelDeviceFilter);
    }
    // Sorting awal berdasarkan chat_count
    const sorted = [...filtered].sort((a, b) => (b.chat_count || 0) - (a.chat_count || 0));
    setItems(sorted);
  }, [allLabels, labelDeviceFilter]);

  const totalLabelChats = useMemo(() => {
    return items.reduce((sum, l) => sum + (l.chat_count || 0), 0);
  }, [items]);

  // Fungsi untuk menangani perpindahan posisi
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    setItems(newItems);
  };

  return (
    <div className={`rounded-2xl border mb-8 overflow-hidden transition-all ${
      isDarkMode ? "bg-[#202C33] border-[#313D45]" : "bg-white border-[#E9EDEF] shadow-sm"
    }`}>
      {/* Header Section */}
      <div className={`flex flex-wrap items-center justify-between px-6 py-4 border-b gap-4 ${
        isDarkMode ? "border-[#313D45]" : "border-[#E9EDEF]"
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-[#00a884]/10 rounded-lg">
            <Tag size={15} className="text-[#00a884]" />
          </div>
          <div>
            <h2 className={`text-sm font-black uppercase tracking-wider ${isDarkMode ? "text-white" : "text-[#3B4A54]"}`}>
              Semua Label
            </h2>
            <p className={`text-[10px] mt-0.5 ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}>
              {items.length} label · {totalLabelChats} total chat
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {loadingLabels && <Loader2 size={14} className="animate-spin text-[#00a884]" />}
          <div className={`flex items-center gap-1 p-1 rounded-xl border overflow-x-auto ${
            isDarkMode ? "bg-[#111B21] border-[#2a3942]" : "bg-[#F0F2F5] border-[#E9EDEF]"
          }`}>
            <button
              onClick={() => setLabelDeviceFilter("all")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                labelDeviceFilter === "all" ? "bg-[#00a884] text-white shadow-sm" : isDarkMode ? "text-[#8696A0] hover:text-white" : "text-[#667781] hover:text-[#3B4A54]"
              }`}
            >
              <Smartphone size={10} /> Semua
            </button>
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setLabelDeviceFilter(session.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                  labelDeviceFilter === session.id ? "bg-[#00a884] text-white shadow-sm" : isDarkMode ? "text-[#8696A0] hover:text-white" : "text-[#667781] hover:text-[#3B4A54]"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${session.status === "connected" ? "bg-[#25D366]" : "bg-orange-400"}`} />
                {session.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Drag and Drop Grid Section */}
      <div className="p-6">
        {loadingLabels && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[#00a884] mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Memuat Label...</span>
          </div>
        ) : items.length === 0 ? (
          <div className={`text-center py-12 rounded-2xl border-2 border-dashed ${isDarkMode ? "border-[#2a3942] text-[#8696A0]" : "border-[#E9EDEF] text-[#667781]"}`}>
            <Tag size={32} className="mx-auto mb-3 opacity-10" />
            <p className="text-xs font-medium">Tidak ada label tersedia</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="labels-grid" direction="horizontal" type="card">
              {(provided) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                >
                  {items.map((label, index) => (
                    <Draggable 
                      key={`${label.session_id}-${label.wa_label_id}`} 
                      draggableId={`${label.session_id}-${label.wa_label_id}`} 
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            cursor: snapshot.isDragging ? "grabbing" : "grab"
                          }}
                          className={`group relative overflow-hidden rounded-xl p-4 transition-all duration-200 border ${
                            snapshot.isDragging 
                              ? "z-50 shadow-2xl scale-105 border-[#00a884]" 
                              : isDarkMode 
                                ? "bg-[#111B21] hover:bg-[#182229] border-[#2a3942]" 
                                : "bg-white hover:bg-gray-50 border-[#E9EDEF]"
                          }`}
                        >
                          {/* Accent Color Line */}
                          <div 
                            className="absolute top-0 left-0 w-1 h-full opacity-70 group-hover:opacity-100 transition-opacity" 
                            style={{ backgroundColor: label.color || "#8696A0" }} 
                          />
                          
                          {/* Drag Icon Indicator */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-30 transition-opacity">
                            <GripVertical size={12} className={isDarkMode ? "text-white" : "text-black"} />
                          </div>

                          <div className="flex flex-col h-full justify-between pointer-events-none">
                            <div className="flex items-start justify-between mb-4">
                              <span className={`text-[10px] font-black uppercase tracking-tight truncate max-w-[80%] ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}>
                                {label.name}
                              </span>
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: label.color || "#8696A0" }} />
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className={`text-2xl font-black leading-none ${isDarkMode ? "text-white" : "text-[#3B4A54]"}`}>
                                {label.chat_count || 0}
                              </span>
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}>
                                Chats
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
        )}
      </div>
    </div>
  );
};

export default LabelSection;