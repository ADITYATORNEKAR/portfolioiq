"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  analyzePortfolio,
  getCausalGraph,
  getBacktest,
  getSentiment,
  getInsights,
} from "@/lib/api";
import type { PortfolioResponse } from "@/lib/types";
import PortfolioForm from "@/components/PortfolioForm";
import CausalGraph from "@/components/CausalGraph";
import BacktestChart from "@/components/BacktestChart";
import AgentInsights from "@/components/AgentInsights";
import LivePrices from "@/components/LivePrices";
import RiskMetrics from "@/components/RiskMetrics";
import { Loader2, BarChart2, GitBranch, Brain, Zap, TrendingUp } from "lucide-react";

type Tab = "causal" | "backtest" | "sentiment" | "insights" | "live";

function SkeletonCard() {
  return (
    <div className="space-y-3 rounded-xl border border-surface-border bg-surface-card p-6">
      <div className="skeleton h-4 w-1/3" />
      <div className="skeleton h-32 w-full" />
      <div className="skeleton h-4 w-2/3" />
    </div>
  );
}

function AnalyzePage() {
  const searchParams = useSearchParams();
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PortfolioResponse | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("causal");
  const [finnhubKey, setFinnhubKey] = useState<string>("");
  const [groqKey, setGroqKey] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill tickers from URL params (e.g., from landing page example links)
  const urlTickers = searchParams.get("tickers") || "";

  const handleAnalyze = async (
    tickers: string[],
    period: "1y" | "2y" | "5y",
    benchmark: string,
    fKey?: string,
    gKey?: string
  ) => {
    setIsAnalyzing(true);
    setError(null);
    setPortfolioId(null);
    setAnalysisResult(null);

    if (fKey) setFinnhubKey(fKey);
    if (gKey) setGroqKey(gKey);

    try {
      const result = await analyzePortfolio({
        tickers,
        period,
        benchmark,
        finnhub_api_key: fKey || undefined,
        groq_api_key: gKey || undefined,
      });
      setAnalysisResult(result);
      setPortfolioId(result.portfolio_id);
      setActiveTab("causal");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "causal", label: "Causal Graph", icon: GitBranch },
    { id: "backtest", label: "Backtest", icon: BarChart2 },
    { id: "insights", label: "AI Insights", icon: Brain },
    { id: "sentiment", label: "Sentiment", icon: TrendingUp },
    { id: "live", label: "Live Prices", icon: Zap },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Portfolio Analyzer</h1>
        <p className="mt-1 text-sm text-slate-400">
          Enter ticker symbols to discover causal relationships, run backtests, and get AI insights.
        </p>
      </div>

      {/* Input form */}
      <PortfolioForm
        onAnalyze={handleAnalyze}
        isLoading={isAnalyzing}
        defaultTickers={urlTickers}
      />

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isAnalyzing && (
        <div className="mt-8 flex flex-col items-center gap-3 py-16 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
          <p className="text-slate-300 font-medium">Running analysis…</p>
          <p className="text-sm text-slate-500">
            Fetching data → Causal discovery → Backtest → AI insights
          </p>
        </div>
      )}

      {/* Summary bar */}
      {analysisResult && !isAnalyzing && (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-surface-border bg-surface-card p-4">
          <Stat label="Tickers" value={analysisResult.tickers.join(", ")} />
          <Stat label="Period" value={`${analysisResult.period} vs ${analysisResult.benchmark}`} />
          <Stat
            label="Portfolio Return"
            value={`${analysisResult.summary.portfolio_total_return > 0 ? "+" : ""}${analysisResult.summary.portfolio_total_return.toFixed(1)}%`}
            positive={analysisResult.summary.portfolio_total_return > 0}
          />
          <Stat
            label="Top Performer"
            value={`${analysisResult.summary.top_performer} +${analysisResult.summary.top_performer_return.toFixed(1)}%`}
          />
        </div>
      )}

      {/* Tabs */}
      {portfolioId && !isAnalyzing && (
        <div className="mt-8">
          <div className="flex overflow-x-auto border-b border-surface-border">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-brand-500 text-brand-500"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <Suspense fallback={<SkeletonCard />}>
              {activeTab === "causal" && <CausalGraphTab portfolioId={portfolioId} />}
              {activeTab === "backtest" && <BacktestTab portfolioId={portfolioId} />}
              {activeTab === "insights" && <InsightsTab portfolioId={portfolioId} />}
              {activeTab === "sentiment" && (
                <SentimentTab portfolioId={portfolioId} finnhubKey={finnhubKey} />
              )}
              {activeTab === "live" && (
                <LiveTab
                  tickers={analysisResult?.tickers || []}
                  finnhubKey={finnhubKey}
                />
              )}
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p
        className={`mt-0.5 text-sm font-semibold truncate ${
          positive === true ? "text-green-400" : positive === false ? "text-red-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function CausalGraphTab({ portfolioId }: { portfolioId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["causal", portfolioId],
    queryFn: () => getCausalGraph(portfolioId),
  });
  if (isLoading) return <SkeletonCard />;
  if (error) return <ErrorCard message={(error as Error).message} />;
  return data ? <CausalGraph data={data} /> : null;
}

function BacktestTab({ portfolioId }: { portfolioId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["backtest", portfolioId],
    queryFn: () => getBacktest(portfolioId),
  });
  if (isLoading) return <SkeletonCard />;
  if (error) return <ErrorCard message={(error as Error).message} />;
  return data ? (
    <>
      <RiskMetrics metrics={data.metrics} />
      <div className="mt-6">
        <BacktestChart data={data} />
      </div>
    </>
  ) : null;
}

function InsightsTab({ portfolioId }: { portfolioId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["insights", portfolioId],
    queryFn: () => getInsights(portfolioId),
  });
  if (isLoading) return <SkeletonCard />;
  if (error) return <ErrorCard message={(error as Error).message} />;
  return data ? <AgentInsights data={data} /> : null;
}

function SentimentTab({
  portfolioId,
  finnhubKey,
}: {
  portfolioId: string;
  finnhubKey: string;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["sentiment", portfolioId],
    queryFn: () => getSentiment(portfolioId, finnhubKey || undefined),
  });
  if (isLoading) return <SkeletonCard />;
  if (error) return <ErrorCard message={(error as Error).message} />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      {Object.entries(data.ticker_sentiment).map(([ticker, sentiment]) => (
        <div
          key={ticker}
          className="rounded-xl border border-surface-border bg-surface-card p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono font-bold text-white">{ticker}</span>
            <SentimentBadge label={sentiment.overall_label} score={sentiment.overall_score} />
          </div>
          <div className="space-y-2">
            {sentiment.articles.slice(0, 4).map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <SentimentDot label={a.sentiment_label} />
                <div>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-white hover:underline"
                  >
                    {a.headline}
                  </a>
                  <span className="ml-2 text-slate-600">{a.source}</span>
                </div>
              </div>
            ))}
            {sentiment.articles.length === 0 && (
              <p className="text-xs text-slate-500">No recent news articles found.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function LiveTab({
  tickers,
  finnhubKey,
}: {
  tickers: string[];
  finnhubKey: string;
}) {
  return <LivePrices tickers={tickers} finnhubKey={finnhubKey} />;
}

function SentimentBadge({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const cls =
    label === "positive"
      ? "badge-green"
      : label === "negative"
      ? "badge-red"
      : "badge-yellow";
  return (
    <span className={cls}>
      {label} ({score > 0 ? "+" : ""}
      {score.toFixed(2)})
    </span>
  );
}

function SentimentDot({ label }: { label: string }) {
  const color =
    label === "positive"
      ? "bg-green-400"
      : label === "negative"
      ? "bg-red-400"
      : "bg-yellow-400";
  return (
    <span
      className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${color}`}
    />
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-400">
      {message}
    </div>
  );
}

export default function AnalyzePageWrapper() {
  return (
    <Suspense fallback={null}>
      <AnalyzePage />
    </Suspense>
  );
}
