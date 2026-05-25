import React from "react";
import { Users, AlertCircle, RefreshCw } from "lucide-react";

interface ReportGroupSelectorProps {
  groups: any[];
  targetGroups: string[];
  onToggleGroup: (jid: string) => void;
  isFetching: boolean;
}

export const ReportGroupSelector: React.FC<ReportGroupSelectorProps> = ({
  groups,
  targetGroups,
  onToggleGroup,
  isFetching,
}) => {
  return (
    <div className="bg-white p-5 rounded-lg border border-[#E4E6EB]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Users className="text-[#1877F2]" size={20} />
          <h2 className="text-sm font-bold text-[#050505] uppercase tracking-wider">
            Pilih Grup Tujuan
          </h2>
        </div>
        <span className="text-xs font-semibold bg-[#E7F3FF] text-[#1877F2] px-3 py-1 rounded-full">
          {targetGroups.length} dipilih
        </span>
      </div>

      {isFetching ? (
        <div className="flex items-center justify-center py-10">
          <RefreshCw className="w-6 h-6 animate-spin text-[#65676B]" />
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <AlertCircle className="w-10 h-10 text-[#E4E6EB] mb-3" />
          <p className="text-sm text-[#65676B]">Belum ada grup yang tersinkron</p>
          <p className="text-xs text-[#65676B] mt-1">
            Pastikan device sudah terhubung dan memiliki grup
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {groups.map((group) => {
            const isSelected = targetGroups.includes(group.jid);
            return (
              <label
                key={group.jid}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-[#E7F3FF] border-[#1877F2]"
                    : "bg-[#F0F2F5] border-[#E4E6EB] hover:border-[#CCD0D5]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleGroup(group.jid)}
                  className="w-5 h-5 rounded border-[#CCD0D5] text-[#1877F2] focus:ring-[#1877F2]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#050505] truncate">
                    {group.subject || "No Name"}
                  </p>
                  <p className="text-xs text-[#65676B]">
                    {group.session_name} • {group.participant_count || 0} peserta
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      )}

      {targetGroups.length > 0 && (
        <div className="mt-4 bg-[#FFF8E7] border border-[#F5A623] p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#050505]">Preview Grup Tujuan:</p>
              <div className="mt-2 space-y-1">
                {targetGroups.map((jid) => {
                  const group = groups.find((g) => g.jid === jid);
                  return (
                    <p key={jid} className="text-xs text-[#65676B]">
                      • {group?.subject || jid}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
