import React, { useMemo } from 'react';
import { Loader2, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface OverallLeadsCardProps {
  isDarkMode: boolean;
  loading: boolean;
  totalLeads: number;
  totalClosing: number;
  conversionRate: string | number;
}

const COLORS = ['#31A24C', '#E4E6EB'];

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

  return (
    <div
      className={`rounded-lg border p-5 ${
        isDarkMode ? 'bg-[#1A1D21] border-[#2D2F33]' : 'bg-white border-[#E4E6EB]'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="p-2 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1877F220' : '#E7F3FF' }}>
          <ArrowUpRight size={16} style={{ color: '#1877F2' }} />
        </div>
        <span className="text-sm font-semibold" style={{ color: isDarkMode ? '#E4E6EB' : '#050505' }}>
          Leads Overview
        </span>
      </div>

      <div className="flex items-center gap-4 mt-4 mb-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          {loading || pieData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              {loading ? <Loader2 className="animate-spin" size={18} style={{ color: '#1877F2' }} /> : (
                <p className="text-[10px]" style={{ color: isDarkMode ? '#65676B' : '#BCC0C4' }}>No data</p>
              )}
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={32} outerRadius={44}
                    paddingAngle={2} dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${value}`, '']}
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#242526' : '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-lg font-bold" style={{ color: isDarkMode ? '#E4E6EB' : '#050505' }}>
                  {totalLeads}
                </p>
                <p className="text-[8px] font-medium" style={{ color: isDarkMode ? '#65676B' : '#65676B' }}>total</p>
              </div>
            </>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between p-2.5 rounded-lg"
            style={{ backgroundColor: isDarkMode ? '#242526' : '#F0F2F5' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#31A24C' }} />
              <span className="text-xs font-medium" style={{ color: isDarkMode ? '#BCC0C4' : '#65676B' }}>Closing</span>
            </div>
            <span className="text-sm font-bold" style={{ color: isDarkMode ? '#E4E6EB' : '#050505' }}>
              {loading ? '...' : totalClosing}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg"
            style={{ backgroundColor: isDarkMode ? '#242526' : '#F0F2F5' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F5A623' }} />
              <span className="text-xs font-medium" style={{ color: isDarkMode ? '#BCC0C4' : '#65676B' }}>Rate</span>
            </div>
            <span className="text-sm font-bold" style={{ color: isDarkMode ? '#E4E6EB' : '#050505' }}>
              {loading ? '...' : `${conversionRate}%`}
            </span>
          </div>
        </div>
      </div>

      {pieData.length > 0 && (
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#31A24C' }} />
            <span className="text-[10px]" style={{ color: isDarkMode ? '#65676B' : '#65676B' }}>Closing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: isDarkMode ? '#2D2F33' : '#E4E6EB' }} />
            <span className="text-[10px]" style={{ color: isDarkMode ? '#65676B' : '#65676B' }}>Belum Closing</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverallLeadsCard;
