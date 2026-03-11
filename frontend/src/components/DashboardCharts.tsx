import React from "react";
import { 
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, 
  LabelList
} from "recharts";

interface ChartProps {
  data: any[];
  dark?: boolean;
}

export const ActivityChart: React.FC<ChartProps> = ({ data, dark }) => {
  const colors = {
    bg: dark ? "#202C33" : "#FFFFFF",
    border: dark ? "#313D45" : "#E9EDEF",
    text: dark ? "#8696A0" : "#667781",
    grid: dark ? "#313D45" : "#F0F2F5",
    tooltipBg: dark ? "#202C33" : "#FFFFFF",
    primary: "#00a884",
    secondary: "#2563eb", // Blue 600 untuk pesan keluar agar senada
  };

  return (
    <div className={`lg:col-span-2 p-6 rounded-md h-[400px] shadow-md border transition-colors duration-300 ${
      dark ? 'bg-[#202C33] border-[#313D45]' : 'bg-white border-[#E9EDEF]'
    }`}>
      <h3 className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-6 ${colors.text}`}>
        Aktivitas Pesan
      </h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis dataKey="time" stroke={colors.text} fontSize={10} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke={colors.text} fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: colors.tooltipBg, 
                border: `1px solid ${colors.border}`, 
                borderRadius: "8px",
                color: dark ? "#FFFFFF" : "#3B4A54" 
              }} 
            />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: "10px", paddingBottom: "20px" }} />
            <Line type="monotone" dataKey="masuk" name="Masuk" stroke={colors.primary} strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="keluar" name="Keluar" stroke={colors.secondary} strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const SLAChart: React.FC<ChartProps> = ({ data, dark }) => {
  const colors = {
    bg: dark ? "#202C33" : "#FFFFFF",
    border: dark ? "#313D45" : "#E9EDEF",
    text: dark ? "#8696A0" : "#667781",
    subText: dark ? "#AEBAC1" : "#54656F",
  };

  // Menghitung total untuk persentase di tengah jika diperlukan
  const totalValue = data.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div className={`p-7 rounded-2xl h-[400px] shadow-sm flex flex-col border transition-all duration-500 ${
      dark ? 'bg-[#111B21] border-[#222E35]' : 'bg-white border-[#E9EDEF]'
    }`}>
      <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] mb-8 ${colors.text}`}>
        Efisiensi Respon (SLA)
      </h3>
      
      <div className="h-[280px] w-full relative">
        {/* Label Tengah Dinamis */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={`text-[10px] font-bold uppercase tracking-tighter ${colors.text}`}>Total</span>
          <span className={`text-2xl font-black ${dark ? 'text-white' : 'text-[#111B21]'}`}>
            {totalValue}
          </span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              data={data} 
              innerRadius={75} 
              outerRadius={95} 
              paddingAngle={8} 
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  // Pastikan entry.color dari backend/state menggunakan #00a884 atau #2563eb
                  fill={entry.color} 
                  style={{ filter: `drop-shadow(0px 4px 6px ${entry.color}44)` }} // Efek glow halus
                />
              ))}
            </Pie>
            
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className={`p-3 rounded-xl border shadow-xl backdrop-blur-md ${
                      dark ? 'bg-[#233138]/95 border-[#313D45]' : 'bg-white/95 border-gray-100'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${colors.text}`}>
                          {payload[0].name}
                        </span>
                      </div>
                      <p className={`text-lg font-black ${dark ? 'text-white' : 'text-gray-800'}`}>
                        {payload[0].value} <span className="text-[10px] font-normal text-gray-400">Respon</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            <Legend 
              verticalAlign="bottom" 
              align="center" 
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ 
                fontSize: "10px", 
                fontWeight: "700", 
                textTransform: "uppercase", 
                letterSpacing: "0.05em",
                paddingTop: "20px" 
              }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export const DeviceBarChart: React.FC<ChartProps> = ({ data, dark }) => {
  const colors = {
    bg: dark ? "#111B21" : "#FFFFFF",
    text: dark ? "#8696A0" : "#667781",
    subText: dark ? "#AEBAC1" : "#54656F",
    grid: dark ? "#222E35" : "#F0F2F5",
    primary: "#00a884", // Leads (Green)
    secondary: "#2563eb", // Closing (Blue 600)
    hover: dark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
  };

  return (
    <div
      className={`lg:col-span-3 p-7 rounded-2xl shadow-sm border transition-all duration-500 ${
        dark ? "bg-[#111B21] border-[#222E35]" : "bg-white border-[#E9EDEF]"
      }`}
      style={{ height: "450px" }}
    >
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className={`text-[12px] font-black uppercase tracking-[0.2em] ${colors.text}`}>
            Device Performance Analysis
          </h3>
          <div className="flex gap-5 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-1.5 rounded-full bg-[#00a884]"></div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${colors.subText}`}>Leads</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1.5 rounded-full bg-[#2563eb]"></div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${colors.subText}`}>Closing</span>
            </div>
          </div>
        </div>
        
        <div className={`px-4 py-2 rounded-xl border ${dark ? 'bg-[#202C33] border-[#313D45]' : 'bg-gray-50 border-gray-100'}`}>
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Efficiency Score</p>
          <p className={`text-sm font-black ${dark ? 'text-white' : 'text-[#111B21]'}`}>
            {data.length > 0 ? Math.round((data.reduce((a, b) => a + b.closing_count, 0) / data.reduce((a, b) => a + (b.lead_count || 1), 0)) * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} barGap={8}>
            <CartesianGrid strokeDasharray="4 4" stroke={colors.grid} vertical={false} />
            <XAxis dataKey="name" stroke={colors.text} fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: "800", fill: colors.subText }} dy={15} />
            <YAxis hide domain={[0, 'auto']} />
            
            <Tooltip
              cursor={{ fill: colors.hover, radius: 12 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md ${
                      dark ? 'bg-[#233138]/95 border-[#313D45]' : 'bg-white/95 border-gray-100'
                    }`}>
                      <p className={`text-[11px] font-black uppercase mb-3 tracking-widest ${colors.text}`}>{payload[0].payload.name}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-8">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#00a884]" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Leads</span>
                          </div>
                          <span className={`text-sm font-black ${dark ? 'text-white' : 'text-gray-800'}`}>{payload[0].value}</span>
                        </div>
                        <div className="flex items-center justify-between gap-8">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#2563eb]" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Closing</span>
                          </div>
                          <span className={`text-sm font-black ${dark ? 'text-white' : 'text-gray-800'}`}>{payload[1]?.value || 0}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Bar dataKey="lead_count" fill={colors.primary} radius={[6, 6, 0, 0]} barSize={32} animationDuration={1500}>
              <LabelList dataKey="lead_count" position="top" content={(props: any) => {
                const { x, y, width, value } = props;
                if (!value) return null;
                return <text x={x + width / 2} y={y - 10} fill={colors.primary} fontSize={10} fontWeight="900" textAnchor="middle">{value}</text>;
              }} />
            </Bar>
            
            <Bar dataKey="closing_count" fill={colors.secondary} radius={[6, 6, 0, 0]} barSize={32} animationDuration={2000}>
              <LabelList dataKey="closing_count" position="top" content={(props: any) => {
                const { x, y, width, value } = props;
                if (!value) return null;
                return <text x={x + width / 2} y={y - 10} fill={colors.secondary} fontSize={10} fontWeight="900" textAnchor="middle">{value}</text>;
              }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};