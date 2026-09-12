// components/charts/yield-trend-chart.tsx
"use client"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export function YieldTrendChart({ data }: { data: { day: string; yield: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C9A961" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#C9A961" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#9A968C", fontSize: 12 }} />
        <YAxis domain={[80, 100]} tickLine={false} axisLine={false} width={40} tick={{ fill: "#6E6A62", fontSize: 12 }} />
        <Tooltip contentStyle={{ background: "#1B1B1F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#F4F2EC" }}
          labelStyle={{ color: "#9A968C" }} formatter={(v) => [`${v}%`, "Yield"]} />
        <Area type="monotone" dataKey="yield" stroke="#C9A961" strokeWidth={2} fill="url(#goldFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}