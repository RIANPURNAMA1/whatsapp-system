import React from 'react';
import { Users } from 'lucide-react';

interface OverallLeadsCardProps {
  isDarkMode: boolean;
  loading: boolean;
  totalLeads: number;
  totalClosing: number;
  conversionRate: string | number;
}

const OverallLeadsCard: React.FC<OverallLeadsCardProps> = ({
  isDarkMode,
  loading,
  totalLeads,
  totalClosing,
  conversionRate,
}) => {
  return (
    <div
      className={`p-5 rounded-md border transition-all flex flex-col min-h-[160px] ${
        isDarkMode
          ? "bg-[#202C33] border-[#313D45]"
          : "bg-white border-gray-100 shadow-sm"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8696A0]">
            Total Leads Masuk
          </p>
          <div className="flex items-baseline gap-2">
            <h2
              className={`text-2xl font-black mt-1 ${
                isDarkMode ? "text-[#E9EDEF]" : "text-[#111B21]"
              }`}
            >
              {loading ? "..." : totalLeads}
            </h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold">
              Semua Platform
            </span>
          </div>
        </div>
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Users className="text-blue-500" size={20} />
        </div>
      </div>

      {/* Progress Bar Konversi */}
      <div className="flex flex-col gap-1 my-auto">
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-[#8696A0]">Rata-rata Konversi</span>
          <span className={`text-[11px] font-bold ${isDarkMode ? "text-[#E9EDEF]" : "text-[#111B21]"}`}>
            {loading ? "0" : conversionRate}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-[#313D45] h-1 rounded-full overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all duration-700 ease-out" 
            style={{ width: `${conversionRate}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-bold text-blue-500">Live</span>
          <span className="text-[10px] text-[#8696A0]">Data Realtime</span>
        </div>

        <span className="text-[9px] text-[#8696A0] italic">
          {loading ? "0" : totalClosing} total closing didapat
        </span>
      </div>
    </div>
  );
};

export default OverallLeadsCard;