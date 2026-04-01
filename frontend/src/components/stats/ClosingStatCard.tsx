import React, { useMemo } from 'react';
import { TrendingUp, Loader2, Users, CheckCircle2, Target, Zap } from 'lucide-react';
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
  const rawRate = Number(conversionRate) || 0;
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (rawRate / 100) * circumference;

  const processedChartData = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return Array(7).fill({ leads: 0, closing: 0 });
    }
    return chartData.map(item => ({
      leads: Number(item.lead_count || item.leads || 0),
      closing: Number(item.closing_count || item.value || item.closing || 0)
    }));
  }, [chartData]);

  return (
    <div className={`relative overflow-hidden rounded-3xl border transition-all duration-500 ${
      isDarkMode 
        ? "bg-[#111B21] border-white/10 shadow-2xl" 
        : "bg-gradient-to-br from-white to-emerald-50/30 border-gray-100 shadow-xl shadow-emerald-500/5"
    }`}>
      
      {/* Background Decorations */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-emerald-400/20 to-teal-400/10 blur-3xl rounded-full" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-gradient-to-tr from-emerald-500/10 to-transparent blur-2xl rounded-full" />
      
      {/* Top Gradient Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />

      <div className="p-6 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-emerald-500/20' : 'bg-gradient-to-br from-emerald-100 to-teal-100'}`}>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Closing Performance
              </span>
            </div>
            
            <div className="flex items-end gap-4">
              <h2 className={`text-6xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {loading ? (
                  <Loader2 className="animate-spin text-emerald-400" size={36} />
                ) : (
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {totalClosing}
                  </span>
                )}
              </h2>
            </div>
          </div>

          {/* Circular Progress - Conversion Rate */}
          <div className="relative">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke={isDarkMode ? "#313D45" : "#e5e7eb"}
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="url(#emeraldGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {loading ? "..." : `${Math.round(rawRate)}%`}
                </p>
                <p className={`text-[8px] font-semibold uppercase ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Rate
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Area Chart */}
        <div className={`h-32 w-full relative ${isDarkMode ? '' : 'bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-2xl p-2'}`}>
          {!chartData || chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {loading ? 'Memuat...' : 'Belum ada data'}
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={processedChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="closingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#202C33' : '#fff', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fill="url(#leadsGrad)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="closing"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="url(#closingGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
          
          {/* Chart Legend */}
          <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-6">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-indigo-400 rounded" />
              <span className={`text-[9px] font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Leads</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-emerald-500 rounded" />
              <span className={`text-[9px] font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Closing</span>
            </div>
          </div>
        </div>

        {/* Stats Footer */}
        <div className={`mt-5 p-4 rounded-2xl flex justify-between items-center ${
          isDarkMode ? "bg-black/30 border border-white/5" : "bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-indigo-500/20' : 'bg-gradient-to-br from-indigo-100 to-purple-100'}`}>
              <Users size={18} className={isDarkMode ? "text-indigo-400" : "text-indigo-600"} />
            </div>
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Total Leads
              </p>
              <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {loading ? "..." : totalLeads.toLocaleString()}
              </p>
            </div>
          </div>

          <div className={`h-10 w-[1px] ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />

          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-emerald-500/20' : 'bg-gradient-to-br from-emerald-100 to-teal-100'}`}>
              <Zap size={18} className={isDarkMode ? "text-emerald-400" : "text-emerald-600"} />
            </div>
            <div className="text-right">
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Conv. Rate
              </p>
              <p className={`text-lg font-bold ${rawRate > 100 ? "text-orange-500" : isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                {loading ? "..." : `${conversionRate}%`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClosingStatCard;
