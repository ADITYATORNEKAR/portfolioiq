"""
Backtest Service — equal-weight portfolio simulation via pandas/numpy.

Uses vectorized pandas operations (vectorbt-compatible logic) with realistic:
  - Monthly rebalancing
  - 0.1% round-trip transaction cost
  - SPY (or custom) benchmark comparison

Metrics: Sharpe, Sortino, Calmar, Max Drawdown, Win Rate, Alpha, Beta
"""

import logging
from typing import Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

TRADING_DAYS = 252
RISK_FREE_RATE = 0.05  # ~current US risk-free rate (5%)


def run_backtest(
    prices_df: pd.DataFrame,
    tickers: list[str],
    benchmark: str = "SPY",
    transaction_cost_pct: float = 0.001,
) -> dict:
    """
    Run an equal-weight portfolio backtest.

    Args:
        prices_df: DataFrame with columns for each ticker + benchmark (adjusted close)
        tickers: portfolio tickers (excluding benchmark)
        benchmark: benchmark ticker column name
        transaction_cost_pct: one-way transaction cost (0.001 = 0.1%)

    Returns:
        {
            "timeseries": [{date, portfolio, benchmark}],
            "metrics": BacktestMetrics dict,
        }
    """
    # Validate available tickers
    available = [t for t in tickers if t in prices_df.columns]
    if not available:
        raise ValueError(f"None of {tickers} found in price data (columns: {list(prices_df.columns)})")

    if benchmark not in prices_df.columns:
        logger.warning(f"Benchmark {benchmark} not in price data; computing without benchmark")
        benchmark_prices = None
    else:
        benchmark_prices = prices_df[benchmark]

    port_prices = prices_df[available].dropna()

    # Align benchmark
    if benchmark_prices is not None:
        benchmark_prices = benchmark_prices.reindex(port_prices.index).ffill()

    # --- Monthly rebalancing with transaction costs ---
    port_returns = _simulate_equal_weight(port_prices, transaction_cost_pct)
    bmark_returns = benchmark_prices.pct_change().dropna() if benchmark_prices is not None else None

    # Align dates
    if bmark_returns is not None:
        common_idx = port_returns.index.intersection(bmark_returns.index)
        port_returns = port_returns.loc[common_idx]
        bmark_returns = bmark_returns.loc[common_idx]

    # Cumulative wealth (starts at 1.0)
    port_wealth = (1 + port_returns).cumprod()
    bmark_wealth = (1 + bmark_returns).cumprod() if bmark_returns is not None else pd.Series(1.0, index=port_returns.index)

    # Build timeseries for frontend (normalise to 100)
    timeseries = []
    for date in port_wealth.index:
        timeseries.append({
            "date": date.strftime("%Y-%m-%d"),
            "portfolio": round(float(port_wealth[date]) * 100, 2),
            "benchmark": round(float(bmark_wealth[date]) * 100, 2),
        })

    metrics = _compute_metrics(port_returns, bmark_returns)

    return {
        "timeseries": timeseries,
        "metrics": metrics,
        "rebalance_frequency": "monthly",
        "transaction_cost_pct": transaction_cost_pct * 100,
    }


def _simulate_equal_weight(
    prices: pd.DataFrame,
    cost: float,
) -> pd.Series:
    """
    Equal-weight portfolio with monthly rebalancing and transaction costs.
    Returns daily return series.
    """
    daily_returns = prices.pct_change().dropna()
    n = len(prices.columns)
    weight = 1.0 / n

    # Mark monthly rebalance dates
    rebalance_dates = set(
        daily_returns.resample("ME").last().index
    )

    port_returns = []
    prev_weights = np.full(n, weight)

    for date, row in daily_returns.iterrows():
        r = row.values

        # Portfolio return before rebalancing
        port_ret = float(np.dot(prev_weights, r))

        # Apply transaction cost on rebalance days (turnover ≈ 0 for equal-weight)
        # In practice, turnover is small each month; we apply a flat cost
        if date in rebalance_dates:
            port_ret -= cost  # monthly rebalance cost

        port_returns.append(port_ret)

        # Update weights (drift then rebalance)
        new_weights = prev_weights * (1 + r)
        total = new_weights.sum()
        if total > 0:
            new_weights /= total
        if date in rebalance_dates:
            new_weights = np.full(n, weight)
        prev_weights = new_weights

    return pd.Series(port_returns, index=daily_returns.index)


def _compute_metrics(
    port_returns: pd.Series,
    bmark_returns: Optional[pd.Series],
) -> dict:
    """Compute all risk/return metrics."""
    rf_daily = RISK_FREE_RATE / TRADING_DAYS
    excess = port_returns - rf_daily

    annual_return = float((1 + port_returns).prod() ** (TRADING_DAYS / len(port_returns)) - 1)
    total_return = float((1 + port_returns).prod() - 1)
    vol = float(port_returns.std() * np.sqrt(TRADING_DAYS))

    # Sharpe
    sharpe = float(excess.mean() / port_returns.std() * np.sqrt(TRADING_DAYS)) if port_returns.std() > 0 else 0.0

    # Sortino (downside deviation)
    downside = port_returns[port_returns < rf_daily]
    downside_std = float(downside.std() * np.sqrt(TRADING_DAYS)) if len(downside) > 0 else vol
    sortino = float(excess.mean() / (downside.std() if len(downside) > 0 and downside.std() > 0 else 1e-8) * np.sqrt(TRADING_DAYS))

    # Max Drawdown
    wealth = (1 + port_returns).cumprod()
    rolling_max = wealth.cummax()
    drawdown = (wealth - rolling_max) / rolling_max
    max_dd = float(drawdown.min())

    # Calmar
    calmar = annual_return / abs(max_dd) if max_dd != 0 else 0.0

    # Win rate
    win_rate = float((port_returns > 0).mean())

    # Alpha / Beta vs benchmark
    alpha, beta = 0.0, 1.0
    bmark_total = 0.0
    if bmark_returns is not None and len(bmark_returns) > 10:
        bmark_total = float((1 + bmark_returns).prod() - 1)
        cov_matrix = np.cov(port_returns.values, bmark_returns.values)
        beta = float(cov_matrix[0, 1] / cov_matrix[1, 1]) if cov_matrix[1, 1] > 0 else 1.0
        bmark_annual = float((1 + bmark_returns).prod() ** (TRADING_DAYS / len(bmark_returns)) - 1)
        alpha = annual_return - (RISK_FREE_RATE + beta * (bmark_annual - RISK_FREE_RATE))

    return {
        "annual_return": round(annual_return * 100, 2),
        "sharpe_ratio": round(sharpe, 3),
        "max_drawdown": round(max_dd * 100, 2),
        "sortino_ratio": round(sortino, 3),
        "calmar_ratio": round(calmar, 3),
        "win_rate": round(win_rate * 100, 2),
        "total_return": round(total_return * 100, 2),
        "benchmark_total_return": round(bmark_total * 100, 2),
        "alpha": round(alpha * 100, 2),
        "beta": round(beta, 3),
    }
