from datetime import datetime, timedelta, timezone

import pandas as pd
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest
from alpaca.data.timeframe import TimeFrame, TimeFrameUnit

from config import ALPACA_API_KEY, ALPACA_SECRET_KEY, SYMBOL, TIMEFRAME


def _resolve_timeframe(tf: str) -> TimeFrame:
    mapping = {
        "1Min": TimeFrame(1, TimeFrameUnit.Minute),
        "5Min": TimeFrame(5, TimeFrameUnit.Minute),
        "15Min": TimeFrame(15, TimeFrameUnit.Minute),
        "1Hour": TimeFrame(1, TimeFrameUnit.Hour),
        "1Day": TimeFrame.Day,
        "1Week": TimeFrame.Week,
        "1Month": TimeFrame.Month,
    }
    if tf not in mapping:
        raise ValueError(f"Unsupported timeframe '{tf}'. Choose from: {list(mapping)}")
    return mapping[tf]


def fetch_bars(
    symbol: str = SYMBOL,
    timeframe: str = TIMEFRAME,
    start: datetime | None = None,
    end: datetime | None = None,
    lookback_days: int = 730,
) -> pd.DataFrame:
    """Return a DataFrame with columns [open, high, low, close, volume]."""
    client = StockHistoricalDataClient(ALPACA_API_KEY, ALPACA_SECRET_KEY)

    now = datetime.now(timezone.utc)
    if end is None:
        end = now - timedelta(minutes=15)  # avoid incomplete last bar
    if start is None:
        start = end - timedelta(days=lookback_days)

    request = StockBarsRequest(
        symbol_or_symbols=symbol,
        timeframe=_resolve_timeframe(timeframe),
        start=start,
        end=end,
        adjustment="all",
    )

    bars = client.get_stock_bars(request)
    df = bars.df

    if isinstance(df.index, pd.MultiIndex):
        df = df.xs(symbol, level="symbol")

    df.index = pd.to_datetime(df.index, utc=True)
    df = df[["open", "high", "low", "close", "volume"]].sort_index()
    df.dropna(inplace=True)

    print(f"[fetcher] {symbol} | {len(df)} bars | {df.index[0].date()} → {df.index[-1].date()}")
    return df
