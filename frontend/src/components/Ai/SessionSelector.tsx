import React from "react";
import { RefreshCw } from "lucide-react";

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
  <div className="bg-white p-5 rounded-lg border border-[#E4E6EB] mb-6">
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
      <label className="text-xs font-bold text-[#050505] uppercase tracking-wider">Pilih Perangkat Aktif</label>
      <button onClick={onRefresh} className="text-[#65676B] hover:text-[#1877F2] transition-colors">
        <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
      </button>
    </div>
    <div className="flex gap-3 flex-wrap">
      {sessions.length > 0 ? (
        sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`px-4 py-2.5 rounded-lg border text-sm transition-all flex items-center gap-2 font-medium ${
              selectedId === s.id 
                ? "border-[#1877F2] bg-[#E7F3FF] text-[#1877F2]" 
                : "border-[#E4E6EB] bg-white text-[#65676B] hover:bg-[#F2F3F5] hover:border-[#E4E6EB]"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${s.status === "connected" ? "bg-[#31A24C]" : "bg-[#F5A623]"}`} />
            {s.name || s.id}
          </button>
        ))
      ) : (
        <p className="text-sm text-[#65676B] italic">Tidak ada device ditemukan...</p>
      )}
    </div>
  </div>
);
