"""
Portfolio API Routes

POST /api/v1/portfolio/analyze         → run full analysis, store in SQLite
GET  /api/v1/portfolio/{id}/causal-graph
GET  /api/v1/portfolio/{id}/backtest
GET  /api/v1/portfolio/{id}/sentiment
GET  /api/v1/portfolio/{id}/insights
"""

import hashlib
import json
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.models.schemas import (
    AgentInsights,
    BacktestResult,
    CausalGraph,
    PortfolioRequest,
    PortfolioResponse,
    SentimentResult,
)
from app.services.agent_service import generate_insights
from app.services.backtest_service import run_backtest
from app.services.causal_service import run_full_causal_pipeline
from app.services.data_service import fetch_portfolio_data
from app.services.sentiment_service import fetch_portfolio_sentiment

router = APIRouter()
DB_PATH = Path("/tmp/hft_causal.db")


def _get_db():
    return sqlite3.connect(DB_PATH)


def _portfolio_id(tickers: list[str], period: str, benchmark: str) -> str:
    key = f"{'_'.join(sorted(tickers))}_{period}_{benchmark}"
    return hashlib.md5(key.encode()).hexdigest()[:12]


# ── Full Analysis ─────────────────────────────────────────────────────────────

@router.post("/analyze", response_model=PortfolioResponse)
async def analyze_portfolio(req: PortfolioRequest):
    """
    Kick off a full portfolio analysis:
      1. Fetch historical data (yfinance — free)
      2. Causal discovery (PC algorithm)
      3. Backtest (equal-weight vs benchmark)
      4. Sentiment (Finnhub/RSS + VADER)
      5. AI insights (Groq Llama-3.3-70b, if key provided)

    All results are cached in SQLite for fast subsequent reads.
    """
    portfolio_id = _portfolio_id(req.tickers, req.period, req.benchmark)

    # --- Fetch price data ---
    try:
        data = await fetch_portfolio_data(req.tickers, req.period, req.benchmark)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch market data: {e}")

    prices = data["prices"]
    returns = data["returns"]
    info = data["info"]

    # Validate tickers were actually downloaded
    available_tickers = [t for t in req.tickers if t in prices.columns]
    if not available_tickers:
        raise HTTPException(
            status_code=422,
            detail=f"No valid ticker data found. Check symbols: {req.tickers}",
        )

    # --- Causal discovery ---
    try:
        causal_graph = run_full_causal_pipeline(returns[available_tickers].dropna())
    except Exception as e:
        causal_graph = {"nodes": [], "edges": [], "error": str(e)}

    # --- Backtest ---
    try:
        backtest = run_backtest(prices, available_tickers, benchmark=req.benchmark)
    except Exception as e:
        backtest = {"timeseries": [], "metrics": {}, "error": str(e)}

    # --- Sentiment ---
    try:
        sentiment = await fetch_portfolio_sentiment(
            available_tickers, finnhub_api_key=req.finnhub_api_key
        )
    except Exception as e:
        sentiment = {"ticker_sentiment": {}, "error": str(e)}

    # --- AI Insights ---
    try:
        insights = await generate_insights(
            causal_graph=causal_graph,
            backtest_metrics=backtest.get("metrics", {}),
            sentiment=sentiment,
            groq_api_key=req.groq_api_key,
        )
    except Exception as e:
        insights = {"key_findings": [], "agent_narrative": str(e), "error": str(e)}

    # --- Cache in SQLite ---
    now = time.time()
    conn = _get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT OR REPLACE INTO portfolios VALUES (?,?,?,?,?)",
            (portfolio_id, json.dumps(available_tickers), req.period, req.benchmark, now),
        )
        cur.execute(
            "INSERT OR REPLACE INTO causal_graphs VALUES (?,?,?,?)",
            (
                portfolio_id,
                json.dumps(causal_graph.get("nodes", [])),
                json.dumps(causal_graph.get("edges", [])),
                now,
            ),
        )
        cur.execute(
            "INSERT OR REPLACE INTO backtest_results VALUES (?,?,?,?)",
            (
                portfolio_id,
                json.dumps(backtest.get("timeseries", [])),
                json.dumps(backtest.get("metrics", {})),
                now,
            ),
        )
        cur.execute(
            "INSERT OR REPLACE INTO agent_insights VALUES (?,?,?)",
            (portfolio_id, json.dumps(insights), now),
        )
        conn.commit()
    finally:
        conn.close()

    # --- Summary ---
    port_metrics = backtest.get("metrics", {})
    ticker_returns = {}
    for ticker in available_tickers:
        if ticker in prices.columns:
            series = prices[ticker].dropna()
            if len(series) >= 2:
                ticker_returns[ticker] = float((series.iloc[-1] / series.iloc[0]) - 1) * 100

    top_ticker = max(ticker_returns, key=ticker_returns.get) if ticker_returns else available_tickers[0]

    date_range = ""
    if len(prices) > 0:
        first = prices.index[0].strftime("%Y-%m-%d")
        last = prices.index[-1].strftime("%Y-%m-%d")
        date_range = f"{first} to {last}"

    return PortfolioResponse(
        portfolio_id=portfolio_id,
        tickers=available_tickers,
        period=req.period,
        benchmark=req.benchmark,
        status="complete",
        summary={
            "ticker_count": len(available_tickers),
            "date_range": date_range,
            "trading_days": len(prices),
            "top_performer": top_ticker,
            "top_performer_return": round(ticker_returns.get(top_ticker, 0), 2),
            "portfolio_total_return": port_metrics.get("total_return", 0),
            "benchmark_total_return": port_metrics.get("benchmark_total_return", 0),
        },
    )


# ── Cached Result Endpoints ───────────────────────────────────────────────────

@router.get("/{portfolio_id}/causal-graph", response_model=CausalGraph)
def get_causal_graph(portfolio_id: str):
    conn = _get_db()
    try:
        cur = conn.cursor()
        row = cur.execute(
            "SELECT nodes_json, edges_json FROM causal_graphs WHERE portfolio_id = ?",
            (portfolio_id,),
        ).fetchone()
    finally:
        conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Portfolio not found. Run /analyze first.")

    nodes = json.loads(row[0])
    edges = json.loads(row[1])

    message = (
        "No causal links detected — assets move independently (good diversification)."
        if not edges
        else f"Found {len(edges)} directed causal relationships."
    )

    return CausalGraph(
        portfolio_id=portfolio_id,
        nodes=nodes,
        edges=edges,
        message=message,
    )


@router.get("/{portfolio_id}/backtest", response_model=BacktestResult)
def get_backtest(portfolio_id: str):
    conn = _get_db()
    try:
        cur = conn.cursor()
        row = cur.execute(
            "SELECT timeseries_json, metrics_json FROM backtest_results WHERE portfolio_id = ?",
            (portfolio_id,),
        ).fetchone()
    finally:
        conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Portfolio not found. Run /analyze first.")

    return BacktestResult(
        portfolio_id=portfolio_id,
        timeseries=json.loads(row[0]),
        metrics=json.loads(row[1]),
    )


@router.get("/{portfolio_id}/sentiment", response_model=SentimentResult)
async def get_sentiment(
    portfolio_id: str,
    finnhub_api_key: Optional[str] = None,
):
    """Re-fetch live sentiment (not cached — news changes frequently)."""
    conn = _get_db()
    try:
        row = conn.execute(
            "SELECT tickers FROM portfolios WHERE id = ?", (portfolio_id,)
        ).fetchone()
    finally:
        conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Portfolio not found. Run /analyze first.")

    tickers = json.loads(row[0])
    sentiment = await fetch_portfolio_sentiment(tickers, finnhub_api_key=finnhub_api_key)

    return SentimentResult(
        portfolio_id=portfolio_id,
        ticker_sentiment=sentiment["ticker_sentiment"],
    )


@router.get("/{portfolio_id}/insights", response_model=AgentInsights)
def get_insights(portfolio_id: str):
    conn = _get_db()
    try:
        row = conn.execute(
            "SELECT insights_json FROM agent_insights WHERE portfolio_id = ?",
            (portfolio_id,),
        ).fetchone()
    finally:
        conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Portfolio not found. Run /analyze first.")

    data = json.loads(row[0])
    return AgentInsights(portfolio_id=portfolio_id, **data)
