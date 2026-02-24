"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { BacktestResult } from "@/lib/types";

interface Props {
  data: BacktestResult;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-surface-border bg-surface-card p-3 text-xs shadow-xl">
      <p className="mb-2 font-medium text-slate-300">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {entry.value.toFixed(1)}
        </p>
      ))}
    </div>
  );
}

export default function BacktestChart({ data }: Props) {
  // Sample data for performance (show ~120 points max)
  const step = Math.max(1, Math.floor(data.timeseries.length / 120));
  const chartData = data.timeseries.filter((_, i) => i % step === 0);

  const portfolioFinal = chartData[chartData.length - 1]?.portfolio ?? 100;
  const benchmarkFinal = chartData[chartData.length - 1]?.benchmark ?? 100;
  const portfolioReturn = ((portfolioFinal - 100) / 100) * 100;
  const benchmarkReturn = ((benchmarkFinal - 100) / 100) * 100;

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">Cumulative Returns</h3>
          <p className="text-xs text-slate-500">
            Equal-weight portfolio vs {data.timeseries.length > 0 ? "benchmark" : ""}
            {" · "}monthly rebalance · {data.transaction_cost_pct}% transaction cost
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <span className={portfolioReturn >= 0 ? "text-green-400" : "text-red-400"}>
            Portfolio: {portfolioReturn > 0 ? "+" : ""}{portfolioReturn.toFixed(1)}%
          </span>
          <span className={benchmarkReturn >= 0 ? "text-blue-400" : "text-red-400"}>
            Benchmark: {benchmarkReturn > 0 ? "+" : ""}{benchmarkReturn.toFixed(1)}%
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            tickFormatter={(val) => val.slice(0, 7)} // YYYY-MM
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}`}
            domain={["auto", "auto"]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
          />
          <ReferenceLine y={100} stroke="#334155" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="portfolio"
            name="Portfolio"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#3b82f6" }}
          />
          <Line
            type="monotone"
            dataKey="benchmark"
            name="Benchmark"
            stroke="#64748b"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={false}
            activeDot={{ r: 3, fill: "#64748b" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
