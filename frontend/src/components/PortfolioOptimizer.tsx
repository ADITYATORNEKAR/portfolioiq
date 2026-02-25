"use client";

import { useQuery } from "@tanstack/react-query";
import { getOptimization } from "@/lib/api";
import type { OptimizationResult, PortfolioAllocation } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, Shield, Scale, Star } from "lucide-react";

interface Props {
  portfolioId: string;
  tickers: string[];
}

const STRATEGY_META: Record<
  string,
  { icon: React.ElementType; color: string; border: string; badge: string; description: string }
> = {
  "Max Sharpe": {
    icon: TrendingUp,
    color: "text-brand-500",
    border: "border-brand-500/40",
    badge: "bg-brand-500/10 text-brand-500",
    description: "Best risk-adjusted return using Prophet 1-year forecasts",
  },
  "Min Volatility": {
    icon: Shield,
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    badge: "bg-emerald-500/10 text-emerald-400",
    description: "Lowest historical variance — conservative allocation",
  },
  "Equal Weight": {
    icon: Scale,
    color: "text-slate-400",
    border: "border-surface-border",
    badge: "bg-slate-700/50 text-slate-400",
    description: "Naive baseline — equal allocation to all tickers",
  },
};

const BAR_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
];

function fmt(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function AllocationCard({
  allocation,
  recommended,
}: {
  allocation: PortfolioAllocation;
  recommended?: boolean;
}) {
  const meta = STRATEGY_META[allocation.strategy] ?? STRATEGY_META["Equal Weight"];
  const Icon = meta.icon;

  const barData = Object.entries(allocation.weights)
    .sort((a, b) => b[1] - a[1])
    .map(([ticker, weight]) => ({ ticker, weight: parseFloat(weight.toFixed(1)) }));

  return (
    <div
      className={`rounded-xl border ${meta.border} bg-surface-card p-5 flex flex-col gap-4 relative`}
    >
      {recommended && (
        <div className="absolute -top-3 left-4 flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow">
          <Star className="h-3 w-3" />
          Recommended
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-surface-dark`}>
            <Icon className={`h-4 w-4 ${meta.color}`} />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{allocation.strategy}</p>
            <p className="text-xs text-slate-500 leading-tight max-w-[200px]">
              {meta.description}
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-surface-dark p-2.5 text-center">
          <p className="text-xs text-slate-500">Expected Return</p>
          <p className={`mt-0.5 text-sm font-bold ${
            allocation.expected_return >= 0 ? "text-green-400" : "text-red-400"
          }`}>
            {fmt(allocation.expected_return)}
          </p>
        </div>
        <div className="rounded-lg bg-surface-dark p-2.5 text-center">
          <p className="text-xs text-slate-500">Volatility</p>
          <p className="mt-0.5 text-sm font-bold text-slate-300">
            {allocation.expected_volatility.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg bg-surface-dark p-2.5 text-center">
          <p className="text-xs text-slate-500">Sharpe Ratio</p>
          <p className={`mt-0.5 text-sm font-bold ${
            allocation.sharpe_ratio >= 1
              ? "text-green-400"
              : allocation.sharpe_ratio >= 0
              ? "text-yellow-400"
              : "text-red-400"
          }`}>
            {allocation.sharpe_ratio.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Allocation bar chart */}
      <div>
        <p className="mb-2 text-xs text-slate-500">Recommended Allocation</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
            <XAxis
              dataKey="ticker"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                background: "#1e293b",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#f1f5f9",
              }}
              formatter={(v: number) => [`${v.toFixed(1)}%`, "Weight"]}
            />
            <Bar dataKey="weight" radius={[4, 4, 0, 0]}>
              {barData.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weights table */}
      <div className="space-y-1.5">
        {barData.map(({ ticker, weight }, i) => (
          <div key={ticker} className="flex items-center gap-2">
            <span
              className="flex-shrink-0 h-2 w-2 rounded-full"
              style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
            />
            <span className="font-mono text-xs font-bold text-white w-12">{ticker}</span>
            <div className="flex-1 h-1.5 rounded-full bg-surface-dark overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${weight}%`,
                  background: BAR_COLORS[i % BAR_COLORS.length],
                }}
              />
            </div>
            <span className="text-xs font-medium text-slate-300 w-10 text-right">
              {weight.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-5 space-y-4">
      <div className="skeleton h-4 w-1/3" />
      <div className="skeleton h-16 w-full" />
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-4 w-2/3" />
    </div>
  );
}

export default function PortfolioOptimizer({ portfolioId }: Props) {
  const { data, isLoading, error } = useQuery<OptimizationResult>({
    queryKey: ["optimize", portfolioId],
    queryFn: () => getOptimization(portfolioId),
    staleTime: 30 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-5 w-48" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-400">
        {(error as Error).message}
      </div>
    );
  }

  if (!data) return null;

  const strategies: { key: keyof OptimizationResult; recommended?: boolean }[] = [
    { key: "max_sharpe", recommended: true },
    { key: "min_volatility" },
    { key: "equal_weight" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-surface-border bg-surface-card p-4">
        <p className="text-sm font-semibold text-white">Portfolio Optimizer</p>
        <p className="mt-1 text-xs text-slate-400">
          {data.basis} · Risk-free rate 4.5%
        </p>
      </div>

      {/* Strategy cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {strategies.map(({ key, recommended }) => {
          const alloc = data[key] as PortfolioAllocation;
          return (
            <AllocationCard
              key={key}
              allocation={alloc}
              recommended={recommended}
            />
          );
        })}
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-slate-600">
        Optimization is based on Prophet model forecasts and historical volatility.
        Not financial advice — past performance does not guarantee future results.
      </p>
    </div>
  );
}
