import pandas as pd
import ta


def add_features(df: pd.DataFrame) -> pd.DataFrame:
    """Append RSI, MACD, and Bollinger Band features; drop rows with NaN."""
    out = df.copy()
    close = out["close"]
    high = out["high"]
    low = out["low"]

    # RSI (14)
    out["rsi"] = ta.momentum.RSIIndicator(close, window=14).rsi()

    # MACD line, signal, and histogram
    macd_obj = ta.trend.MACD(close, window_slow=26, window_fast=12, window_sign=9)
    out["macd"] = macd_obj.macd()
    out["macd_signal"] = macd_obj.macd_signal()
    out["macd_diff"] = macd_obj.macd_diff()

    # Bollinger Bands (20, 2σ)
    bb = ta.volatility.BollingerBands(close, window=20, window_dev=2)
    out["bb_upper"] = bb.bollinger_hband()
    out["bb_mid"] = bb.bollinger_mavg()
    out["bb_lower"] = bb.bollinger_lband()
    out["bb_width"] = (out["bb_upper"] - out["bb_lower"]) / out["bb_mid"]
    out["bb_pct"] = bb.bollinger_pband()  # position within bands (0–1)

    # ATR (14) — useful for position sizing in backtester
    out["atr"] = ta.volatility.AverageTrueRange(high, low, close, window=14).average_true_range()

    # Daily return and log-return
    out["ret"] = close.pct_change()
    out["log_ret"] = close.apply(lambda x: 0.0).where(close == 0, other=(close / close.shift(1)).apply(
        lambda x: 0.0 if x <= 0 else __import__("math").log(x)
    ))

    out.dropna(inplace=True)
    return out


FEATURE_COLS = [
    "open", "high", "low", "close", "volume",
    "rsi",
    "macd", "macd_signal", "macd_diff",
    "bb_upper", "bb_mid", "bb_lower", "bb_width", "bb_pct",
    "atr",
    "ret",
]
