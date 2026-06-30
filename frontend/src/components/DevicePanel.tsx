import { useState } from "react";
import { Smartphone, PlusCircle, RefreshCw, LogOut, Trash2, Pencil, Wifi, WifiOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sessionApi } from "../services/api";
import useStore from "../store/useStore";

const DevicePanel = ({ sessions = [], activeId, onAdd, onSelect, onDelete, onReconnect, onLogout }: any) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const updateSession = useStore(s => s.updateSession);

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditValue(currentName);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!editingId || !editValue.trim()) return;
    try {
      await sessionApi.rename(editingId, editValue.trim());
      updateSession({ id: editingId, name: editValue.trim() });
    } catch (err) {
      console.error("Failed to rename device:", err);
    }
    setEditingId(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") cancelEdit();
  };

  return (
    <div className="flex-1 bg-[#F0F2F5] flex flex-col overflow-hidden h-full">
      {/* HEADER */}
      <div className="px-3 py-3 border-b bg-white flex items-center justify-between shrink-0" style={{ borderColor: "#E4E6EB" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E7F3FF" }}>
            <Smartphone className="w-4 h-4" style={{ color: "#0866FF" }} />
          </div>
          <div>
            <h2 className="text-[14px] font-bold" style={{ color: "#050505" }}>Perangkat</h2>
            <p className="text-[10px] font-medium" style={{ color: "#65676B" }}>
              {sessions.filter((s: any) => s.status === "connected").length} terhubung
            </p>
          </div>
        </div>
        <Button onClick={onAdd} size="sm" className="h-[30px] text-white text-[11px] font-semibold gap-1 border-0" style={{ backgroundColor: "#0866FF" }}>
          <PlusCircle className="w-3.5 h-3.5" />
          Tambah
        </Button>
      </div>

      {/* DEVICE LIST */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {sessions.length > 0 ? (
          <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {sessions.map((session: any) => {
              const isActive = session.id === activeId;
              return (
                <div
                  key={session.id}
                  onClick={() => onSelect(session)}
                  className="flex flex-col p-3.5 rounded-lg cursor-pointer transition-all bg-white border"
                  style={{
                    borderColor: isActive ? "#0866FF" : "#E4E6EB",
                    borderWidth: isActive ? 2 : 1,
                  }}
                >
                  <div className="flex items-start justify-between mb-2.5">
                    {/* STATUS ICON */}
                    <div className="p-1.5 rounded-lg" style={{
                      backgroundColor: session.status === "connected" ? "#E7F3FF" :
                      session.status === "connecting" ? "#FFF3E0" : "#FFEBEE"
                    }}>
                      {session.status === "connected" ? (
                        <Wifi className="w-3.5 h-3.5" style={{ color: "#0866FF" }} />
                      ) : session.status === "connecting" ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: "#F5A623" }} />
                      ) : (
                        <WifiOff className="w-3.5 h-3.5" style={{ color: "#E74C3C" }} />
                      )}
                    </div>

                    {/* STATUS BADGE */}
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md" style={{
                      backgroundColor: session.status === "connected" ? "#E7F3FF" :
                      session.status === "connecting" ? "#FFF3E0" : "#FFEBEE",
                      color: session.status === "connected" ? "#0866FF" :
                      session.status === "connecting" ? "#F5A623" : "#E74C3C",
                    }}>
                      {session.status === "connected" ? "Online" :
                       session.status === "connecting" ? "Menghubungkan..." :
                       session.status === "banned" ? "Terbanned" : "Offline"}
                    </span>
                  </div>

                  {/* INFO */}
                  <div className="flex-1 min-w-0 mb-2.5">
                    {editingId === session.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          autoFocus
                          className="flex-1 text-[13px] font-semibold px-2 py-1 rounded border outline-none"
                          style={{ borderColor: "#0866FF" }}
                          onClick={e => e.stopPropagation()}
                        />
                        <button onClick={e => { e.stopPropagation(); saveEdit(); }}
                          className="p-1 rounded hover:bg-[#E7F3FF] transition-colors"
                          style={{ color: "#31A24C" }}>
                          <Check size={14} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); cancelEdit(); }}
                          className="p-1 rounded hover:bg-[#FFEBEE] transition-colors"
                          style={{ color: "#E74C3C" }}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-semibold truncate" style={{ color: "#050505" }}>{session.name || "Tanpa Nama"}</p>
                        <button onClick={e => { e.stopPropagation(); startEdit(session.id, session.name || ""); }}
                          className="p-0.5 rounded transition-all hover:bg-[#F0F2F5]"
                          style={{ color: "#65676B" }}>
                          <Pencil size={11} />
                        </button>
                      </div>
                    )}
                    <p className="text-[11px] truncate" style={{ color: "#65676B" }}>{session.phone_number || "Belum terhubung"}</p>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex items-center gap-1 pt-2 border-t" style={{ borderColor: "#E4E6EB" }} onClick={(e) => e.stopPropagation()}>
                    {session.status !== "connected" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReconnect(session.id)}
                        className="h-7 w-7 p-0 rounded-lg hover:bg-[#F2F3F5]"
                        style={{ color: "#65676B" }}
                      >
                        <RefreshCw size={13} />
                      </Button>
                    )}
                    {session.status === "connected" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onLogout(session.id)}
                        className="h-7 w-7 p-0 rounded-lg hover:bg-[#FFF3E0]"
                        style={{ color: "#65676B" }}
                      >
                        <LogOut size={13} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(session.id, session.name)}
                      className="h-7 w-7 p-0 rounded-lg hover:bg-[#FFEBEE]"
                      style={{ color: "#65676B" }}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: "#F0F2F5" }}>
              <Smartphone className="w-6 h-6" style={{ color: "#BCC0C4" }} />
            </div>
            <h3 className="text-[14px] font-bold mb-1" style={{ color: "#050505" }}>Belum ada perangkat</h3>
            <p className="text-[12px] mb-4" style={{ color: "#65676B" }}>Hubungkan perangkat WhatsApp untuk memulai</p>
            <Button onClick={onAdd} className="text-white text-[11px] font-semibold gap-1.5 border-0 h-[30px]" style={{ backgroundColor: "#0866FF" }}>
              <PlusCircle className="w-3.5 h-3.5" />
              Hubungkan
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevicePanel;