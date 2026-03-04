import React, { useState, useEffect, useCallback } from "react";
import { UserSearch, MessageSquare, Clock, Search, Loader2, RefreshCcw, Target } from "lucide-react";

interface LeadsChatListProps {
  isDarkMode: boolean;
  onSelectChat?: (chatId: string) => void;
}

const LeadsChatList: React.FC<LeadsChatListProps> = ({ isDarkMode, onSelectChat }) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/chats/leads-only`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setLeads(json.data || []);
      }
    } catch (err) {
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filteredLeads = leads.filter(lead => 
    (lead.pushName && lead.pushName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    lead.remoteJid.includes(searchTerm)
  );

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 ${isDarkMode ? "bg-[#111B21]" : "bg-white"}`}>
      {/* HEADER SECTION */}
      <div className={`p-4 border-b ${isDarkMode ? "border-[#222D34] bg-[#202C33]" : "border-gray-200 bg-[#F0F2F5]"}`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <UserSearch className="text-orange-500" size={20} />
            </div>
            <div>
              <h2 className={`font-black text-sm uppercase tracking-wider ${isDarkMode ? "text-white" : "text-[#3B4A54]"}`}>Potential Leads</h2>
              <p className={`text-[10px] font-medium ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}>Tracking Sumber Iklan Aktif</p>
            </div>
          </div>
          <button 
            onClick={fetchLeads}
            className={`p-2 rounded-full hover:bg-black/5 transition-all active:scale-90 ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0]" size={14} />
          <input
            type="text"
            placeholder="Cari nama atau sumber..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs font-bold outline-none transition-all ${
              isDarkMode 
                ? "bg-[#2A3942] text-white focus:bg-[#323739]" 
                : "bg-white border border-gray-200 text-[#3B4A54] focus:ring-1 focus:ring-[#00a884]"
            }`}
          />
        </div>
      </div>

      {/* CHAT LIST CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Loader2 className="animate-spin text-[#00a884]" size={24} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8696A0]">Menganalisa Sumber Lead...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 opacity-40">
            <MessageSquare size={40} className="mb-3 text-[#8696A0]" />
            <p className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? "text-white" : "text-gray-500"}`}>Belum ada data masuk</p>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div
              key={lead.remoteJid}
              onClick={() => onSelectChat?.(lead.remoteJid)}
              className={`flex items-center p-4 cursor-pointer transition-all border-b ${
                isDarkMode 
                  ? "hover:bg-[#2A3942] border-[#222D34]" 
                  : "hover:bg-[#F5F6F6] border-gray-50"
              }`}
            >
              {/* AVATAR DENGAN INISIAL & WARNA DINAMIS BERDASARKAN SUMBER */}
              <div 
                className="relative w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-lg shadow-md flex-shrink-0"
                style={{ 
                    background: lead.source_color 
                        ? `linear-gradient(135deg, ${lead.source_color}, ${lead.source_color}dd)` 
                        : 'linear-gradient(135deg, #8696A0, #667781)' 
                }}
              >
                {lead.pushName ? lead.pushName[0].toUpperCase() : "?"}
              </div>
              
              <div className="ml-4 flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                  <h3 className={`font-bold text-[14px] truncate tracking-tight ${isDarkMode ? "text-[#E9EDEF]" : "text-[#111B21]"}`}>
                    {lead.pushName || "Lead Tanpa Nama"}
                  </h3>
                  <span className={`text-[9px] font-bold flex items-center gap-1 flex-shrink-0 ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}>
                    <Clock size={10} className="text-[#00a884]" />
                    {new Date(lead.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* TRACKING SOURCE BADGES */}
                <div className="flex items-center gap-2 mt-1.5">
                  {/* Badge Sumber (Iklan vs Organik) */}
                  {lead.lead_source ? (
                    <div 
                      className="px-2 py-0.5 rounded-md flex items-center gap-1 border shadow-sm"
                      style={{ 
                        backgroundColor: `${lead.source_color}15`, 
                        borderColor: `${lead.source_color}40` 
                      }}
                    >
                      <Target size={8} style={{ color: lead.source_color }} />
                      <span className="text-[9px] font-black uppercase tracking-tighter" style={{ color: lead.source_color }}>
                        {lead.lead_source}
                      </span>
                    </div>
                  ) : (
                    <div className="px-2 py-0.5 rounded-md flex items-center gap-1 bg-gray-500/10 border border-gray-500/20">
                      <span className="text-gray-500 text-[9px] font-black uppercase tracking-tighter">
                        Organik
                      </span>
                    </div>
                  )}

                  {/* Label New Lead */}
                  <div className="flex items-center gap-1.5 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                    <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse"></div>
                    <span className="text-orange-500 text-[9px] font-black uppercase tracking-tighter">
                      New Lead
                    </span>
                  </div>
                </div>

                {/* PREVIEW PESAN TERAKHIR */}
                <p className={`text-[11px] truncate mt-1 ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}>
                  {lead.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeadsChatList;