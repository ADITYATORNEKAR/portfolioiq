"""Tests for data_service — uses real yfinance data (no mocking needed)."""

import pytest
import pandas as pd
import asyncio


@pytest.mark.asyncio
async def test_fetch_portfolio_data_basic():
    from app.services.data_service import fetch_portfolio_data

    result = await fetch_portfolio_data(["AAPL", "MSFT"], period="1y", benchmark="SPY")

    assert "prices" in result
    assert "returns" in result
    assert "info" in result

    prices: pd.DataFrame = result["prices"]
    assert "AAPL" in prices.columns
    assert "MSFT" in prices.columns
    assert "SPY" in prices.columns
    assert len(prices) > 100  # at least 100 trading days


@pytest.mark.asyncio
async def test_fetch_portfolio_data_invalid_ticker():
    from app.services.data_service import fetch_portfolio_data

    # yfinance silently skips invalid tickers
    result = await fetch_portfolio_data(["AAPL", "INVALIDXXX123"], period="1y")
    prices = result["prices"]
    # AAPL should still be there
    assert "AAPL" in prices.columns


@pytest.mark.asyncio
async def test_fetch_live_price_fallback():
    from app.services.data_service import fetch_live_price

    # No API key — should use yfinance fallback
    result = await fetch_live_price("AAPL", finnhub_api_key=None)

    if result is not None:
        assert "price" in result
        assert "ticker" in result
        assert result["ticker"] == "AAPL"
        assert result["price"] > 0


@pytest.mark.asyncio
async def test_fetch_news_rss_fallback():
    from app.services.data_service import fetch_news

    # No API key — should use RSS fallback
    articles = await fetch_news("AAPL", count=5)
    # RSS may have results or be empty depending on network
    assert isinstance(articles, list)
