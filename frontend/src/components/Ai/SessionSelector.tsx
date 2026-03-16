import React from "react";
import { RefreshCw, Database } from "lucide-react";

interface Session {
  id: string;
  name?: string;
  status: string;
}

interface Props {
  sessions: Session[];
  selectedId: string;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  isFetching: boolean;
}

export const SessionSelector: React.FC<Props> = ({ sessions, selectedId, onSelect, onRefresh, isFetching }) => (
  <div className="bg-[#111B21] p-4 rounded-lg border border-[#313D45] mb-6">
    <div className="flex justify-between items-center mb-3">
      <label className="text-[10px] uppercase tracking-widest text-[#8696A0] font-bold">Pilih Perangkat Aktif</label>
      <button onClick={onRefresh} className="text-[#8696A0] hover:text-white transition-colors">
        <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
      </button>
    </div>
    <div className="flex gap-3 flex-wrap">
      {sessions.length > 0 ? (
        sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`px-4 py-2 rounded border text-sm transition-all flex items-center gap-2 ${
              selectedId === s.id ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-[#313D45] bg-[#202C33] text-[#8696A0]"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${s.status === "connected" ? "bg-emerald-500" : "bg-orange-500"}`} />
            {s.name || s.id}
          </button>
        ))
      ) : (
        <p className="text-xs text-[#8696A0] italic">Tidak ada device ditemukan...</p>
      )}
    </div>
  </div>
);