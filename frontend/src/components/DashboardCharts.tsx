import React, { useMemo } from "react";
import {
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from "recharts";

interface ChartProps {
  data: any[];
  dark?: boolean;
}

// ─── Meta/Facebook design tokens ─────────────────────────────────────────────
const FB = {
  blue: "#0866FF",
  blueLight: "#DEEBFF",
  blueFaint: "rgba(24,119,242,0.08)",
  green: "#31A24C",
  orange: "#F5A623",
  red: "#E74C3C",
  gray: "#65676B",
  grayLight: "#E4E6EB",
  grayBg: "#F0F2F5",
  white: "#FFFFFF",
};

// ─── Shared card wrapper (Meta-style clean card) ────────────────────────────
const ChartCard: React.FC<{
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
}> = ({ children, dark, className = "" }) => (
  <div
    className={`
      rounded-lg overflow-hidden
      ${dark
        ? "bg-[#1A1D21] border border-[#2D2F33]"
        : "bg-white border border-[#E4E6EB]"}
      ${className}
    `}
  >
    {children}
  </div>
);

// ─── Section header inside chart ─────────────────────────────────────────────
const ChartHeader: React.FC<{
  title: string;
  subtitle?: React.ReactNode;
  dark?: boolean;
}> = ({ title, subtitle, dark }) => (
  <div className="px-5 pt-4 pb-3 border-b border-[#E4E6EB]">
    <div className="flex items-center justify-between">
      <div>
        <h3 className={`text-[13px] font-semibold ${dark ? "text-[#E4E6EB]" : "text-[#050505]"}`}>
          {title}
        </h3>
        {subtitle && <div className="mt-1">{subtitle}</div>}
      </div>
    </div>
  </div>
);

// ─── Color palette for device lines ──────────────────────────────────────────
const DEVICE_COLORS = [
  "#0866FF", "#31A24C", "#F5A623", "#E74C3C", "#9B59B6",
  "#1ABC9C", "#E67E22", "#3498DB", "#2ECC71", "#E91E63",
  "#00BCD4", "#FF5722", "#673AB7", "#009688", "#795548",
];

// ─── LeadsActivityChart (per-device leads per hour/day) ──────────────────────
export const LeadsActivityChart: React.FC<ChartProps> = React.memo(({ data, dark }) => {
  const gridColor  = dark ? "#2D2F33" : "#E4E6EB";
  const axisColor  = dark ? "#65676B" : "#65676B";

  // data is raw: [{ time, session_id, device_name, leads }]
  // transform into Recharts format: [{ time, "Device1": 5, "Device2": 3 }]
  const { chartData, deviceKeys, colorMap } = useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    const devices = new Set<string>();

    for (const row of data) {
      if (!row.time || !row.device_name) continue;
      devices.add(row.device_name);
      if (!map.has(row.time)) map.set(row.time, { time: row.time });
      const entry = map.get(row.time)!;
      entry[row.device_name] = (entry[row.device_name] || 0) + (row.leads || 0);
    }

    const sorted = Array.from(map.values()).sort((a, b) => a.time.localeCompare(b.time));
    const deviceArr = Array.from(devices).sort();
    const cmap: Record<string, string> = {};
    deviceArr.forEach((d, i) => { cmap[d] = DEVICE_COLORS[i % DEVICE_COLORS.length]; });

    return { chartData: sorted, deviceKeys: deviceArr, colorMap: cmap };
  }, [data]);

  const totalLeads = chartData.reduce((a, b) => {
    return a + deviceKeys.reduce((s, d) => s + ((b as any)[d] || 0), 0);
  }, 0);

  return (
    <ChartCard dark={dark} className="h-[400px] flex flex-col">
      <ChartHeader
        dark={dark}
        title="Aktivitas Leads Perdevice"
        subtitle={
          <div className="flex items-center gap-4 mt-1 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className={`text-[11px] ${dark ? "text-[#65676B]" : "text-[#65676B]"}`}>
                Total Leads Masuk <strong className={dark ? "text-[#E4E6EB]" : "text-[#050505]"}>{totalLeads}</strong>
              </span>
            </span>
            {deviceKeys.slice(0, 5).map(name => (
              <span key={name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorMap[name] }} />
                <span className={`text-[11px] ${dark ? "text-[#65676B]" : "text-[#65676B]"}`}>
                  {name} <strong className={dark ? "text-[#E4E6EB]" : "text-[#050505]"}>{chartData.reduce((a, b) => a + ((b as any)[name] || 0), 0)}</strong>
                </span>
              </span>
            ))}
            {deviceKeys.length > 5 && (
              <span className={`text-[11px] ${dark ? "text-[#65676B]" : "text-[#65676B]"}`}>
                +{deviceKeys.length - 5} lainnya
              </span>
            )}
          </div>
        }
      />

      <div className="flex-1 min-h-0 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="time"
              stroke={axisColor} fontSize={10} tickLine={false} axisLine={false}
              dy={6} tick={{ fontWeight: 500, fill: axisColor }}
            />
            <YAxis stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} tick={{ fill: axisColor }} />

            <Tooltip
              contentStyle={{
                backgroundColor: dark ? "#242526" : FB.white,
                border: `1px solid ${gridColor}`,
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                color: dark ? "#E4E6EB" : "#050505",
              }}
              cursor={{ stroke: dark ? "#ffffff15" : "#00000008", strokeWidth: 1 }}
            />

            {deviceKeys.map(name => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                name={name}
                stroke={colorMap[name]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: colorMap[name], strokeWidth: 2, stroke: FB.white }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
});

// ─── SLAChart (Meta-style donut) ──────────────────────────────────────────────
export const SLAChart: React.FC<ChartProps> = React.memo(({ data, dark }) => {
  const totalValue = data.reduce((a, c) => a + (c.value || 0), 0);
  const sesuai     = data.find((d) => d.name === "Sesuai SLA");
  const slaRate    = totalValue ? Math.round(((sesuai?.value || 0) / totalValue) * 100) : 0;

  const COLORS = [FB.green, FB.orange, FB.red];

  return (
    <ChartCard dark={dark} className="h-[400px] flex flex-col">
      <ChartHeader
        dark={dark}
        title="Efisiensi Respon (SLA)"
        subtitle={
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded inline-block mt-1 ${
              slaRate >= 70 ? "bg-[#DEEBFF] text-[#0866FF]" : "bg-[#FFEBEE] text-[#E74C3C]"
            }`}
          >
            {slaRate}% On-Time
          </span>
        }
      />

      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10" style={{ top: "-16px" }}>
          <span className={`text-[10px] font-medium ${dark ? "text-[#65676B]" : "text-[#65676B]"}`}>
            Total
          </span>
          <span className={`text-2xl font-bold leading-none mt-0.5 ${dark ? "text-[#E4E6EB]" : "text-[#050505]"}`}>
            {totalValue}
          </span>
          <span className={`text-[10px] font-medium mt-0.5 ${dark ? "text-[#65676B]" : "text-[#65676B]"}`}>
            Pesan
          </span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={75} outerRadius={100}
              paddingAngle={3} dataKey="value"
              stroke="none"
              animationBegin={0} animationDuration={1200}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0];
                const pct = totalValue ? Math.round(((p.value as number) / totalValue) * 100) : 0;
                return (
                  <div
                    className="p-3 rounded-lg shadow-lg"
                    style={{
                      background: dark ? "#242526" : FB.white,
                      border: `1px solid ${dark ? "#2D2F33" : FB.grayLight}`,
                      minWidth: "140px",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.payload.color || COLORS[0] }} />
                      <span className={`text-[11px] font-semibold ${dark ? "text-[#E4E6EB]" : "text-[#050505]"}`}>
                        {p.name}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className={`text-lg font-bold ${dark ? "text-[#E4E6EB]" : "text-[#050505]"}`}>{p.value}</span>
                      <span className="text-[11px] font-medium text-[#65676B]">{pct}%</span>
                    </div>
                  </div>
                );
              }}
            />

            <Legend
              verticalAlign="bottom" align="center"
              iconType="circle" iconSize={8}
              formatter={(value) => (
                <span style={{
                  fontSize: "11px", fontWeight: 500,
                  color: dark ? "#65676B" : "#65676B",
                }}>
                  {value}
                </span>
              )}
              wrapperStyle={{ paddingTop: "8px", paddingBottom: "8px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
});

// ─── DeviceBarChart ───────────────────────────────────────────────────────────
export const DeviceBarChart: React.FC<ChartProps> = React.memo(({ data, dark }) => {
  const gridColor  = dark ? "#2D2F33" : "#E4E6EB";
  const axisColor  = dark ? "#65676B" : "#65676B";
  const textColor  = dark ? "#E4E6EB" : "#050505";

  const totalLeads   = data.reduce((a, b) => a + (b.lead_count    || 0), 0);
  const totalClosing = data.reduce((a, b) => a + (b.closing_count || 0), 0);
  const totalOrganik = data.reduce((a, b) => a + (b.leads_organik  || 0), 0);
  const efficiencyPct = totalLeads
    ? Math.round((totalClosing / totalLeads) * 100)
    : 0;

  return (
    <ChartCard dark={dark} className="h-[400px] flex flex-col">
      <ChartHeader
        dark={dark}
        title="Device Performance"
        subtitle={
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FB.blue }} />
              <span className={`text-[11px] ${dark ? "text-[#65676B]" : "text-[#65676B]"}`}>
                Leads <strong className={dark ? "text-[#E4E6EB]" : "text-[#050505]"}>{totalLeads}</strong>
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FB.green }} />
              <span className={`text-[11px] ${dark ? "text-[#65676B]" : "text-[#65676B]"}`}>
                Closing <strong className={dark ? "text-[#E4E6EB]" : "text-[#050505]"}>{totalClosing}</strong>
              </span>
            </span>
          </div>
        }
      />

      <div className="flex-1 min-h-0 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 8, left: -20, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="name" stroke={axisColor} fontSize={10}
              tickLine={false} axisLine={false}
              tick={{ fontWeight: 500, fill: axisColor }}
              dy={6}
            />
            <YAxis hide domain={[0, "auto"]} />

            <Tooltip
              cursor={{ fill: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload;
                const rate = row.lead_count
                  ? Math.round((row.closing_count / row.lead_count) * 100)
                  : 0;
                return (
                  <div
                    className="p-3.5 rounded-lg shadow-lg"
                    style={{
                      background: dark ? "#242526" : FB.white,
                      border: `1px solid ${dark ? "#2D2F33" : FB.grayLight}`,
                      minWidth: "170px",
                    }}
                  >
                    <p className={`text-[10px] font-semibold mb-2.5 ${dark ? "text-[#65676B]" : "text-[#65676B]"}`}>
                      {row.name}
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-6">
                        <span className="flex items-center gap-1.5 text-[11px] text-[#65676B]">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FB.blue }} /> Leads
                        </span>
                        <span className={`text-sm font-bold ${dark ? "text-[#E4E6EB]" : "text-[#050505]"}`}>{row.lead_count}</span>
                      </div>
                      <div className="flex items-center justify-between gap-6">
                        <span className="flex items-center gap-1.5 text-[11px] text-[#65676B]">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FB.green }} /> Closing
                        </span>
                        <span className={`text-sm font-bold ${dark ? "text-[#E4E6EB]" : "text-[#050505]"}`}>{row.closing_count}</span>
                      </div>
                      <div className="flex items-center justify-between gap-6">
                        <span className="flex items-center gap-1.5 text-[11px] text-[#65676B]">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FB.orange }} /> Organik
                        </span>
                        <span className={`text-sm font-bold ${dark ? "text-[#E4E6EB]" : "text-[#050505]"}`}>{row.leads_organik || 0}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-[#E4E6EB] flex items-center justify-between">
                        <span className="text-[10px] text-[#65676B]">Conv. Rate</span>
                        <span className={`text-[11px] font-bold ${rate >= 50 ? "text-[#31A24C]" : "text-[#F5A623]"}`}>{rate}%</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />

            <Bar dataKey="lead_count" fill={FB.blue} radius={[3, 3, 0, 0]} barSize={20} animationDuration={1400} />
            <Bar dataKey="closing_count" fill={FB.green} radius={[3, 3, 0, 0]} barSize={20} animationDuration={1800} />
            <Bar dataKey="leads_organik" fill={FB.orange} radius={[3, 3, 0, 0]} barSize={20} animationDuration={2000} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
});
