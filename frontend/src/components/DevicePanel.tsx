import React from "react";
import { Smartphone, PlusCircle, RefreshCw, LogOut, Trash2 } from "lucide-react";

const DevicePanel = ({ sessions = [], activeId, onAdd, onSelect, onDelete, onReconnect, onLogout, user }: any) => {
  return (
    <div className="flex-1 bg-[#111B21] flex flex-col overflow-hidden">
      <div className="p-6 border-b border-[#222d34] flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Perangkat</h2>
          <p className="text-[#8696A0] text-xs">
            {user?.role_type === "system" ? "Semua perangkat aktif" : `Perangkat milik ${user?.full_name || "Staff"}`}
          </p>
        </div>
        <button onClick={onAdd} className="p-2 bg-[#00a884] text-[#0B141A] rounded-lg hover:bg-[#00c99d]">
          <PlusCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {sessions.length > 0 ? (
          sessions.map((session: any) => (
            <div
              key={session.id}
              onClick={() => onSelect(session)}
              className={`p-4 rounded-xl border cursor-pointer transition-all group relative ${
                session.id === activeId ? "bg-[#2A3942] border-[#00a884]" : "bg-[#202C33] border-[#313D45]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${session.status === "connected" ? "bg-[#00a884]/10 text-[#00a884]" : "bg-red-500/10 text-red-500"}`}>
                    <Smartphone size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{session.name || "Perangkat Tanpa Nama"}</p>
                    <p className="text-[11px] text-[#8696A0]">{session.phone_number || "Belum Terhubung"}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${session.status === "connected" ? "bg-[#00a884]/20 text-[#00a884]" : "bg-orange-500/10 text-orange-500"}`}>
                    {session.status}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {session.status !== "connected" && (
                      <button onClick={(e) => { e.stopPropagation(); onReconnect(session.id); }} className="p-1.5 hover:text-[#00a884]"><RefreshCw size={16} /></button>
                    )}
                    {session.status === "connected" && (
                      <button onClick={(e) => { e.stopPropagation(); onLogout(session.id); }} className="p-1.5 hover:text-orange-500"><LogOut size={16} /></button>
                    )}
                    <button onClick={(e) => onDelete(e, session.id, session.name)} className="p-1.5 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-[#8696A0]">Belum ada perangkat yang tertaut.</div>
        )}
      </div>
    </div>
  );
};

export default DevicePanel;