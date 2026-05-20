import React, { useMemo } from 'react';
import { TrendingUp, Loader2, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ClosingStatCardProps {
  isDarkMode: boolean;
  loading: boolean;
  totalClosing: number;
  conversionRate: string | number;
  totalLeads: number;
  deviceData?: any[];
}

const ClosingStatCard: React.FC<ClosingStatCardProps> = ({
  isDarkMode,
  loading,
  totalClosing,
  conversionRate,
  totalLeads,
  deviceData = [],
}) => {
  const rawRate = Number(conversionRate) || 0;

  const chartData = useMemo(() => {
    if (!deviceData || deviceData.length === 0) return [];
    return deviceData
      .filter(d => d.lead_count > 0 || d.closing_count > 0)
      .map(d => ({
        device: d.name,
        leads: d.lead_count,
        closing: d.closing_count,
      }));
  }, [deviceData]);

  return (
    <div
      className={`rounded-lg border p-5 ${
        isDarkMode ? 'bg-[#1A1D21] border-[#2D2F33]' : 'bg-white border-[#E4E6EB]'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg" style={{ backgroundColor: isDarkMode ? '#31A24C20' : '#E7F3FF' }}>
            <CheckCircle2 size={16} style={{ color: '#31A24C' }} />
          </div>
          <div>
            <span className="text-sm font-semibold" style={{ color: isDarkMode ? '#E4E6EB' : '#050505' }}>
              Closing Performance
            </span>
            <p className="text-[10px]" style={{ color: isDarkMode ? '#65676B' : '#65676B' }}>Leads keyword → Closing</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold" style={{
            color: rawRate > 100 ? '#F5A623' : isDarkMode ? '#31A24C' : '#31A24C'
          }}>
            {loading ? <Loader2 className="animate-spin mx-auto" size={20} style={{ color: '#1877F2' }} /> : `${rawRate}%`}
          </p>
          <p className="text-[10px]" style={{ color: isDarkMode ? '#65676B' : '#65676B' }}>Conversion Rate</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-lg"
        style={{ backgroundColor: isDarkMode ? '#242526' : '#F0F2F5' }}>
        <div className="text-center">
          <p className="text-[10px] font-medium" style={{ color: isDarkMode ? '#65676B' : '#65676B' }}>Leads Sosmed</p>
          <p className="text-xl font-bold" style={{ color: isDarkMode ? '#E4E6EB' : '#050505' }}>
            {loading ? '...' : totalLeads}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-medium" style={{ color: isDarkMode ? '#65676B' : '#65676B' }}>Total Closing</p>
          <p className="text-xl font-bold" style={{ color: isDarkMode ? '#E4E6EB' : '#050505' }}>
            {loading ? '...' : totalClosing}
          </p>
        </div>
      </div>

      <div className="h-44">
        {loading || chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <TrendingUp size={20} className="mx-auto mb-1" style={{ color: isDarkMode ? '#65676B' : '#BCC0C4' }} />
              <p className="text-xs" style={{ color: isDarkMode ? '#65676B' : '#BCC0C4' }}>Belum ada data leads</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="leadsAreaFB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1877F2" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="closingAreaFB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#31A24C" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#31A24C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#2D2F33' : '#E4E6EB'} vertical={false} />
              <XAxis dataKey="device" tick={{ fontSize: 10, fill: '#65676B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#65676B' }} axisLine={false} tickLine={false} width={25} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? '#242526' : '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="leads" stroke="#1877F2" strokeWidth={2} fill="url(#leadsAreaFB)" dot={{ r: 3, fill: '#1877F2' }} />
              <Area type="monotone" dataKey="closing" stroke="#31A24C" strokeWidth={2} fill="url(#closingAreaFB)" dot={{ r: 3, fill: '#31A24C' }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ClosingStatCard;
