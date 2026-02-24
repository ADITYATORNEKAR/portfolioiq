import Link from "next/link";
import { ArrowRight, GitBranch, BarChart2, Brain, Zap } from "lucide-react";

const EXAMPLE_PORTFOLIOS = [
  { label: "Big Tech", tickers: "AAPL,MSFT,GOOGL,NVDA,META" },
  { label: "Finance", tickers: "JPM,GS,BAC,MS,BLK" },
  { label: "S&P Leaders", tickers: "AMZN,TSLA,BRK-B,UNH,V" },
];

const FEATURES = [
  {
    icon: GitBranch,
    title: "Causal Discovery",
    description:
      "PC algorithm + Double ML uncovers which assets in your portfolio actually cause others to move — not just correlate.",
    tag: "causal-learn + econml",
  },
  {
    icon: BarChart2,
    title: "Portfolio Backtesting",
    description:
      "Equal-weight backtest vs SPY with realistic transaction costs. Sharpe, Sortino, Calmar, Max Drawdown.",
    tag: "10yr history via yfinance",
  },
  {
    icon: Brain,
    title: "AI Agent Insights",
    description:
      "LangGraph multi-agent system (Groq Llama-3.3-70b) interprets causal structure and synthesises risk narrative.",
    tag: "LangGraph + Groq (free)",
  },
  {
    icon: Zap,
    title: "Live Prices",
    description:
      "WebSocket streaming with real-time price updates, change percentage, and sentiment signals.",
    tag: "Finnhub free tier",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="flex flex-col items-center py-24 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-500">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
          100% Free Stack — No Credit Card Ever
        </div>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-6xl">
          Does AAPL{" "}
          <span className="text-brand-500">cause</span>{" "}
          MSFT to move?
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-400">
          Enter your stock portfolio and discover genuine causal relationships —
          not just correlations. Powered by rigorous causal inference, AI agents,
          and backtesting. Zero cost, always.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/analyze"
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-brand-500 transition-colors"
          >
            Analyze My Portfolio
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://github.com/ADITYATORNEKAR/hft-causal-platform"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-surface-border px-8 py-3.5 text-base font-medium text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
          >
            View Source
          </a>
        </div>

        {/* Quick start examples */}
        <div className="mt-10">
          <p className="mb-3 text-sm text-slate-500">Try an example portfolio:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_PORTFOLIOS.map((p) => (
              <Link
                key={p.label}
                href={`/analyze?tickers=${p.tickers}`}
                className="rounded-lg border border-surface-border bg-surface-card px-3 py-1.5 text-sm text-slate-300 hover:border-brand-500/50 hover:text-white transition-colors"
              >
                {p.label}: <span className="font-mono text-xs text-slate-400">{p.tickers}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-16">
        <h2 className="mb-12 text-center text-2xl font-bold text-white">
          What this platform does
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-surface-border bg-surface-card p-6 hover:border-brand-500/40 transition-colors"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10">
                  <f.icon className="h-5 w-5 text-brand-500" />
                </div>
                <h3 className="text-base font-semibold text-white">{f.title}</h3>
              </div>
              <p className="text-sm text-slate-400">{f.description}</p>
              <span className="mt-4 inline-block rounded-md bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-500">
                {f.tag}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Free stack callout */}
      <section className="py-16">
        <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-8">
          <h2 className="mb-6 text-xl font-bold text-white">
            100% Free Infrastructure
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Historical Data", value: "yfinance", note: "No API key" },
              { label: "Causal Engine", value: "causal-learn", note: "Open source" },
              { label: "AI Agents", value: "Groq Llama-3.3", note: "Free tier" },
              { label: "Deployment", value: "Fly.io + Vercel", note: "Always-on free" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wide">{item.label}</p>
                <p className="mt-1 font-semibold text-white">{item.value}</p>
                <p className="text-xs text-green-400">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
