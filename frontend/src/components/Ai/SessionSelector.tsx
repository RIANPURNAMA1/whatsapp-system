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
  <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm mb-6">
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Pilih Perangkat Aktif</label>
      <button onClick={onRefresh} className="text-gray-400 hover:text-blue-600 transition-colors">
        <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
      </button>
    </div>
    <div className="flex gap-3 flex-wrap">
      {sessions.length > 0 ? (
        sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`px-4 py-2.5 rounded-xl border text-sm transition-all flex items-center gap-2 font-medium ${
              selectedId === s.id 
                ? "border-blue-500 bg-blue-50 text-blue-700" 
                : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${s.status === "connected" ? "bg-emerald-500" : "bg-orange-500"}`} />
            {s.name || s.id}
          </button>
        ))
      ) : (
        <p className="text-sm text-gray-400 italic">Tidak ada device ditemukan...</p>
      )}
    </div>
  </div>
);
