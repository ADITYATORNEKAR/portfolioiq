"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { TickerForecast } from "@/lib/types";

type Horizon = "30d" | "60d" | "90d" | "6m" | "1y";

const HORIZONS: { id: Horizon; label: string }[] = [
  { id: "30d", label: "30d" },
  { id: "60d", label: "60d" },
  { id: "90d", label: "90d" },
  { id: "6m", label: "6m" },
  { id: "1y", label: "12m" },
];

const HORIZON_DAYS: Record<Horizon, number> = {
  "30d": 30,
  "60d": 60,
  "90d": 90,
  "6m": 182,
  "1y": 365,
};

interface Props {
  forecast: TickerForecast;
  companyName?: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export default function ForecastChart({ forecast, companyName }: Props) {
  const [horizon, setHorizon] = useState<Horizon>("1y");

  const horizonDays = HORIZON_DAYS[horizon];
  const futureSlice = forecast.future_series.slice(0, horizonDays);

  // ── Trend direction: compare last vs first point of the selected slice ───
  const isTrendUp =
    futureSlice.length > 1
      ? futureSlice[futureSlice.length - 1].yhat >= futureSlice[0].yhat
      : true;

  // Neon green for upward, orange-red for downward
  const trendColor = isTrendUp ? "#22c55e" : "#f97316";
  const gradId = `gradF_${forecast.ticker}`;
  const bandId = `gradB_${forecast.ticker}`;

  const lastHistDate =
    forecast.historical.length > 0
      ? forecast.historical[forecast.historical.length - 1].date
      : null;

  const chartData = [
    ...forecast.historical.map((p) => ({
      date: p.date,
      actual: p.yhat,
      forecast: null as number | null,
      lower: null as number | null,
      upper: null as number | null,
    })),
    ...futureSlice.map((p) => ({
      date: p.date,
      actual: null as number | null,
      forecast: p.yhat,
      lower: p.yhat_lower,
      upper: p.yhat_upper,
    })),
  ];

  const horizonKey = `forecast_${horizon}` as keyof TickerForecast;
  const horizonPoint = forecast[horizonKey] as {
    date: string;
    yhat: number;
    yhat_lower: number;
    yhat_upper: number;
  } | undefined;

  const currentPrice =
    forecast.historical.length > 0
      ? forecast.historical[forecast.historical.length - 1].yhat
      : null;

  const expectedReturn =
    currentPrice && horizonPoint && currentPrice > 0
      ? ((horizonPoint.yhat - currentPrice) / currentPrice) * 100
      : null;

  // 12-month target — always computed regardless of selected horizon
  const target1y = forecast.forecast_1y;
  const target1yReturn =
    currentPrice && target1y && currentPrice > 0
      ? ((target1y.yhat - currentPrice) / currentPrice) * 100
      : null;

  // Base y-axis on forecast/actual prices only
  const allPrices = chartData.flatMap((d) =>
    [d.actual, d.forecast].filter((v): v is number => v !== null)
  );
  if (target1y?.yhat) allPrices.push(target1y.yhat);
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) * 0.95 : 0;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) * 1.05 : 100;

  const tickFormatter = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  };

  const show12mCard = horizon !== "1y" && target1y && target1yReturn !== null;

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          {/* Company name [TICKER] format */}
          <h3 className="font-mono text-lg font-bold text-white">
            {companyName ? (
              <>
                <span className="font-sans font-semibold">{companyName}</span>
                <span className="ml-1.5 text-slate-400">[{forecast.ticker}]</span>
              </>
            ) : (
              forecast.ticker
            )}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-slate-400">Prophet model · 12-month forecast</p>
            {/* Trend badge */}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                isTrendUp
                  ? "bg-green-500/15 text-green-400"
                  : "bg-orange-500/15 text-orange-400"
              }`}
            >
              {isTrendUp ? "↑ Upward" : "↓ Downward"}
            </span>
          </div>
        </div>

        {/* Horizon toggle */}
        <div className="flex gap-1 rounded-lg bg-surface-border/30 p-1">
          {HORIZONS.map((h) => (
            <button
              key={h.id}
              onClick={() => setHorizon(h.id)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                horizon === h.id
                  ? "bg-brand-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {horizonPoint && (
        <div className="mb-4 space-y-3">
          <div className={`grid gap-3 ${show12mCard ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
            <div className="rounded-lg bg-surface/60 border border-surface-border/50 p-3">
              <p className="text-xs text-slate-500">Current Price</p>
              <p className="mt-0.5 text-sm font-semibold text-white">
                {currentPrice ? fmt(currentPrice) : "—"}
              </p>
            </div>
            <div className="rounded-lg bg-surface/60 border border-surface-border/50 p-3">
              <p className="text-xs text-slate-500">Forecast ({horizon === "1y" ? "12m" : horizon})</p>
              <p
                className={`mt-0.5 text-sm font-semibold ${
                  expectedReturn !== null && expectedReturn >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {fmt(horizonPoint.yhat)}
              </p>
            </div>
            <div className="rounded-lg bg-surface/60 border border-surface-border/50 p-3">
              <p className="text-xs text-slate-500">Expected Return</p>
              <p
                className={`mt-0.5 text-sm font-semibold ${
                  expectedReturn !== null && expectedReturn >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {expectedReturn !== null ? fmtPct(expectedReturn) : "—"}
              </p>
            </div>

            {/* 12-Month Target card */}
            {show12mCard && (
              <div className="rounded-lg bg-surface/60 border border-indigo-500/25 p-3">
                <p className="text-xs text-indigo-400">12-Month Target</p>
                <p
                  className={`mt-0.5 text-sm font-semibold ${
                    target1yReturn >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {fmt(target1y.yhat)}
                </p>
                <p
                  className={`text-xs font-medium ${
                    target1yReturn >= 0 ? "text-green-400/70" : "text-red-400/70"
                  }`}
                >
                  {fmtPct(target1yReturn)}
                </p>
              </div>
            )}
          </div>

          {/* Sentiment-adjusted 30d card */}
          {horizon === "30d" && forecast.sentiment_adjusted_30d && (
            <div className="rounded-lg border border-surface-border bg-surface/60 p-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <SentimentDot score={forecast.sentiment_score ?? 0} />
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 font-medium">Sentiment-adjusted 30d</p>
                  <p className="text-xs text-slate-500">
                    VADER score{" "}
                    {forecast.sentiment_score !== undefined
                      ? `${forecast.sentiment_score >= 0 ? "+" : ""}${forecast.sentiment_score.toFixed(3)}`
                      : "n/a"}{" "}
                    · ±5% max adjustment
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`text-sm font-bold ${
                    forecast.sentiment_adjusted_30d.yhat >= horizonPoint.yhat
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {fmt(forecast.sentiment_adjusted_30d.yhat)}
                </p>
                {currentPrice && currentPrice > 0 && (
                  <p
                    className={`text-xs font-medium ${
                      forecast.sentiment_adjusted_30d.yhat >= currentPrice
                        ? "text-green-400/70"
                        : "text-red-400/70"
                    }`}
                  >
                    {fmtPct(
                      ((forecast.sentiment_adjusted_30d.yhat - currentPrice) / currentPrice) * 100
                    )}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <defs>
              {/* Forecast fill gradient — trend-colored */}
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={trendColor} stopOpacity={0.30} />
                <stop offset="95%" stopColor={trendColor} stopOpacity={0.02} />
              </linearGradient>
              {/* Confidence band fill — trend-colored, more visible than before */}
              <linearGradient id={bandId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={trendColor} stopOpacity={0.18} />
                <stop offset="95%" stopColor={trendColor} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickLine={false}
              tickFormatter={tickFormatter}
              interval={Math.floor(chartData.length / 5)}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[minPrice, maxPrice]}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
              width={55}
            />
            <Tooltip
              contentStyle={{
                background: "#1e293b",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#f1f5f9",
                fontSize: "12px",
              }}
              formatter={(value: number, name: string) => [
                fmt(value),
                name === "actual"
                  ? "Actual"
                  : name === "forecast"
                  ? "Forecast"
                  : name === "upper"
                  ? "Upper bound (80% CI)"
                  : "Lower bound (80% CI)",
              ]}
            />
            {/* Today marker */}
            {lastHistDate && (
              <ReferenceLine
                x={lastHistDate}
                stroke="rgba(255,255,255,0.25)"
                strokeDasharray="4 4"
                label={{ value: "Today", fill: "#94a3b8", fontSize: 10 }}
              />
            )}
            {/* 12-month target price line */}
            {target1y && target1y.yhat > 0 && (
              <ReferenceLine
                y={target1y.yhat}
                stroke="#6366f1"
                strokeOpacity={0.6}
                strokeDasharray="3 3"
                label={{
                  value: `12m ${fmt(target1y.yhat)}`,
                  fill: "#6366f1",
                  fontSize: 9,
                  position: "insideBottomRight",
                }}
              />
            )}
            {/* Confidence band — upper fill (trend color) */}
            <Area
              type="monotone"
              dataKey="upper"
              stroke={trendColor}
              strokeWidth={0.5}
              strokeOpacity={0.4}
              fill={`url(#${bandId})`}
              isAnimationActive={false}
            />
            {/* Confidence band — lower (clear the fill below lower bound) */}
            <Area
              type="monotone"
              dataKey="lower"
              stroke={trendColor}
              strokeWidth={0.5}
              strokeOpacity={0.4}
              fill="transparent"
              isAnimationActive={false}
            />
            {/* Historical actuals — slate gray */}
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#94a3b8"
              strokeWidth={2}
              fill="transparent"
              dot={false}
              isAnimationActive={false}
            />
            {/* Forecast line — trend-colored, dashed */}
            <Area
              type="monotone"
              dataKey="forecast"
              stroke={trendColor}
              strokeWidth={2.5}
              fill={`url(#${gradId})`}
              strokeDasharray="5 3"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-40 items-center justify-center text-sm text-slate-500">
          No forecast data available for {forecast.ticker}
        </div>
      )}

      {/* Confidence range note */}
      {horizonPoint && (
        <p className="mt-2 text-center text-xs text-slate-500">
          80% confidence interval:{" "}
          <span style={{ color: trendColor + "b0" }}>{fmt(horizonPoint.yhat_lower)}</span>
          {" – "}
          <span style={{ color: trendColor + "b0" }}>{fmt(horizonPoint.yhat_upper)}</span>
        </p>
      )}
    </div>
  );
}

function SentimentDot({ score }: { score: number }) {
  const color =
    score > 0.05 ? "bg-green-400" : score < -0.05 ? "bg-red-400" : "bg-yellow-400";
  const title =
    score > 0.05
      ? "Positive sentiment"
      : score < -0.05
      ? "Negative sentiment"
      : "Neutral sentiment";
  return (
    <span className={`flex-shrink-0 h-2.5 w-2.5 rounded-full ${color}`} title={title} />
  );
}
