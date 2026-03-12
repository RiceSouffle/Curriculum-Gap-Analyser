"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AnalysisResult } from "@/types";

interface SkillGapChartProps {
  result: AnalysisResult;
}

export function SkillGapChart({ result }: SkillGapChartProps) {
  const chartData = [
    ...result.coveredSkills.map((s) => ({
      name: s.name,
      frequency: Math.round(s.frequency * 100),
      status: "covered" as const,
    })),
    ...result.missingSkills.map((s) => ({
      name: s.name,
      frequency: Math.round(s.frequency * 100),
      status: "missing" as const,
    })),
  ]
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 25);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 30)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 130, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            fontSize={11}
            stroke="var(--color-muted-foreground)"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            fontSize={12}
            stroke="var(--color-muted-foreground)"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => [`${value}% of postings`, "Demand"]}
            contentStyle={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              fontSize: "13px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}
          />
          <Bar dataKey="frequency" radius={[0, 6, 6, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.status === "covered" ? "#34d399" : "#f87171"}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-8 mt-6 text-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-[#34d399]" />
          <span className="text-muted-foreground">Covered</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-[#f87171]" />
          <span className="text-muted-foreground">Missing</span>
        </div>
      </div>
    </div>
  );
}
