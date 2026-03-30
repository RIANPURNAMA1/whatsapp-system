import React from 'react';
import { Users, TrendingUp, Target, Zap } from 'lucide-react';

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
  const rate = Number(conversionRate) || 0;
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (rate / 100) * circumference;

  return (
    <div className={`relative overflow-hidden rounded-3xl border transition-all duration-500 ${
      isDarkMode 
        ? "bg-[#111B21] border-white/10 shadow-2xl" 
        : "bg-gradient-to-br from-white to-blue-50/30 border-gray-100 shadow-xl shadow-blue-500/5"
    }`}>
      
      {/* Background Decorations */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-blue-400/20 to-indigo-400/10 blur-3xl rounded-full" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-gradient-to-tr from-blue-500/10 to-transparent blur-2xl rounded-full" />
      
      {/* Top Gradient Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500" />

      <div className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-blue-500/20' : 'bg-gradient-to-br from-blue-100 to-indigo-100'}`}>
                <Users size={16} className="text-blue-600" />
              </div>
              <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Total Leads Masuk
              </span>
            </div>
            
            <div className="flex items-end gap-4">
              <h2 className={`text-5xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {loading ? (
                  <span className="text-gray-400">...</span>
                ) : (
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {totalLeads.toLocaleString()}
                  </span>
                )}
              </h2>
            </div>
          </div>

          {/* Circular Progress */}
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
                stroke="url(#blueGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {loading ? "..." : `${Math.round(rate)}%`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className={`p-4 rounded-2xl flex justify-between items-center ${
          isDarkMode ? "bg-black/30 border border-white/5" : "bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-blue-500/20' : 'bg-gradient-to-br from-blue-100 to-indigo-100'}`}>
              <Target size={18} className={isDarkMode ? "text-blue-400" : "text-blue-600"} />
            </div>
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Conversion Rate
              </p>
              <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {loading ? "..." : `${conversionRate}%`}
              </p>
            </div>
          </div>

          <div className={`h-10 w-[1px] ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />

          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-emerald-500/20' : 'bg-gradient-to-br from-emerald-100 to-teal-100'}`}>
              <TrendingUp size={18} className={isDarkMode ? "text-emerald-400" : "text-emerald-600"} />
            </div>
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Total Closing
              </p>
              <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {loading ? "..." : totalClosing.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-2 mt-4 justify-center">
          <div className="relative flex items-center gap-1.5">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-semibold text-blue-500">LIVE</span>
          </div>
          <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Data realtime dari semua platform
          </span>
        </div>
      </div>
    </div>
  );
};

export default OverallLeadsCard;
