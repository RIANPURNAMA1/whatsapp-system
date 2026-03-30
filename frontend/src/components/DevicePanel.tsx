import { Smartphone, PlusCircle, RefreshCw, LogOut, Trash2, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const DevicePanel = ({ sessions = [], activeId, onAdd, onSelect, onDelete, onReconnect, onLogout }: any) => {
  return (

    <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden h-full">
      {/* HEADER */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Perangkat</h2>
            <p className="text-xs text-gray-500">{sessions.filter((s: any) => s.status === "connected").length} terhubung</p>
          </div>
        </div>
        <Button onClick={onAdd} size="sm" className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 gap-1">
          <PlusCircle className="w-4 h-4" />
          Tambah
        </Button>
      </div>

      {/* DEVICE LIST - 2 Columns Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {sessions.length > 0 ? (
          <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {sessions.map((session: any) => {
              const isActive = session.id === activeId;
              return (
                <div
                  key={session.id}
                  onClick={() => onSelect(session)}
                  className={`flex flex-col p-4 rounded-xl cursor-pointer transition-all ${
                    isActive 
                      ? "bg-white border-2 border-blue-500 shadow-sm" 
                      : "bg-white border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    {/* STATUS ICON */}
                    <div className={`p-2 rounded-lg ${session.status === "connected" ? "bg-emerald-100" : "bg-red-100"}`}>
                      {session.status === "connected" ? (
                        <Wifi className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-red-500" />
                      )}
                    </div>

                    {/* STATUS BADGE */}
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${session.status === "connected" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-600"}`}>
                      {session.status === "connected" ? "Online" : "Offline"}
                    </span>
                  </div>

                  {/* INFO */}
                  <div className="flex-1 min-w-0 mb-3">
                    <p className="text-sm font-semibold text-gray-900 truncate">{session.name || "Tanpa Nama"}</p>
                    <p className="text-xs text-gray-500 truncate">{session.phone_number || "Belum terhubung"}</p>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex items-center gap-1 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                    {session.status !== "connected" && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onReconnect(session.id)} 
                        className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <RefreshCw size={14} />
                      </Button>
                    )}
                    {session.status === "connected" && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onLogout(session.id)} 
                        className="h-7 w-7 p-0 text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                      >
                        <LogOut size={14} />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onDelete(session.id, session.name)} 
                      className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Smartphone className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">Belum ada perangkat</h3>
            <p className="text-sm text-gray-500 mb-4">Hubungkan perangkat WhatsApp untuk memulai</p>
            <Button onClick={onAdd} className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 gap-2">
              <PlusCircle className="w-4 h-4" />
              Hubungkan
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevicePanel;
