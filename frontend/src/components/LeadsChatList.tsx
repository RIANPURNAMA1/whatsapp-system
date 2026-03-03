import React, { useState, useEffect, useCallback } from "react";
import { UserSearch, MessageSquare, Clock, Search, Loader2, RefreshCcw } from "lucide-react";

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
      // Endpoint ini diasumsikan memfilter chat yang tidak ada di wa_contacts
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
    lead.remoteJid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.pushName && lead.pushName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 ${isDarkMode ? "bg-[#111B21]" : "bg-white"}`}>
      {/* HEADER */}
      <div className={`p-4 border-b ${isDarkMode ? "border-[#222D34] bg-[#202C33]" : "border-gray-200 bg-[#F0F2F5]"}`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <UserSearch className="text-orange-500" size={20} />
            </div>
            <div>
              <h2 className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-[#3B4A54]"}`}>Potential Leads</h2>
              <p className={`text-[11px] ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}>Pesan dari nomor tak dikenal</p>
            </div>
          </div>
          <button 
            onClick={fetchLeads}
            className={`p-2 rounded-full hover:bg-black/10 transition-colors ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}
          >
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8696A0]" size={16} />
          <input
            type="text"
            placeholder="Cari nomor atau nama push..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none transition-all ${
              isDarkMode 
                ? "bg-[#2A3942] text-white focus:bg-[#323739]" 
                : "bg-white border border-gray-100 text-[#3B4A54] focus:ring-1 focus:ring-[#00a884]"
            }`}
          />
        </div>
      </div>

      {/* LIST CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Loader2 className="animate-spin text-[#00a884]" size={28} />
            <p className="text-xs text-[#8696A0]">Memuat data leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 opacity-50">
            <MessageSquare size={48} className="mb-4 text-[#8696A0]" />
            <p className={`text-sm ${isDarkMode ? "text-white" : "text-gray-500"}`}>Tidak ada leads baru</p>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div
              key={lead.remoteJid}
              onClick={() => onSelectChat?.(lead.remoteJid)}
              className={`flex items-center p-4 cursor-pointer transition-all border-b border-transparent hover:bg-opacity-80 ${
                isDarkMode ? "hover:bg-[#2A3942] border-[#222D34]" : "hover:bg-[#F5F6F6] border-gray-50"
              }`}
            >
              <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-orange-400 to-yellow-300 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {lead.pushName ? lead.pushName[0].toUpperCase() : "?"}
              </div>
              
              <div className="ml-4 flex-1 overflow-hidden">
                <div className="flex justify-between items-baseline">
                  <h3 className={`font-semibold truncate ${isDarkMode ? "text-[#E9EDEF]" : "text-[#111B21]"}`}>
                    {lead.pushName || lead.remoteJid.split("@")[0]}
                  </h3>
                  <span className={`text-[10px] flex items-center gap-1 ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}>
                    <Clock size={10} />
                    {new Date(lead.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className={`text-xs truncate mt-1 ${isDarkMode ? "text-[#8696A0]" : "text-[#667781]"}`}>
                  {lead.remoteJid.split("@")[0]}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-orange-500/20 text-orange-500 text-[9px] px-2 py-0.5 rounded-full font-bold">
                    NEW LEAD
                  </span>
                  <span className={`text-[9px] ${isDarkMode ? "text-[#00a884]" : "text-[#00a884]"} font-medium italic`}>
                    Belum tersimpan
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeadsChatList;