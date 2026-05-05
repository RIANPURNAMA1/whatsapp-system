import React, { useMemo } from 'react';
import { Loader2, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

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
  const remaining = Math.max(totalLeads - totalClosing, 0);

  const pieData = useMemo(() => {
    if (totalLeads === 0) return [];
    return [
      { name: 'Closing', value: totalClosing },
      { name: 'Belum Closing', value: remaining },
    ].filter(d => d.value > 0);
  }, [totalLeads, totalClosing, remaining]);

  const COLORS = ['#10b981', isDarkMode ? '#374151' : '#e5e7eb'];

  return (
    <div className={`rounded-2xl border p-5 transition-all ${
      isDarkMode ? 'bg-[#111B21] border-white/10' : 'bg-white border-gray-100 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
          <ArrowUpRight size={16} className="text-blue-500" />
        </div>
        <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Leads Overview
        </span>
      </div>

      {/* Main Content: Chart + Stats side by side */}
      <div className="flex items-center gap-4 mt-4 mb-4">
        {/* Donut Chart */}
        <div className="relative w-24 h-24 flex-shrink-0">
          {loading || pieData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              {loading ? <Loader2 className="animate-spin text-blue-500" size={18} /> : (
                <p className={`text-[10px] ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>No data</p>
              )}
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={44}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${value}`, '']}
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#202C33' : '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {totalLeads}
                </p>
                <p className={`text-[8px] font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>total</p>
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          <div className={`flex items-center justify-between p-2.5 rounded-lg ${isDarkMode ? 'bg-black/30' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Closing</span>
            </div>
            <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {loading ? '...' : totalClosing}
            </span>
          </div>

          <div className={`flex items-center justify-between p-2.5 rounded-lg ${isDarkMode ? 'bg-black/30' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rate</span>
            </div>
            <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {loading ? '...' : `${conversionRate}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      {pieData.length > 0 && (
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Closing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
            <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Belum Closing</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverallLeadsCard;
