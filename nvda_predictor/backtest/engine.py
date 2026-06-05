from dataclasses import dataclass, field
from typing import Literal

import numpy as np
import pandas as pd


@dataclass
class Trade:
    entry_date: pd.Timestamp
    entry_price: float
    side: Literal["long", "short"]
    qty: float
    exit_date: pd.Timestamp | None = None
    exit_price: float | None = None

    @property
    def pnl(self) -> float:
        if self.exit_price is None:
            return 0.0
        if self.side == "long":
            return (self.exit_price - self.entry_price) * self.qty
        return (self.entry_price - self.exit_price) * self.qty

    @property
    def pnl_pct(self) -> float:
        if self.exit_price is None:
            return 0.0
        base = self.entry_price * self.qty
        return self.pnl / base if base else 0.0


@dataclass
class BacktestResult:
    trades: list[Trade]
    equity_curve: pd.Series
    initial_capital: float

    @property
    def total_return(self) -> float:
        return (self.equity_curve.iloc[-1] - self.initial_capital) / self.initial_capital

    @property
    def sharpe(self) -> float:
        rets = self.equity_curve.pct_change().dropna()
        if rets.std() == 0:
            return 0.0
        return float(rets.mean() / rets.std() * np.sqrt(252))

    @property
    def max_drawdown(self) -> float:
        curve = self.equity_curve
        rolling_max = curve.cummax()
        drawdown = (curve - rolling_max) / rolling_max
        return float(drawdown.min())

    def summary(self) -> dict:
        winning = [t for t in self.trades if t.pnl > 0]
        return {
            "total_trades": len(self.trades),
            "win_rate": len(winning) / len(self.trades) if self.trades else 0,
            "total_return_pct": round(self.total_return * 100, 2),
            "sharpe": round(self.sharpe, 3),
            "max_drawdown_pct": round(self.max_drawdown * 100, 2),
            "final_equity": round(self.equity_curve.iloc[-1], 2),
        }


def run_backtest(
    df: pd.DataFrame,
    predictions: np.ndarray,
    initial_capital: float = 10_000.0,
    threshold: float = 0.005,
    commission: float = 0.001,
) -> BacktestResult:
    """
    Simple long-only threshold strategy:
      BUY  when predicted_close > actual_close * (1 + threshold)
      SELL (close position) on the next bar after a buy signal disappears
    """
    assert len(predictions) == len(df), "predictions length must match df length"

    capital = initial_capital
    equity = []
    trades: list[Trade] = []
    position: Trade | None = None

    closes = df["close"].values

    for i, (pred, actual) in enumerate(zip(predictions, closes)):
        date = df.index[i]

        # close open position if signal flips
        if position is not None:
            if pred <= actual * (1 + threshold):
                exit_price = actual * (1 - commission)
                position.exit_date = date
                position.exit_price = exit_price
                capital += position.exit_price * position.qty
                trades.append(position)
                position = None

        # open new long position
        if position is None and pred > actual * (1 + threshold):
            entry_price = actual * (1 + commission)
            qty = capital / entry_price
            capital -= entry_price * qty
            position = Trade(
                entry_date=date,
                entry_price=entry_price,
                side="long",
                qty=qty,
            )

        # mark-to-market equity
        mtm = capital + (position.qty * actual if position else 0)
        equity.append(mtm)

    # close final position on last bar
    if position is not None:
        position.exit_date = df.index[-1]
        position.exit_price = closes[-1] * (1 - commission)
        capital += position.exit_price * position.qty
        trades.append(position)
        equity[-1] = capital

    return BacktestResult(
        trades=trades,
        equity_curve=pd.Series(equity, index=df.index),
        initial_capital=initial_capital,
    )
