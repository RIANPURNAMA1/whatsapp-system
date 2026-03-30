import React from "react";
import {
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, LabelList,
} from "recharts";
import { TrendingUp, Zap, BarChart2 } from "lucide-react";

interface ChartProps {
  data: any[];
  dark?: boolean;
}

// ─── Shared design tokens ────────────────────────────────────────────────────
const TOKEN = {
  green:  "#10b981",
  blue:   "#3b82f6",
  orange: "#f97316",
  red:    "#ef4444",
  greenGlow: "rgba(16,185,129,0.18)",
  blueGlow:  "rgba(59,130,246,0.18)",
};

// ─── Shared card wrapper ─────────────────────────────────────────────────────
const ChartCard: React.FC<{
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
}> = ({ children, dark, className = "" }) => (
  <div
    className={`
      relative overflow-hidden rounded-2xl
      ${dark
        ? "bg-[#0f1923] border border-[#1e2e3b]"
        : "bg-white/80 backdrop-blur-sm border border-slate-100"}
      shadow-[0_2px_16px_rgba(0,0,0,0.07)]
      hover:shadow-[0_8px_32px_rgba(0,0,0,0.11)]
      transition-all duration-300
      ${className}
    `}
  >
    {children}
  </div>
);

// ─── Section header inside chart ─────────────────────────────────────────────
const ChartHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  dark?: boolean;
}> = ({ icon, title, subtitle, dark }) => (
  <div className="flex items-start justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center
        ${dark ? "bg-white/8" : "bg-slate-50 border border-slate-100"}`}>
        <span className={dark ? "text-slate-400" : "text-slate-500"}>{icon}</span>
      </div>
      <div>
        <h3 className={`text-[11px] font-black uppercase tracking-[0.16em] leading-none
          ${dark ? "text-slate-400" : "text-slate-400"}`}>
          {title}
        </h3>
        {subtitle && <div className="mt-1">{subtitle}</div>}
      </div>
    </div>
  </div>
);

// ─── ActivityChart ────────────────────────────────────────────────────────────
export const ActivityChart: React.FC<ChartProps> = ({ data, dark }) => {
  const gridColor   = dark ? "#1a2a38" : "#f1f5f9";
  const axisColor   = dark ? "#4a6072" : "#94a3b8";
  const tooltipBg   = dark ? "#0f1923" : "#ffffff";
  const tooltipBdr  = dark ? "#1e2e3b" : "#e2e8f0";

  const totalMasuk  = data.reduce((a, b) => a + (b.masuk  || 0), 0);
  const totalKeluar = data.reduce((a, b) => a + (b.keluar || 0), 0);

  return (
    <ChartCard dark={dark} className="p-6 h-[400px] flex flex-col">
      <ChartHeader
        dark={dark}
        icon={<TrendingUp size={16} />}
        title="Aktivitas Pesan"
        subtitle={
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span className={`text-[10px] font-bold ${dark ? "text-slate-500" : "text-slate-400"}`}>
                Masuk <strong className={dark ? "text-white" : "text-slate-700"}>{totalMasuk}</strong>
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
              <span className={`text-[10px] font-bold ${dark ? "text-slate-500" : "text-slate-400"}`}>
                Keluar <strong className={dark ? "text-white" : "text-slate-700"}>{totalKeluar}</strong>
              </span>
            </span>
          </div>
        }
      />

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            {/* Gradient defs */}
            <defs>
              <linearGradient id="gradMasuk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={TOKEN.green} stopOpacity={0.15} />
                <stop offset="100%" stopColor={TOKEN.green} stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="gradKeluar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={TOKEN.blue} stopOpacity={0.12} />
                <stop offset="100%" stopColor={TOKEN.blue} stopOpacity={0}    />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="time"
              stroke={axisColor} fontSize={9} tickLine={false} axisLine={false}
              dy={8} tick={{ fontWeight: 700, letterSpacing: "0.04em" }}
            />
            <YAxis stroke={axisColor} fontSize={9} tickLine={false} axisLine={false} />

            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBdr}`,
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: 700,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                color: dark ? "#ffffff" : "#1e293b",
              }}
              cursor={{ stroke: dark ? "#ffffff10" : "#00000008", strokeWidth: 1 }}
            />

            <Line
              type="monotone" dataKey="masuk" name="Masuk"
              stroke={TOKEN.green} strokeWidth={2.5} dot={false}
              activeDot={{ r: 4, fill: TOKEN.green, strokeWidth: 2, stroke: "#fff" }}
            />
            <Line
              type="monotone" dataKey="keluar" name="Keluar"
              stroke={TOKEN.blue} strokeWidth={2.5} dot={false}
              activeDot={{ r: 4, fill: TOKEN.blue, strokeWidth: 2, stroke: "#fff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

// ─── SLAChart ─────────────────────────────────────────────────────────────────
export const SLAChart: React.FC<ChartProps> = ({ data, dark }) => {
  const totalValue = data.reduce((a, c) => a + (c.value || 0), 0);
  const sesuai     = data.find((d) => d.name === "Sesuai SLA");
  const slaRate    = totalValue ? Math.round(((sesuai?.value || 0) / totalValue) * 100) : 0;

  const tooltipBg  = dark ? "#0f1923" : "#ffffff";
  const tooltipBdr = dark ? "#1e2e3b" : "#e2e8f0";

  return (
    <ChartCard dark={dark} className="p-6 h-[400px] flex flex-col">
      <ChartHeader
        dark={dark}
        icon={<Zap size={16} />}
        title="Efisiensi Respon (SLA)"
        subtitle={
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full
              ${slaRate >= 70 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
            >
              {slaRate}% On-Time
            </span>
          </div>
        }
      />

      <div className="flex-1 min-h-0 relative">
        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10" style={{ top: "-20px" }}>
          <span className={`text-[9px] font-black uppercase tracking-[0.14em] ${dark ? "text-slate-500" : "text-slate-400"}`}>
            Total
          </span>
          <span className={`text-3xl font-black leading-none mt-0.5 ${dark ? "text-white" : "text-slate-800"}`}>
            {totalValue}
          </span>
          <span className={`text-[9px] font-semibold mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>
            Pesan
          </span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {data.map((entry, i) => (
                <filter key={i} id={`glow-${i}`} x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
            </defs>

            <Pie
              data={data}
              innerRadius={72} outerRadius={100}
              paddingAngle={5} dataKey="value"
              stroke="none"
              animationBegin={0} animationDuration={1200}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  style={{ filter: `drop-shadow(0 3px 8px ${entry.color}55)` }}
                />
              ))}
            </Pie>

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0];
                const pct = totalValue ? Math.round(((p.value as number) / totalValue) * 100) : 0;
                return (
                  <div
                    className="p-3 rounded-xl shadow-xl"
                    style={{
                      background: tooltipBg,
                      border: `1px solid ${tooltipBdr}`,
                      minWidth: "140px",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.payload.color }} />
                      <span className={`text-[10px] font-black uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>
                        {p.name}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className={`text-xl font-black ${dark ? "text-white" : "text-slate-800"}`}>{p.value}</span>
                      <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
                    </div>
                  </div>
                );
              }}
            />

            <Legend
              verticalAlign="bottom" align="center"
              iconType="circle" iconSize={7}
              formatter={(value) => (
                <span style={{
                  fontSize: "9px", fontWeight: 800,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  color: dark ? "#64748b" : "#94a3b8",
                }}>
                  {value}
                </span>
              )}
              wrapperStyle={{ paddingTop: "12px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

// ─── DeviceBarChart ───────────────────────────────────────────────────────────
export const DeviceBarChart: React.FC<ChartProps> = ({ data, dark }) => {
  const gridColor  = dark ? "#1a2a38" : "#f1f5f9";
  const axisColor  = dark ? "#4a6072" : "#94a3b8";
  const tooltipBg  = dark ? "#0f1923" : "#ffffff";
  const tooltipBdr = dark ? "#1e2e3b" : "#e2e8f0";

  const totalLeads   = data.reduce((a, b) => a + (b.lead_count    || 0), 0);
  const totalClosing = data.reduce((a, b) => a + (b.closing_count || 0), 0);
  const efficiencyPct = totalLeads
    ? Math.round((totalClosing / totalLeads) * 100)
    : 0;

  return (
    <ChartCard dark={dark} className="p-6 h-[400px] flex flex-col">
      <ChartHeader
        dark={dark}
        icon={<BarChart2 size={16} />}
        title="Device Performance"
        subtitle={
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span className={`text-[10px] font-bold ${dark ? "text-slate-500" : "text-slate-400"}`}>
                Leads <strong className={dark ? "text-white" : "text-slate-700"}>{totalLeads}</strong>
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
              <span className={`text-[10px] font-bold ${dark ? "text-slate-500" : "text-slate-400"}`}>
                Closing <strong className={dark ? "text-white" : "text-slate-700"}>{totalClosing}</strong>
              </span>
            </span>

            {/* Efficiency badge */}
            <span className={`ml-auto text-[10px] font-black px-2.5 py-1 rounded-lg
              ${efficiencyPct >= 50
                ? (dark ? "bg-emerald-900/40 text-emerald-400" : "bg-emerald-50 text-emerald-600")
                : (dark ? "bg-orange-900/40 text-orange-400" : "bg-orange-50 text-orange-600")
              }`}
            >
              {efficiencyPct}% Efisiensi
            </span>
          </div>
        }
      />

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 4, left: -24, bottom: 0 }} barGap={6}>
            <defs>
              <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={TOKEN.green} stopOpacity={1}   />
                <stop offset="100%" stopColor={TOKEN.green} stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={TOKEN.blue} stopOpacity={1}   />
                <stop offset="100%" stopColor={TOKEN.blue} stopOpacity={0.7} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="name" stroke={axisColor} fontSize={9}
              tickLine={false} axisLine={false}
              tick={{ fontWeight: 800, fill: axisColor, letterSpacing: "0.04em" }}
              dy={10}
            />
            <YAxis hide domain={[0, "auto"]} />

            <Tooltip
              cursor={{ fill: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", radius: 10 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload;
                const rate = row.lead_count
                  ? Math.round((row.closing_count / row.lead_count) * 100)
                  : 0;
                return (
                  <div
                    className="p-3.5 rounded-xl shadow-xl"
                    style={{ background: tooltipBg, border: `1px solid ${tooltipBdr}`, minWidth: "150px" }}
                  >
                    <p className={`text-[9px] font-black uppercase tracking-widest mb-2.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                      {row.name}
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-6">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Leads
                        </span>
                        <span className={`text-sm font-black ${dark ? "text-white" : "text-slate-800"}`}>{row.lead_count}</span>
                      </div>
                      <div className="flex items-center justify-between gap-6">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                          <span className="w-2 h-2 rounded-full bg-blue-400" /> Closing
                        </span>
                        <span className={`text-sm font-black ${dark ? "text-white" : "text-slate-800"}`}>{row.closing_count}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Conv. Rate</span>
                        <span className={`text-[11px] font-black ${rate >= 50 ? "text-emerald-500" : "text-orange-500"}`}>{rate}%</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />

            <Bar dataKey="lead_count" fill="url(#barGreen)" radius={[5, 5, 0, 0]} barSize={28} animationDuration={1400}>
              <LabelList
                dataKey="lead_count"
                position="top"
                content={(props: any) => {
                  const { x, y, width, value } = props;
                  if (!value) return null;
                  return (
                    <text x={x + width / 2} y={y - 7}
                      fill={TOKEN.green} fontSize={9} fontWeight="900"
                      textAnchor="middle"
                    >
                      {value}
                    </text>
                  );
                }}
              />
            </Bar>

            <Bar dataKey="closing_count" fill="url(#barBlue)" radius={[5, 5, 0, 0]} barSize={28} animationDuration={1800}>
              <LabelList
                dataKey="closing_count"
                position="top"
                content={(props: any) => {
                  const { x, y, width, value } = props;
                  if (!value) return null;
                  return (
                    <text x={x + width / 2} y={y - 7}
                      fill={TOKEN.blue} fontSize={9} fontWeight="900"
                      textAnchor="middle"
                    >
                      {value}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};