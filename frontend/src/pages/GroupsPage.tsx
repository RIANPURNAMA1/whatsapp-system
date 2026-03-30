import React, { useState } from "react";
import GroupList from "../components/Grouplist";
import GroupChatWindow from "../components/Groupchatwindow";
import type { GroupChat } from "../types/Group";

interface GroupsPageProps {
  sessionId: string;
}

const GroupsPage: React.FC<GroupsPageProps> = ({ sessionId }) => {
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null);

  const handleSelectGroup = (group: GroupChat) => {
    setSelectedGroup(group);
  };

  const handleBack = () => {
    setSelectedGroup(null);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-white">
      <div className={`${selectedGroup ? 'hidden md:flex' : 'flex'} w-full`}>
        <GroupList
          sessionId={sessionId}
          selectedGroupJid={selectedGroup?.jid || null}
          onSelectGroup={handleSelectGroup}
        />
      </div>
      {selectedGroup && (
        <div className="flex-1 hidden md:block">
          <GroupChatWindow
            sessionId={sessionId}
            group={selectedGroup}
            onBack={handleBack}
          />
        </div>
      )}
    </div>
  );
};

export default GroupsPage;
