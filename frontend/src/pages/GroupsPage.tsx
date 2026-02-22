import React, { useState } from "react";
import { Users, ArrowLeft } from "lucide-react";

import type { GroupChat } from "../types/Group";
import GroupList from "../components/Grouplist";
import GroupChatWindow from "../components/Groupchatwindow";

interface GroupsPageProps {
  sessionId: string;
}

const GroupsPage: React.FC<GroupsPageProps> = ({ sessionId }) => {
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null);

  const handleBackToList = () => {
    setSelectedGroup(null);
  };

  return (
    // Tambahkan h-screen dan w-full agar mengikuti layar
    <div className="flex h-screen w-full overflow-hidden bg-[#0B141A]">
      
      {/* ── Sidebar kiri: daftar grup ── */}
      <div className={`
        ${selectedGroup ? "hidden md:flex" : "flex"} 
        w-full md:w-[340px] lg:w-[400px] flex-col flex-shrink-0 border-r border-[#222D34] h-full
      `}>
        <GroupList
          sessionId={sessionId}
          selectedGroupJid={selectedGroup?.jid ?? null}
          onSelectGroup={(g) => setSelectedGroup(g)}
        />
      </div>

      {/* ── Panel kanan: chat grup ── */}
      <div className={`
        ${!selectedGroup ? "hidden md:flex" : "flex"} 
        flex-1 flex-col h-full bg-[#0B141A] relative
      `}>
        {selectedGroup ? (
          // Hapus flex-1 overflow-hidden berlebih, biarkan h-full bekerja
          <>
            {/* Tombol Back khusus Mobile - taruh di dalam header atau floating */}
            <div className="md:hidden absolute top-[18px] left-4 z-50">
              <button 
                onClick={handleBackToList}
                className="p-1 text-[#8696A0] hover:bg-[#2A3942] rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            </div>

            <GroupChatWindow
              key={selectedGroup.jid}
              sessionId={sessionId}
              group={selectedGroup}
              // Opsional: kirim onBack ke dalam window jika headernya ada di sana
              // onBack={handleBackToList} 
            />
          </>
        ) : (
          /* Placeholder Desktop */
          <div className="hidden md:flex flex-col items-center justify-center h-full w-full bg-[#222e35] border-l border-[#222d34]">
            <div className="flex flex-col items-center max-w-md px-10">
              <div className="w-28 h-28 bg-[#2c3943] rounded-full flex items-center justify-center mb-8">
                <Users className="w-14 h-14 text-[#54656f]" />
              </div>
              <h1 className="text-[#E9EDEF] text-3xl font-light mb-4">
                Grup WhatsApp
              </h1>
              <p className="text-[#8696A0] text-sm leading-relaxed text-center">
                Pilih grup untuk memulai percakapan. Hubungkan ke Satu Pintu untuk mengelola interaksi grup Anda dalam satu kendali terpusat.
              </p>
              <div className="mt-auto pt-20 flex items-center gap-2 text-[#667781] text-xs">
                 <span>Official Enterprise Partner</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsPage;