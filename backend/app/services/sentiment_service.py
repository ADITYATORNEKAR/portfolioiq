"""
Sentiment Service — news sentiment scoring using VADER (free, no LLM required).

Sources:
  - Finnhub company news API (free tier with API key)
  - Yahoo Finance RSS (no API key)

VADER (Valence Aware Dictionary for sEntiment Reasoning) is a rule-based
sentiment tool specifically tuned for financial and social media text.
It's completely free and runs locally.
"""

import logging
from typing import Optional

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from app.services.data_service import fetch_news

logger = logging.getLogger(__name__)

_analyzer = SentimentIntensityAnalyzer()


def _score_text(text: str) -> dict:
    """Score a headline/summary using VADER."""
    scores = _analyzer.polarity_scores(text)
    compound = scores["compound"]
    if compound >= 0.05:
        label = "positive"
    elif compound <= -0.05:
        label = "negative"
    else:
        label = "neutral"
    return {"score": round(compound, 4), "label": label}


async def fetch_news_sentiment(
    ticker: str,
    count: int = 10,
    finnhub_api_key: Optional[str] = None,
) -> dict:
    """
    Fetch news articles for ticker and score them with VADER.

    Returns:
        {
            "ticker": str,
            "overall_score": float,
            "overall_label": str,
            "headline_count": int,
            "articles": [{headline, url, source, published_at, sentiment_score, sentiment_label}],
        }
    """
    raw_articles = await fetch_news(ticker, count=count, finnhub_api_key=finnhub_api_key)

    scored = []
    for art in raw_articles:
        text = art.get("raw_text") or art.get("headline", "")
        sentiment = _score_text(text)
        scored.append({
            "headline": art.get("headline", ""),
            "url": art.get("url", ""),
            "source": art.get("source", ""),
            "published_at": art.get("published_at", ""),
            "sentiment_score": sentiment["score"],
            "sentiment_label": sentiment["label"],
        })

    # Overall score: weighted average (more recent articles weighted higher)
    if scored:
        scores = [a["sentiment_score"] for a in scored]
        weights = list(range(len(scores), 0, -1))  # most recent = highest weight
        overall = sum(s * w for s, w in zip(scores, weights)) / sum(weights)
    else:
        overall = 0.0

    overall_label = "positive" if overall >= 0.05 else ("negative" if overall <= -0.05 else "neutral")

    return {
        "ticker": ticker,
        "overall_score": round(overall, 4),
        "overall_label": overall_label,
        "headline_count": len(scored),
        "articles": scored,
    }


async def fetch_portfolio_sentiment(
    tickers: list[str],
    finnhub_api_key: Optional[str] = None,
) -> dict:
    """
    Fetch sentiment for all tickers in a portfolio.

    Returns:
        {"ticker_sentiment": {ticker: TickerSentiment}}
    """
    import asyncio

    tasks = [
        fetch_news_sentiment(ticker, finnhub_api_key=finnhub_api_key)
        for ticker in tickers
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    ticker_sentiment = {}
    for ticker, result in zip(tickers, results):
        if isinstance(result, Exception):
            logger.warning(f"Sentiment fetch failed for {ticker}: {result}")
            ticker_sentiment[ticker] = {
                "ticker": ticker,
                "overall_score": 0.0,
                "overall_label": "neutral",
                "headline_count": 0,
                "articles": [],
            }
        else:
            ticker_sentiment[ticker] = result

    return {"ticker_sentiment": ticker_sentiment}
