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
    <div className={`rounded-2xl border p-5 transition-all ${
      isDarkMode ? 'bg-[#111B21] border-white/10' : 'bg-white border-gray-100 shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-50'}`}>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div>
            <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Closing Performance
            </span>
            <p className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Leads keyword → Closing</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${rawRate > 100 ? 'text-amber-500' : isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : `${rawRate}%`}
          </p>
          <p className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Conversion Rate</p>
        </div>
      </div>

      <div className={`grid grid-cols-2 gap-3 mb-4 p-3 rounded-xl ${isDarkMode ? 'bg-black/30' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className={`text-[10px] font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Leads Sosmed</p>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {loading ? '...' : totalLeads}
          </p>
        </div>
        <div className="text-center">
          <p className={`text-[10px] font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total Closing</p>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {loading ? '...' : totalClosing}
          </p>
        </div>
      </div>

      <div className="h-44">
        {loading || chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <TrendingUp size={20} className={`mx-auto mb-1 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Belum ada data leads</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="leadsArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="closingArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1f2937' : '#f3f4f6'} vertical={false} />
              <XAxis dataKey="device" tick={{ fontSize: 10, fill: isDarkMode ? '#6b7280' : '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: isDarkMode ? '#6b7280' : '#9ca3af' }} axisLine={false} tickLine={false} width={25} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? '#202C33' : '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={2} fill="url(#leadsArea)" dot={{ r: 3, fill: '#6366f1' }} />
              <Area type="monotone" dataKey="closing" stroke="#10b981" strokeWidth={2} fill="url(#closingArea)" dot={{ r: 3, fill: '#10b981' }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ClosingStatCard;
