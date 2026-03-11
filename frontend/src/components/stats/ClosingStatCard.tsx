import React, { useMemo } from 'react';
import { TrendingUp, Loader2, AlertCircle, Users, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';

interface ClosingStatCardProps {
  isDarkMode: boolean;
  loading: boolean;
  totalClosing: number;
  conversionRate: string | number;
  totalLeads: number;
  chartData: any[];
}

const ClosingStatCard: React.FC<ClosingStatCardProps> = ({
  isDarkMode,
  loading,
  totalClosing,
  conversionRate,
  totalLeads,
  chartData,
}) => {
  // Hitung rate asli untuk validasi anomali
  const rawRate = totalLeads > 0 ? (totalClosing / totalLeads) * 100 : 0;

  const processedChartData = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return Array(5).fill({ leads: 0, closing: 0 });
    }
    return chartData.map(item => ({
      leads: Number(item.lead_count || item.leads || 0),
      closing: Number(item.closing_count || item.value || item.closing || 0)
    }));
  }, [chartData]);

  return (
    <div className={`p-6 rounded-md border transition-all duration-500 flex flex-col min-h-[280px] relative overflow-hidden ${
      isDarkMode 
        ? "bg-[#111B21] border-white/5 shadow-2xl" 
        : "bg-white border-gray-100 shadow-sm"
    }`}>
      
      {/* Background Glow */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 blur-[80px] rounded-full opacity-20 ${isDarkMode ? 'bg-emerald-500' : 'bg-emerald-400'}`} />

      {/* Header */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
              <CheckCircle2 size={14} className="text-emerald-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Closing</span>
          </div>
          
          <div className="flex items-baseline gap-3">
            <h2 className="text-5xl font-black tracking-tighter italic">
              {loading ? <Loader2 className="animate-spin opacity-20" size={24} /> : totalClosing}
            </h2>
            <div className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-tighter ${
              rawRate > 100 ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
            }`}>
              {conversionRate}% Rate
            </div>
          </div>
        </div>

        <div className={`p-3 rounded-2xl ${isDarkMode ? "bg-[#202C33]" : "bg-gray-50 border border-gray-100"}`}>
          <TrendingUp className="text-emerald-500" size={20} strokeWidth={3} />
        </div>
      </div>

      {/* Mini Area Chart */}
      <div className="flex-1 h-24 w-full -ml-2 relative">
        <ResponsiveContainer width="110%" height="100%">
          <AreaChart data={processedChartData}>
            <defs>
              <linearGradient id="colorClosing" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip contentStyle={{ display: "none" }} />
            <Area
              type="monotone"
              dataKey="leads"
              stroke="#3b82f6"
              strokeWidth={1}
              strokeDasharray="4 4"
              fill="transparent"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="closing"
              stroke="#10b981"
              strokeWidth={3}
              fill="url(#colorClosing)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Bottom */}
      <div className={`mt-4 p-4 rounded-2xl flex justify-between items-center ${
        isDarkMode ? "bg-black/20 border border-white/5" : "bg-gray-50 border border-gray-100"
      }`}>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 opacity-40 mb-1">
            <Users size={10} />
            <span className="text-[9px] font-black uppercase tracking-widest">Total Leads</span>
          </div>
          <span className="text-sm font-black">{totalLeads}</span>
        </div>

        <div className="h-6 w-[1px] bg-gray-500/10" />

        <div className="text-right">
          <div className="flex items-center gap-1.5 opacity-40 mb-1 justify-end">
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Efficiency</span>
          </div>
          <div className="flex flex-col items-end leading-none">
            <span className={`text-sm font-black ${rawRate > 100 ? "text-orange-500" : "text-emerald-500"}`}>
              {conversionRate}%
            </span>
           
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClosingStatCard;