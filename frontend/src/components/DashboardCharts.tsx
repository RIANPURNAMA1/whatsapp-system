import React from "react";
import { 
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar 
} from "recharts";

// Interface untuk semua Chart agar menerima prop 'dark'
interface ChartProps {
  data: any[];
  dark?: boolean;
}

export const ActivityChart: React.FC<ChartProps> = ({ data, dark }) => {
  // Variabel Warna Dinamis
  const colors = {
    bg: dark ? "#202C33" : "#FFFFFF",
    border: dark ? "#313D45" : "#E9EDEF",
    text: dark ? "#8696A0" : "#667781",
    grid: dark ? "#313D45" : "#F0F2F5",
    tooltipBg: dark ? "#202C33" : "#FFFFFF",
  };

  return (
    <div className={`lg:col-span-2 p-6 rounded-2xl h-[400px] shadow-xl border transition-colors duration-300 ${
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
            <Line type="monotone" dataKey="masuk" name="Masuk" stroke="#00a884" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="keluar" name="Keluar" stroke="#f97316" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const SLAChart: React.FC<ChartProps> = ({ data, dark }) => {
  const textColor = dark ? "#8696A0" : "#667781";
  
  return (
    <div className={`p-6 rounded-2xl h-[400px] shadow-xl flex flex-col border transition-colors duration-300 ${
      dark ? 'bg-[#202C33] border-[#313D45]' : 'bg-white border-[#E9EDEF]'
    }`}>
      <h3 className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-4 ${textColor}`}>
        Efisiensi Respon
      </h3>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: dark ? "#202C33" : "#FFFFFF", 
                border: `1px solid ${dark ? "#313D45" : "#E9EDEF"}`,
                borderRadius: "8px"
              }} 
            />
            <Legend layout="vertical" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: "10px" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const DeviceBarChart: React.FC<ChartProps> = ({ data, dark }) => {
  const colors = {
    bg: dark ? "#202C33" : "#FFFFFF",
    border: dark ? "#313D45" : "#E9EDEF",
    text: dark ? "#8696A0" : "#667781",
    grid: dark ? "#313D45" : "#F0F2F5",
  };

  return (
    <div className={`lg:col-span-3 p-6 rounded-2xl h-[350px] shadow-xl border transition-colors duration-300 ${
      dark ? 'bg-[#202C33] border-[#313D45]' : 'bg-white border-[#E9EDEF]'
    }`}>
      <h3 className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-6 ${colors.text}`}>
        Performa Lead per Device
      </h3>
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis dataKey="name" stroke={colors.text} fontSize={10} tickLine={false} />
            <YAxis stroke={colors.text} fontSize={10} tickLine={false} />
            <Tooltip 
              cursor={{ fill: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" }}
              contentStyle={{ 
                backgroundColor: colors.bg, 
                border: `1px solid ${colors.border}`,
                borderRadius: "8px"
              }}
            />
            <Bar dataKey="lead_count" name="Total Lead" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};