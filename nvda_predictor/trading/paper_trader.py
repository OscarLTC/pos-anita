from __future__ import annotations

import time
from datetime import datetime, timezone

import numpy as np
import pandas as pd
from alpaca.trading.client import TradingClient
from alpaca.trading.enums import OrderSide, TimeInForce
from alpaca.trading.requests import MarketOrderRequest

from config import (
    ALPACA_API_KEY,
    ALPACA_BASE_URL,
    ALPACA_SECRET_KEY,
    SEQUENCE_LEN,
    SYMBOL,
)
from data.fetcher import fetch_bars
from features.engineering import FEATURE_COLS, add_features
from model.trainer import inverse_scale_close


class PaperTrader:
    def __init__(
        self,
        model,
        scaler,
        qty: int = 1,
        threshold: float = 0.005,
    ) -> None:
        self.model = model
        self.scaler = scaler
        self.qty = qty
        self.threshold = threshold
        self._client = TradingClient(
            ALPACA_API_KEY,
            ALPACA_SECRET_KEY,
            paper=True,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _latest_prediction(self) -> tuple[float, float]:
        """Fetch the most recent bars, run the model, return (current_close, pred_close)."""
        df = fetch_bars(SYMBOL, lookback_days=120)
        df = add_features(df)
        raw = df[FEATURE_COLS].values.astype("float32")
        scaled = self.scaler.transform(raw)

        seq = scaled[-SEQUENCE_LEN:][np.newaxis, ...]  # (1, seq_len, n_features)
        pred_scaled = float(self.model.predict(seq, verbose=0)[0, 0])
        pred_price = inverse_scale_close(np.array([pred_scaled]), self.scaler)[0]

        current_close = df["close"].iloc[-1]
        return current_close, pred_price

    def _open_position(self) -> bool:
        """Return True if we already hold the symbol."""
        try:
            pos = self._client.get_open_position(SYMBOL)
            return int(pos.qty) != 0
        except Exception:
            return False

    def _submit_order(self, side: OrderSide) -> None:
        req = MarketOrderRequest(
            symbol=SYMBOL,
            qty=self.qty,
            side=side,
            time_in_force=TimeInForce.DAY,
        )
        order = self._client.submit_order(req)
        print(f"[trader] {side.value.upper()} {self.qty} {SYMBOL} | order_id={order.id}")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def step(self) -> dict:
        """Run one decision cycle and return a status dict."""
        current_close, pred_price = self._latest_prediction()
        in_position = self._open_position()
        signal = "BUY" if pred_price > current_close * (1 + self.threshold) else "HOLD/SELL"

        status = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "current_close": round(current_close, 4),
            "predicted_close": round(pred_price, 4),
            "signal": signal,
            "in_position": in_position,
            "action": "none",
        }

        if signal == "BUY" and not in_position:
            self._submit_order(OrderSide.BUY)
            status["action"] = "buy"
        elif signal != "BUY" and in_position:
            self._submit_order(OrderSide.SELL)
            status["action"] = "sell"

        return status

    def run_loop(self, interval_seconds: int = 60) -> None:
        """Continuous paper-trading loop (Ctrl-C to stop)."""
        print(f"[trader] Starting paper trading loop for {SYMBOL} (interval={interval_seconds}s)")
        while True:
            try:
                status = self.step()
                print(status)
            except KeyboardInterrupt:
                print("[trader] Stopped by user.")
                break
            except Exception as exc:
                print(f"[trader] Error: {exc}")
            time.sleep(interval_seconds)

    def account_summary(self) -> dict:
        acct = self._client.get_account()
        return {
            "portfolio_value": acct.portfolio_value,
            "buying_power": acct.buying_power,
            "cash": acct.cash,
        }
