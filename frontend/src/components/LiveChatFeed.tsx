import React from "react";
import { Users, MessageCircle, ShieldCheck } from "lucide-react";

interface LiveFeedProps {
  messages: any[];
  totalPesan: number;
  dark?: boolean;
}

const LiveFeed: React.FC<LiveFeedProps> = ({ messages, totalPesan, dark }) => {
  // --- Variabel Warna Dinamis ---
  const theme = {
    container: dark ? "bg-[#202C33] border-[#313D45]" : "bg-white border-[#E9EDEF]",
    header: dark ? "from-[#2A3942]/50 border-[#313D45]/50" : "from-[#F0F2F5] border-[#E9EDEF]",
    trafficBg: dark ? "bg-[#0B141A] border-[#313D45]" : "bg-[#F0F2F5] border-[#E9EDEF]",
    trafficText: dark ? "text-white" : "text-[#3B4A54]",
    listBg: dark ? "bg-[#111B21]/10" : "bg-[#F8F9FA]",
    itemBg: dark ? "bg-[#111B21]/30 hover:bg-[#2A3942] border-[#313D45]/30" : "bg-white hover:bg-[#F0F2F5] border-[#E9EDEF]",
    itemTitle: dark ? "text-[#E9EDEF]" : "text-[#3B4A54]",
    itemDesc: dark ? "text-[#8696A0]" : "text-[#667781]",
    avatarBg: dark ? "bg-[#202C33]" : "bg-[#F0F2F5]",
    footer: dark ? "bg-[#111B21]/40 border-[#313D45]/30" : "bg-[#F8F9FA] border-[#E9EDEF]",
    scrollbar: dark ? "custom-scrollbar" : "custom-scrollbar-light"
  };

  return (
    <div className={`md:col-span-2 md:row-span-2 ${theme.container} rounded-3xl h-[600px] flex flex-col shadow-md overflow-hidden transition-all duration-300 border`}>
      
      {/* --- HEADER --- */}
      <div className={`p-6 bg-gradient-to-b ${theme.header} border-b flex justify-between items-center shrink-0`}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="relative flex">
              <div className="w-2 h-2 rounded-full bg-[#00a884]"></div>
              <div className="absolute w-2 h-2 rounded-full bg-[#00a884] animate-ping"></div>
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#00a884]">Live Analytics</h3>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <ShieldCheck size={10} className="text-[#8696A0]" />
            <p className="text-[9px] text-[#8696A0] uppercase font-bold tracking-widest">Secured Feed</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-[#8696A0] uppercase font-black tracking-widest mb-1">Total Traffic</span>
          <div className={`${theme.trafficBg} px-4 py-1.5 rounded-full border transition-colors`}>
              <span className={`text-2xl font-black ${theme.trafficText} leading-none tracking-tighter`}>
                  {totalPesan.toLocaleString("id-ID")}
              </span>
          </div>
        </div>
      </div>

      {/* --- MESSAGE LIST (Scrollable) --- */}
      <div className={`flex-grow overflow-y-auto p-5 space-y-3 ${theme.scrollbar} ${theme.listBg} transition-colors`}>
        {messages.length > 0 ? (
          messages.map((chat, idx) => (
            <div 
              key={idx} 
              className={`group flex gap-4 p-4 rounded-2xl transition-all duration-300 border ${theme.itemBg} relative overflow-hidden shadow-sm`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-11 h-11 rounded-full ${theme.avatarBg} flex items-center justify-center text-[#8696A0] group-hover:text-white group-hover:bg-[#00a884] transition-all duration-500 border ${dark ? 'border-[#313D45]' : 'border-[#E9EDEF]'} group-hover:border-transparent`}>
                <Users size={20} />
              </div>
              
              <div className="flex-grow min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[14px] font-black ${theme.itemTitle} truncate tracking-tight group-hover:text-[#00a884] transition-colors`}>
                    {chat.sender || "Unknown Sender"}
                  </span>
                  <div className="flex items-center gap-2">
                      <span className={`w-1 h-1 rounded-full ${dark ? 'bg-[#313D45]' : 'bg-[#E9EDEF]'}`}></span>
                      <span className="text-[10px] font-bold text-[#8696A0]">
                          {chat.received_at?.split(" ")[1]?.substring(0, 5) || "--:--"}
                      </span>
                  </div>
                </div>
                <p className={`text-[13px] ${theme.itemDesc} line-clamp-2 leading-snug group-hover:text-opacity-80 transition-colors`}>
                  {chat.message_text}
                </p>
              </div>

              {/* Hover Indicator */}
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00a884]"></div>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-[#8696A0] gap-4">
            <div className={`p-6 rounded-full ${dark ? 'bg-[#111B21]' : 'bg-[#F0F2F5]'} border ${dark ? 'border-[#313D45]' : 'border-[#E9EDEF]'} animate-pulse`}>
              <MessageCircle size={32} strokeWidth={1.5} className="opacity-30" />
            </div>
            <p className="text-[11px] uppercase font-black tracking-[0.2em] opacity-40">Listening for incoming data...</p>
          </div>
        )}
      </div>

      {/* --- FOOTER --- */}
      <div className={`px-6 py-4 ${theme.footer} flex justify-between items-center border-t shrink-0`}>
          <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-[#00a884] opacity-50"></div>
              <div className={`w-1 h-1 rounded-full ${dark ? 'bg-[#313D45]' : 'bg-[#E9EDEF]'}`}></div>
              <div className={`w-1 h-1 rounded-full ${dark ? 'bg-[#313D45]' : 'bg-[#E9EDEF]'}`}></div>
          </div>
          <span className="text-[8px] font-bold text-[#8696A0] uppercase tracking-[0.3em]">Live Feed Active</span>
      </div>
    </div>
  );
};

export default LiveFeed;