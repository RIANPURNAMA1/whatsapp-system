import React, { useState, useEffect, useMemo } from "react";
import { Tag, Loader2, GripVertical, ArrowUpRight, Eye, EyeOff, Settings2 } from "lucide-react";
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
  const [showSettings, setShowSettings] = useState(false); // Mode edit visibility
  const [hiddenLabelIds, setHiddenLabelIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("hidden_labels");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    let filtered = allLabels;
    if (labelDeviceFilter !== "all") {
      filtered = allLabels.filter((l) => l.session_id === labelDeviceFilter);
    }
    const sorted = [...filtered].sort((a, b) => (b.chat_count || 0) - (a.chat_count || 0));
    setItems(sorted);
  }, [allLabels, labelDeviceFilter]);

  // Simpan ke localStorage saat ada perubahan checkbox
  useEffect(() => {
    localStorage.setItem("hidden_labels", JSON.stringify(hiddenLabelIds));
  }, [hiddenLabelIds]);

  // Filter data: Jika tidak sedang mode setting, sembunyikan yang di-uncheck
  const displayItems = useMemo(() => {
    if (showSettings) return items; // Tampilkan semua saat setting agar bisa di-uncheck kembali
    return items.filter(item => !hiddenLabelIds.includes(`${item.session_id}-${item.wa_label_id}`));
  }, [items, hiddenLabelIds, showSettings]);

  const toggleVisibility = (id: string) => {
    setHiddenLabelIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);
    setItems(newItems);
  };

  return (
    <div className={`rounded-3xl transition-all duration-300 ${isDarkMode ? "bg-[#111B21] text-white" : "bg-white shadow-sm text-[#3B4A54]"} overflow-hidden border ${isDarkMode ? "border-[#2a3942]" : "border-[#f0f2f5]"} mb-8 font-sans`}>
      
      {/* Header */}
      <div className="px-8 py-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-2xl ${isDarkMode ? "bg-[#202C33]" : "bg-emerald-50 text-emerald-500"}`}>
            <Tag size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-emerald-500">MANAGE LABELS</h2>
            <p className="text-[10px] opacity-50 uppercase font-bold tracking-widest">Sembunyikan label yang tidak penting</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tombol Gear untuk masuk mode setting */}
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[11px] font-black transition-all ${
              showSettings 
                ? "bg-emerald-500 border-emerald-500 text-white" 
                : isDarkMode ? "bg-[#202C33] border-[#313D45] text-white" : "bg-gray-100 border-gray-200"
            }`}
          >
            <Settings2 size={14} /> {showSettings ? "Selesai" : "Atur Tampilan"}
          </button>

          <select
            value={labelDeviceFilter}
            onChange={(e) => setLabelDeviceFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-[11px] font-bold outline-none cursor-pointer ${isDarkMode ? "bg-[#202C33] border-[#313D45] text-white" : "bg-[#f8f9fa] border-[#f0f2f5]"}`}
          >
            <option value="all">SEMUA DEVICE</option>
            {sessions.map((s) => (<option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 pb-8">
        {loadingLabels && items.length === 0 ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-500" /></div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="labels-grid" direction="horizontal">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {displayItems.map((label, index) => {
                    const uniqueId = `${label.session_id}-${label.wa_label_id}`;
                    const isHidden = hiddenLabelIds.includes(uniqueId);

                    return (
                      <Draggable key={uniqueId} draggableId={uniqueId} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`relative p-5 rounded-2xl border transition-all ${
                              isHidden ? "opacity-40 grayscale" : "opacity-100"
                            } ${isDarkMode ? "bg-[#202C33] border-transparent" : "bg-[#f8f9fa] border-gray-100"}`}
                          >
                            {/* Checkbox / Toggle Eye di pojok kanan atas */}
                            {showSettings && (
                              <button 
                                onClick={() => toggleVisibility(uniqueId)}
                                className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/10 hover:bg-emerald-500 transition-colors"
                              >
                                {isHidden ? <EyeOff size={14} className="text-red-400" /> : <Eye size={14} className="text-emerald-400" />}
                              </button>
                            )}

                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }} />
                                <span className="text-[11px] font-black uppercase truncate">{label.name}</span>
                              </div>
                              
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black">{label.chat_count || 0}</span>
                                <span className="text-[9px] font-bold opacity-40 uppercase">Chats</span>
                              </div>
                            </div>

                            {isHidden && showSettings && (
                              <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
                                <span className="text-[10px] font-black text-white bg-black/50 px-2 py-1 rounded">HIDDEN</span>
                              </div>
                            )}
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

export default LabelSection;