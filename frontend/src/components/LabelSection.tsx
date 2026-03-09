import React, { useState, useEffect, useMemo } from "react";
import { Tag, Loader2, GripVertical, ArrowUpRight } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

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
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    let filtered = allLabels;
    if (labelDeviceFilter !== "all") {
      filtered = allLabels.filter((l) => l.session_id === labelDeviceFilter);
    }
    const sorted = [...filtered].sort(
      (a, b) => (b.chat_count || 0) - (a.chat_count || 0),
    );
    setItems(sorted);
  }, [allLabels, labelDeviceFilter]);

  const totalLabelChats = useMemo(() => {
    return items.reduce((sum, l) => sum + (l.chat_count || 0), 0);
  }, [items]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);
    setItems(newItems);
  };

  return (
    <div
      className={`rounded-3xl transition-all duration-300 ${
        isDarkMode
          ? "bg-[#111B21] text-white"
          : "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-[#3B4A54]"
      } overflow-hidden border ${isDarkMode ? "border-[#2a3942]" : "border-[#f0f2f5]"} mb-8 font-sans`}
    >
 {/* Header - Disamakan dengan Social Media Leads */}
<div className="px-8 py-6 flex flex-wrap items-center justify-between gap-4">
  
  <div className="flex items-center gap-4">
    <div
      className={`p-2.5 rounded-2xl ${isDarkMode ? "bg-[#202C33]" : "bg-emerald-50 text-emerald-500"}`}
    >
      <Tag size={18} strokeWidth={2.5} />
    </div>

    <div>
      <h2 className="text-base font-bold tracking-tight">
        WhatsApp Labels
      </h2>

      <div className="flex items-center gap-2 mt-1">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[11px] font-medium opacity-60">
          {items.length} Active Labels
        </span>
      </div>
    </div>
  </div>

  {/* Filter Device - Select */}
  <div
    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-semibold ${
      isDarkMode
        ? "bg-[#202C33] border-[#313D45] text-[#E9EDEF]"
        : "bg-[#f8f9fa] border-[#f0f2f5] text-[#3B4A54]"
    }`}
  >
    <span className="opacity-60">Device</span>

    <select
      value={labelDeviceFilter}
      onChange={(e) => setLabelDeviceFilter(e.target.value)}
      className={`bg-transparent outline-none text-[11px] font-bold cursor-pointer ${
        isDarkMode ? "text-white" : "text-gray-700"
      }`}
    >
      <option value="all">Semua Device</option>

      {sessions.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  </div>

</div>

      {/* Content Area */}
      <div className="px-8 pb-8 relative min-h-[160px]">
        {loadingLabels && items.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-[#00a884]" size={28} />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 opacity-40">
            <Tag size={32} strokeWidth={1} />
            <span className="text-xs font-bold uppercase tracking-widest mt-2">
              Tidak Ada Label
            </span>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="labels-grid" direction="horizontal">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5"
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
                          className={`group p-6 rounded-[24px] border transition-all duration-300 ${
                            snapshot.isDragging
                              ? "shadow-2xl scale-[1.02] border-[#00a884] bg-white dark:bg-[#202C33]"
                              : isDarkMode
                                ? "bg-[#202C33] border-transparent hover:border-[#2a3942]"
                                : "bg-[#f8f9fa] border-transparent hover:border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-6">
                            <div
                              className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase"
                              style={{
                                backgroundColor: `${label.color}15`,
                                color: label.color || "#8696A0",
                              }}
                            >
                              {label.name}
                            </div>
                            <GripVertical
                              size={14}
                              className="opacity-0 group-hover:opacity-20 transition-opacity"
                            />
                          </div>

                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black tracking-tight">
                              {label.chat_count || 0}
                            </span>
                            <span className="text-[10px] font-bold uppercase opacity-40">
                              Chats
                            </span>
                          </div>

                          <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
                            <div className="flex items-center gap-1 opacity-40">
                              <ArrowUpRight size={10} />
                              <span className="text-[9px] font-bold uppercase tracking-widest">
                                Label
                              </span>
                            </div>
                            <span className="text-[9px] font-black opacity-60 uppercase tracking-tighter">
                              ID: {label.wa_label_id}
                            </span>
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

      {/* Footer Info Statis */}
      <div
        className={`px-8 py-3 border-t ${isDarkMode ? "border-[#2a3942] bg-[#202C33]/30" : "bg-[#fcfcfc] border-[#f0f2f5]"} flex justify-between items-center`}
      >
        <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
          Summary Report
        </span>
        <span className="text-[10px] font-black text-emerald-500 uppercase">
          {totalLabelChats.toLocaleString()} Total Chats Classified
        </span>
      </div>
    </div>
  );
};

export default LabelSection;
