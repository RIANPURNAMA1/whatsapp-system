// pages/GroupsPage.tsx
// FILE BARU — tidak mengubah file lain apapun

import React, { useState } from "react";
import { Users, MessageSquare } from "lucide-react";

import type { GroupChat } from "../types/Group";

import GroupList from "../components/Grouplist";
import GroupChatWindow from "../components/Groupchatwindow";

interface GroupsPageProps {
  sessionId: string;
}

const GroupsPage: React.FC<GroupsPageProps> = ({ sessionId }) => {
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Sidebar kiri: daftar grup ── */}
      <div className="w-[340px] lg:w-[380px] flex-shrink-0 border-r border-[#1E2A30]">
        <GroupList
          sessionId={sessionId}
          selectedGroupJid={selectedGroup?.jid ?? null}
          onSelectGroup={(g) => setSelectedGroup(g)}
        />
      </div>

      {/* ── Panel kanan: chat grup ── */}
      <div className="flex-1 flex overflow-hidden">
        {selectedGroup ? (
          <GroupChatWindow
            key={selectedGroup.jid}   // remount saat ganti grup
            sessionId={sessionId}
            group={selectedGroup}
          />
        ) : (
          /* Placeholder saat belum pilih grup */
          <div className="flex-1 flex flex-col items-center justify-center bg-[#0B141A] gap-5">
            <div className="w-28 h-28 bg-[#202C33] rounded-full flex items-center justify-center shadow-inner">
              <Users className="w-14 h-14 text-[#3b4a54]" />
            </div>
            <div className="text-center max-w-xs">
              <p className="text-[#E9EDEF] text-lg font-light mb-1">
                Grup WhatsApp
              </p>
              <p className="text-[#8696A0] text-sm leading-relaxed">
                Pilih grup di sebelah kiri untuk membaca dan membalas pesan
                dari anggota grup.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[#8696A0] text-xs mt-2">
              <div className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-pulse" />
              <span>Pesan grup masuk secara real-time</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsPage;