"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { X, Search, DollarSign } from "lucide-react";
import { searchTickers } from "@/lib/api";
import type { PositionInput, TickerSearchResult } from "@/lib/types";

interface Props {
  onAnalyze: (
    tickers: string[],
    period: "1y" | "2y" | "5y",
    benchmark: string,
    finnhubKey?: string,
    groqKey?: string,
    positions?: PositionInput[]
  ) => void;
  isLoading: boolean;
  defaultTickers?: string;
}

const PERIODS: { value: "1y" | "2y" | "5y"; label: string }[] = [
  { value: "1y", label: "1 Year" },
  { value: "2y", label: "2 Years" },
  { value: "5y", label: "5 Years" },
];

interface StockRow {
  ticker: string;
  companyName: string;
  quantity: string;
  purchase_price: string;
}

export default function PortfolioForm({ onAnalyze, isLoading, defaultTickers }: Props) {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [input, setInput] = useState("");
  const [period, setPeriod] = useState<"1y" | "2y" | "5y">("2y");
  const [benchmark, setBenchmark] = useState("SPY");

  const [searchResults, setSearchResults] = useState<TickerSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Pre-fill from URL param
  useEffect(() => {
    if (defaultTickers) {
      const parsed = defaultTickers
        .split(",")
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean);
      setRows(parsed.map((ticker) => ({ ticker, companyName: "", quantity: "", purchase_price: "" })));
    }
  }, [defaultTickers]);

  const addedTickers = rows.map((r) => r.ticker);

  const addStock = (ticker: string, companyName = "") => {
    const normalized = ticker.trim().toUpperCase();
    if (!normalized || addedTickers.includes(normalized) || rows.length >= 20) return;
    setRows((prev) => [...prev, { ticker: normalized, companyName, quantity: "", purchase_price: "" }]);
    setInput("");
    setSearchResults([]);
  };

  const removeStock = (ticker: string) => {
    setRows((prev) => prev.filter((r) => r.ticker !== ticker));
  };

  const updateRow = (ticker: string, field: "quantity" | "purchase_price", value: string) => {
    setRows((prev) => prev.map((r) => (r.ticker === ticker ? { ...r, [field]: value } : r)));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      if (input.trim() && searchResults.length === 0) addStock(input);
    }
    if (e.key === "Backspace" && !input && rows.length > 0) {
      removeStock(addedTickers[addedTickers.length - 1]);
    }
    if (e.key === "Escape") {
      setSearchResults([]);
    }
  };

  // Debounced search — always search for any input >= 2 chars
  const handleInputChange = (val: string) => {
    setInput(val);
    setSearchResults([]);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (val.trim().length < 2) return;

    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchTickers(val.trim());
        setSearchResults(results.slice(0, 8));
      } catch {
        // silently ignore search errors
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && searchResults.length === 0) addStock(input);
    if (rows.length === 0) return;

    const tickers = rows.map((r) => r.ticker);

    const positionsPayload: PositionInput[] = rows
      .filter((r) => {
        const qty = parseFloat(r.quantity);
        const price = parseFloat(r.purchase_price);
        return qty > 0 && price > 0;
      })
      .map((r) => ({
        ticker: r.ticker,
        quantity: parseFloat(r.quantity),
        purchase_price: parseFloat(r.purchase_price),
      }));

    onAnalyze(
      tickers,
      period,
      benchmark,
      undefined,
      undefined,
      positionsPayload.length > 0 ? positionsPayload : undefined
    );
  };

  const anyPositionsFilled = rows.some((r) => r.quantity || r.purchase_price);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-surface-border bg-surface-card p-6 space-y-5"
    >
      {/* Search input */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Search Stocks
          <span className="ml-2 text-xs text-slate-500">(ticker symbol or company name)</span>
        </label>
        <div className="relative">
          <div className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface px-3 py-2.5 focus-within:border-brand-500 transition-colors">
            {searchLoading ? (
              <Search className="h-4 w-4 text-slate-500 animate-pulse shrink-0" />
            ) : (
              <Search className="h-4 w-4 text-slate-600 shrink-0" />
            )}
            <input
              id="ticker-input"
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                setTimeout(() => setSearchResults([]), 200);
                if (input.trim() && searchResults.length === 0) addStock(input);
              }}
              placeholder={rows.length === 0 ? "AAPL, Apple Inc, Tesla…" : "Add more stocks…"}
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
              disabled={isLoading || rows.length >= 20}
              autoComplete="off"
            />
            {rows.length > 0 && (
              <span className="shrink-0 text-xs text-slate-600 font-mono">{rows.length}/20</span>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-surface-border bg-[#1e293b] shadow-xl">
              {searchResults.map((result) => {
                const alreadyAdded = addedTickers.includes(result.symbol);
                return (
                  <button
                    key={result.symbol}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (!alreadyAdded) addStock(result.symbol, result.description);
                    }}
                    disabled={alreadyAdded}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-700/50 transition-colors first:rounded-t-lg last:rounded-b-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-white shrink-0">{result.symbol}</span>
                      <span className="text-slate-400 truncate">{result.description}</span>
                    </div>
                    <div className="ml-2 shrink-0 flex items-center gap-2">
                      {alreadyAdded && <span className="text-xs text-brand-500">Added</span>}
                      <span className="text-xs text-slate-600">{result.type}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {rows.length === 0 && (
          <p className="mt-1 text-xs text-slate-600">Add 2–20 stocks for causal analysis</p>
        )}
      </div>

      {/* Holdings rows */}
      {rows.length > 0 && (
        <div className="space-y-2">
          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_90px_110px_28px] gap-3 px-1 text-xs text-slate-500">
            <span>Stock</span>
            <span className="text-right">Shares</span>
            <span className="text-right">Avg Buy Price ($)</span>
            <span />
          </div>

          {rows.map((row) => (
            <div
              key={row.ticker}
              className="grid grid-cols-[minmax(0,1fr)_90px_110px_28px] gap-3 items-center rounded-lg border border-surface-border bg-surface px-3 py-2"
            >
              {/* Ticker + company name */}
              <div className="min-w-0">
                <span className="font-mono text-sm font-bold text-white">{row.ticker}</span>
                {row.companyName && (
                  <span className="ml-2 text-xs text-slate-500 truncate hidden sm:inline">
                    {row.companyName}
                  </span>
                )}
              </div>

              {/* Shares */}
              <input
                type="number"
                min="0.001"
                step="any"
                placeholder="Shares"
                value={row.quantity}
                onChange={(e) => updateRow(row.ticker, "quantity", e.target.value)}
                className="w-full rounded-md border border-surface-border bg-surface-card px-2.5 py-1.5 text-sm text-white placeholder-slate-600 focus:border-brand-500 outline-none transition-colors text-right"
                disabled={isLoading}
              />

              {/* Avg buy price */}
              <input
                type="number"
                min="0.01"
                step="any"
                placeholder="Price"
                value={row.purchase_price}
                onChange={(e) => updateRow(row.ticker, "purchase_price", e.target.value)}
                className="w-full rounded-md border border-surface-border bg-surface-card px-2.5 py-1.5 text-sm text-white placeholder-slate-600 focus:border-brand-500 outline-none transition-colors text-right"
                disabled={isLoading}
              />

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeStock(row.ticker)}
                disabled={isLoading}
                className="text-slate-600 hover:text-red-400 transition-colors flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          <p className="text-xs text-slate-600 px-1 flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {anyPositionsFilled
              ? "Stocks with shares + price will include P&L analysis."
              : "Optionally enter shares and average buy price to enable P&L analysis."}
          </p>
        </div>
      )}

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

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || rows.length < 1}
        className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading
          ? "Analyzing…"
          : `Analyze Portfolio (${rows.length} stock${rows.length !== 1 ? "s" : ""})`}
      </button>
    </form>
  );
}
