"""
Live Prices — WebSocket endpoint streaming real-time quotes.

GET /api/v1/live/prices?tickers=AAPL,MSFT&finnhub_api_key=xxx

Streams JSON every 5 seconds per ticker:
  { ticker, price, change, change_pct, high, low, open, prev_close, timestamp }

Uses Finnhub REST (free 60 calls/min) with yfinance fallback.
"""

import asyncio
import json
import logging
from typing import Optional

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.services.data_service import fetch_live_price

router = APIRouter()
logger = logging.getLogger(__name__)

REFRESH_INTERVAL_SECONDS = 15


@router.websocket("/prices")
async def live_prices_ws(
    websocket: WebSocket,
    tickers: str = Query(..., description="Comma-separated tickers, e.g. AAPL,MSFT"),
    finnhub_api_key: Optional[str] = Query(None),
):
    """
    WebSocket streaming live prices for the given tickers.
    Sends an update every 5 seconds per ticker.
    """
    await websocket.accept()
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]

    if not ticker_list:
        await websocket.send_json({"error": "No valid tickers provided"})
        await websocket.close()
        return

    logger.info(f"WebSocket connected: streaming {ticker_list}")

    try:
        while True:
            updates = []
            tasks = [fetch_live_price(ticker, finnhub_api_key) for ticker in ticker_list]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for ticker, result in zip(ticker_list, results):
                if isinstance(result, Exception):
                    logger.warning(f"Live price failed for {ticker}: {result}")
                    continue
                if result:
                    updates.append(result)

            if updates:
                await websocket.send_json({"prices": updates})

            await asyncio.sleep(REFRESH_INTERVAL_SECONDS)

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for {ticker_list}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json({"error": str(e)})
        except Exception:
            pass
