// components/charts/production-output-chart.tsx
"use client"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const TOOLTIP = { background: "#1B1B1F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#F4F2EC" }

export function ProductionOutputChart({ data }: {
  data: { day: string; planned: number; actual: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={6}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#9A968C", fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} width={40} tick={{ fill: "#6E6A62", fontSize: 12 }} />
        <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={TOOLTIP} labelStyle={{ color: "#9A968C" }} />
        <Bar dataKey="planned" name="Planned" fill="#3A3A40" radius={[4, 4, 0, 0]} maxBarSize={26} />
        <Bar dataKey="actual" name="Actual" fill="#C9A961" radius={[4, 4, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  )
}