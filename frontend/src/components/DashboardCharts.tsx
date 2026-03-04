import React from "react";
import { 
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, 
  LabelList
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
    primary: "#00a884", // WhatsApp Green
  };

  return (
    <div
      className={`lg:col-span-3 p-6 rounded-3xl h-[400px] shadow-2xl border transition-all duration-500 ${
        dark ? "bg-[#111B21] border-[#222E35]" : "bg-white border-[#E9EDEF]"
      }`}
    >
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className={`text-[11px] font-black uppercase tracking-[0.25em] ${colors.text}`}>
            Distribusi Leads per Device
          </h3>
          <p className="text-[9px] text-[#00a884] font-bold mt-1 opacity-80">
            BERDASARKAN KONTAK BARU & PESAN PERTAMA
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${dark ? 'bg-[#202C33] text-white' : 'bg-gray-100 text-gray-600'}`}>
          Total: {data.reduce((acc, curr) => acc + (curr.lead_count || 0), 0)} Leads
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} opacity={0.5} />
            <XAxis
              dataKey="name"
              stroke={colors.text}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fontWeight: "700", fill: dark ? "#AEBAC1" : "#54656F" }}
              dy={10}
            />
            <YAxis hide domain={[0, 'auto']} />
            <Tooltip
              cursor={{ fill: dark ? "#2A3942" : "#F0F2F5", radius: 8 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className={`p-3 rounded-xl border shadow-xl ${dark ? 'bg-[#233138] border-[#313D45]' : 'bg-white border-gray-100'}`}>
                      <p className={`text-[10px] font-bold uppercase mb-1 ${colors.text}`}>{payload[0].payload.name}</p>
                      <p className="text-lg font-black text-[#00a884]">{payload[0].value} <span className="text-[10px] font-normal text-gray-400">Leads</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="lead_count" radius={[10, 10, 0, 0]} barSize={50}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors.primary} 
                  fillOpacity={1 - (index * 0.15)} // Efek gradasi visual antar bar
                />
              ))}
              <LabelList 
                dataKey="lead_count" 
                position="top" 
                style={{ fill: dark ? "#FFFFFF" : "#111B21", fontSize: 12, fontWeight: "900" }} 
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};