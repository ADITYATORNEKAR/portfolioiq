"use client";

import type { BacktestMetrics } from "@/lib/types";

interface Props {
  metrics: BacktestMetrics;
}

function metricColor(value: number, thresholds: [number, number]): string {
  if (value >= thresholds[1]) return "text-green-400";
  if (value >= thresholds[0]) return "text-yellow-400";
  return "text-red-400";
}

function drawdownColor(value: number): string {
  if (value > -15) return "text-green-400";
  if (value > -30) return "text-yellow-400";
  return "text-red-400";
}

export default function RiskMetrics({ metrics }: Props) {
  const cards = [
    {
      label: "Annual Return",
      value: `${metrics.annual_return > 0 ? "+" : ""}${metrics.annual_return.toFixed(1)}%`,
      colorClass: metrics.annual_return > 0 ? "text-green-400" : "text-red-400",
      sub: `Total: ${metrics.total_return > 0 ? "+" : ""}${metrics.total_return.toFixed(1)}%`,
    },
    {
      label: "Sharpe Ratio",
      value: metrics.sharpe_ratio.toFixed(2),
      colorClass: metricColor(metrics.sharpe_ratio, [1.0, 1.5]),
      sub: "risk-adjusted return",
    },
    {
      label: "Max Drawdown",
      value: `${metrics.max_drawdown.toFixed(1)}%`,
      colorClass: drawdownColor(metrics.max_drawdown),
      sub: "largest peak-to-trough",
    },
    {
      label: "Sortino Ratio",
      value: metrics.sortino_ratio.toFixed(2),
      colorClass: metricColor(metrics.sortino_ratio, [1.0, 2.0]),
      sub: "downside risk-adj return",
    },
    {
      label: "Calmar Ratio",
      value: metrics.calmar_ratio.toFixed(2),
      colorClass: metricColor(metrics.calmar_ratio, [0.5, 1.0]),
      sub: "return / max drawdown",
    },
    {
      label: "Win Rate",
      value: `${metrics.win_rate.toFixed(1)}%`,
      colorClass: metricColor(metrics.win_rate, [50, 55]),
      sub: "% of profitable days",
    },
    {
      label: "Alpha",
      value: `${metrics.alpha > 0 ? "+" : ""}${metrics.alpha.toFixed(2)}%`,
      colorClass: metrics.alpha > 0 ? "text-green-400" : "text-red-400",
      sub: "excess return vs benchmark",
    },
    {
      label: "Beta",
      value: metrics.beta.toFixed(2),
      colorClass:
        Math.abs(metrics.beta - 1) < 0.3
          ? "text-yellow-400"
          : metrics.beta < 1
          ? "text-green-400"
          : "text-red-400",
      sub: "market sensitivity",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-surface-border bg-surface-card p-4"
        >
          <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
          <p className={`mt-1 text-2xl font-bold font-mono ${card.colorClass}`}>
            {card.value}
          </p>
          <p className="mt-0.5 text-xs text-slate-600">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
