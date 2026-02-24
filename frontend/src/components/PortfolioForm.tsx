"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { X, Plus, ChevronDown, Key } from "lucide-react";

interface Props {
  onAnalyze: (
    tickers: string[],
    period: "1y" | "2y" | "5y",
    benchmark: string,
    finnhubKey?: string,
    groqKey?: string
  ) => void;
  isLoading: boolean;
  defaultTickers?: string;
}

const PERIODS: { value: "1y" | "2y" | "5y"; label: string }[] = [
  { value: "1y", label: "1 Year" },
  { value: "2y", label: "2 Years" },
  { value: "5y", label: "5 Years" },
];

export default function PortfolioForm({ onAnalyze, isLoading, defaultTickers }: Props) {
  const [tickers, setTickers] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [period, setPeriod] = useState<"1y" | "2y" | "5y">("2y");
  const [benchmark, setBenchmark] = useState("SPY");
  const [finnhubKey, setFinnhubKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [showKeys, setShowKeys] = useState(false);

  // Pre-fill from URL param
  useEffect(() => {
    if (defaultTickers) {
      const parsed = defaultTickers
        .split(",")
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean);
      setTickers(parsed);
    }
  }, [defaultTickers]);

  const addTicker = (raw: string) => {
    const ticker = raw.trim().toUpperCase();
    if (ticker && !tickers.includes(ticker) && tickers.length < 20) {
      setTickers([...tickers, ticker]);
    }
    setInput("");
  };

  const removeTicker = (ticker: string) => {
    setTickers(tickers.filter((t) => t !== ticker));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      if (input.trim()) addTicker(input);
    }
    if (e.key === "Backspace" && !input && tickers.length > 0) {
      removeTicker(tickers[tickers.length - 1]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) addTicker(input);
    if (tickers.length === 0) return;
    onAnalyze(tickers, period, benchmark, finnhubKey || undefined, groqKey || undefined);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-surface-border bg-surface-card p-6 space-y-5"
    >
      {/* Ticker chip input */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Stock Tickers
          <span className="ml-2 text-xs text-slate-500">(press Enter, comma, or space to add)</span>
        </label>
        <div
          className="flex min-h-[48px] flex-wrap gap-2 rounded-lg border border-surface-border bg-surface p-2 focus-within:border-brand-500 transition-colors cursor-text"
          onClick={() => document.getElementById("ticker-input")?.focus()}
        >
          {tickers.map((ticker) => (
            <span
              key={ticker}
              className="flex items-center gap-1.5 rounded-md bg-brand-500/20 px-2.5 py-1 text-sm font-mono font-medium text-brand-500"
            >
              {ticker}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTicker(ticker); }}
                className="text-brand-500/60 hover:text-brand-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            id="ticker-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (input.trim()) addTicker(input); }}
            placeholder={tickers.length === 0 ? "AAPL, MSFT, GOOGL…" : ""}
            className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder-slate-600 outline-none"
            disabled={isLoading}
          />
        </div>
        {tickers.length === 0 && (
          <p className="mt-1 text-xs text-slate-600">Add 2–20 tickers for causal analysis</p>
        )}
      </div>

      {/* Period + Benchmark row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-slate-300">Period</label>
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                  period === p.value
                    ? "border-brand-500 bg-brand-500/10 text-brand-500"
                    : "border-surface-border text-slate-400 hover:text-slate-200"
                }`}
                disabled={isLoading}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:w-32">
          <label className="mb-2 block text-sm font-medium text-slate-300">Benchmark</label>
          <input
            type="text"
            value={benchmark}
            onChange={(e) => setBenchmark(e.target.value.toUpperCase())}
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm font-mono text-white placeholder-slate-600 focus:border-brand-500 outline-none transition-colors"
            placeholder="SPY"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Optional API keys */}
      <div>
        <button
          type="button"
          onClick={() => setShowKeys(!showKeys)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <Key className="h-3 w-3" />
          {showKeys ? "Hide" : "Add"} optional API keys (for live data & AI insights)
          <ChevronDown
            className={`h-3 w-3 transition-transform ${showKeys ? "rotate-180" : ""}`}
          />
        </button>

        {showKeys && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Finnhub API Key{" "}
                <span className="text-slate-600">
                  — free at{" "}
                  <a
                    href="https://finnhub.io/register"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-500 hover:underline"
                  >
                    finnhub.io
                  </a>{" "}
                  (live prices + news)
                </span>
              </label>
              <input
                type="password"
                value={finnhubKey}
                onChange={(e) => setFinnhubKey(e.target.value)}
                className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-brand-500 outline-none transition-colors"
                placeholder="fh_xxxxxxxxxxxxxxxx"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Groq API Key{" "}
                <span className="text-slate-600">
                  — free at{" "}
                  <a
                    href="https://console.groq.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-500 hover:underline"
                  >
                    console.groq.com
                  </a>{" "}
                  (AI insights via Llama-3.3-70b)
                </span>
              </label>
              <input
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-brand-500 outline-none transition-colors"
                placeholder="gsk_xxxxxxxxxxxxxxxx"
                disabled={isLoading}
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || tickers.length < 1}
        className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Analyzing…" : `Analyze Portfolio (${tickers.length} ticker${tickers.length !== 1 ? "s" : ""})`}
      </button>
    </form>
  );
}
