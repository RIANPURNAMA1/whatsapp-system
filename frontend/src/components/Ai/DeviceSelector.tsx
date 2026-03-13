import React from 'react';
import { Laptop, ChevronDown, Monitor, CheckCircle2 } from 'lucide-react';

interface DeviceSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  sessions: {
    id: string;
    name?: string;
    status: string;
  }[];
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({ selectedId, onSelect, sessions }) => {
  const selectedSession = sessions.find(s => s.id === selectedId);

  return (
    <div className="relative group">
      {/* Background Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-purple-500/20 rounded-md blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
      
      <div className="relative bg-[#202C33] p-1 rounded-md border border-[#313D45] mb-8 shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-2 p-4">
          
          {/* Left Icon Area */}
          <div className="flex items-center gap-4 flex-1 w-full px-2">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-[#2A3942] to-[#111B21] rounded-md flex items-center justify-center border border-[#313D45] shadow-inner">
                <Monitor className={`w-7 h-7 ${selectedId ? 'text-emerald-400' : 'text-[#8696A0]'} transition-colors duration-500`} />
              </div>
              {selectedId && (
                <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-[#202C33] animate-bounce-slow">
                  <CheckCircle2 className="w-3 h-3 text-[#111B21]" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <label className="block text-[10px] text-emerald-500 uppercase font-black tracking-[0.2em] mb-1">
                  Active Connection
                </label>
                {sessions.length > 0 && (
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                    {sessions.length} DEVICES
                  </span>
                )}
              </div>
              
              <div className="relative flex items-center">
                <select 
                  value={selectedId}
                  onChange={(e) => onSelect(e.target.value)}
                  className="w-full bg-[#2A3942]/50 hover:bg-[#2A3942] border border-[#313D45] rounded-md px-4 py-3 outline-none focus:border-emerald-500/50 text-white cursor-pointer appearance-none transition-all font-medium text-sm pr-10"
                >
                  <option value="" className="bg-[#202C33]">-- Pilih Sesi WhatsApp --</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#202C33] py-4">
                      {s.name || "Staff"} — {s.id} {s.status === 'connected' ? '(Aktif)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 w-4 h-4 text-[#8696A0] pointer-events-none group-hover:text-emerald-500 transition-colors" />
              </div>
            </div>
          </div>

          {/* Right Status Info (Hanya muncul jika ada yang dipilih) */}
          {selectedId && (
            <div className="hidden md:flex items-center gap-4 px-6 border-l border-[#313D45] py-2 animate-in fade-in slide-in-from-left-4 duration-500">
               <div className="text-right">
                  <p className="text-[10px] text-[#8696A0] uppercase font-bold tracking-wider">Status</p>
                  <p className="text-sm font-mono text-emerald-400 flex items-center gap-2 justify-end">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    CONNECTED
                  </p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};