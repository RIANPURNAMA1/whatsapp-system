import React, { useState, useEffect, useMemo } from "react";
import { Tag, Loader2, Eye, EyeOff, Settings2 } from "lucide-react";
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
  const [showSettings, setShowSettings] = useState(false);
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

  useEffect(() => {
    localStorage.setItem("hidden_labels", JSON.stringify(hiddenLabelIds));
  }, [hiddenLabelIds]);

  const displayItems = useMemo(() => {
    if (showSettings) return items;
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
    <div
      className={`rounded-lg border overflow-hidden mb-8 ${
        isDarkMode ? 'bg-[#1A1D21] border-[#2D2F33]' : 'bg-white border-[#E4E6EB]'
      }`}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b" style={{ borderColor: "#E4E6EB" }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: "#E7F3FF" }}>
              <Tag size={16} style={{ color: "#0866FF" }} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: "#050505" }}>Labels</h2>
              <p className="text-[10px] font-medium" style={{ color: "#65676B" }}>Sembunyikan label yang tidak penting</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
              style={{
                backgroundColor: showSettings ? "#0866FF" : "#F0F2F5",
                color: showSettings ? "#FFFFFF" : "#050505",
              }}
            >
              <Settings2 size={13} /> {showSettings ? "Selesai" : "Atur Tampilan"}
            </button>

            <select
              value={labelDeviceFilter}
              onChange={(e) => setLabelDeviceFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border text-[11px] font-medium outline-none cursor-pointer"
              style={{
                backgroundColor: "#F0F2F5",
                borderColor: "#CCD0D5",
                color: "#050505",
              }}
            >
              <option value="all">Semua Device</option>
              {sessions.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {loadingLabels && items.length === 0 ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin" size={22} style={{ color: "#0866FF" }} />
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="labels-grid" direction="horizontal">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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
                            className={`relative p-4 rounded-lg border transition-all ${
                              isHidden ? "opacity-40" : "opacity-100"
                            } ${
                              isDarkMode
                                ? 'bg-[#242526] border-[#2D2F33]'
                                : 'bg-[#F0F2F5] border-transparent'
                            } ${
                              snapshot.isDragging ? (isDarkMode ? 'border-[#0866FF]' : 'border-[#0866FF]') : ''
                            }`}
                          >
                            {showSettings && (
                              <button
                                onClick={() => toggleVisibility(uniqueId)}
                                className="absolute top-2 right-2 z-10 p-1 rounded-md transition-colors"
                                style={{
                                  backgroundColor: isHidden ? "#FFEBEE" : "#E7F3FF",
                                }}
                              >
                                {isHidden
                                  ? <EyeOff size={12} style={{ color: "#E74C3C" }} />
                                  : <Eye size={12} style={{ color: "#0866FF" }} />
                                }
                              </button>
                            )}

                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: label.color }} />
                                <span className="text-[11px] font-semibold truncate" style={{ color: "#050505" }}>{label.name}</span>
                              </div>

                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold" style={{ color: "#050505" }}>{label.chat_count || 0}</span>
                                <span className="text-[8px] font-medium uppercase" style={{ color: "#65676B" }}>Chats</span>
                              </div>
                            </div>

                            {isHidden && showSettings && (
                              <div className="absolute inset-0 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.15)" }}>
                                <span className="text-[9px] font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                                  HIDDEN
                                </span>
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
