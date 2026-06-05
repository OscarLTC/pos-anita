"""
NVDA LSTM Price Predictor
Usage:
  python main.py --train            fetch data, train the model, run backtest
  python main.py --backtest         load saved model and re-run backtest
  python main.py --trade            start the paper-trading loop
  python main.py --predict          print next-bar prediction
"""
import argparse
import sys

import numpy as np

import config  # validates .env on import
from data.fetcher import fetch_bars
from features.engineering import FEATURE_COLS, add_features


def _build_prediction_array(
    df,
    model,
    scaler,
) -> np.ndarray:
    """Run sliding-window inference over the entire feature DataFrame."""
    from model.trainer import inverse_scale_close

    raw = df[FEATURE_COLS].values.astype("float32")
    scaled = scaler.transform(raw)

    seq_len = config.SEQUENCE_LEN
    X = np.array([scaled[i - seq_len : i] for i in range(seq_len, len(scaled))])
    preds_scaled = model.predict(X, verbose=0).flatten()
    preds_price = inverse_scale_close(preds_scaled, scaler)

    # align with df rows (first seq_len rows have no prediction)
    pad = np.full(seq_len, np.nan)
    return np.concatenate([pad, preds_price])


def cmd_train(args):
    from model.trainer import train

    print("[main] Fetching historical bars …")
    df_raw = fetch_bars()
    df = add_features(df_raw)
    print(f"[main] Feature matrix: {df.shape}")

    model, scaler, _, _ = train(df)

    print("[main] Running backtest on full dataset …")
    preds = _build_prediction_array(df, model, scaler)
    _run_backtest(df, preds)


def cmd_backtest(args):
    from model.trainer import inverse_scale_close, load, prepare_data
    from sklearn.preprocessing import MinMaxScaler

    print("[main] Loading saved model …")
    model = load()

    df_raw = fetch_bars()
    df = add_features(df_raw)

    _, _, _, _, scaler, _, _ = prepare_data(df)
    preds = _build_prediction_array(df, model, scaler)
    _run_backtest(df, preds)


def _run_backtest(df, preds):
    from backtest.engine import run_backtest
    import matplotlib.pyplot as plt

    valid = ~np.isnan(preds)
    result = run_backtest(df[valid], preds[valid])
    summary = result.summary()

    print("\n── Backtest Results ─────────────────────────────")
    for k, v in summary.items():
        print(f"  {k:<25} {v}")
    print("─────────────────────────────────────────────────\n")

    fig, axes = plt.subplots(2, 1, figsize=(12, 8), sharex=True)
    df["close"].plot(ax=axes[0], label="NVDA Close", color="steelblue")
    axes[0].set_title("NVDA — Close Price vs Prediction")
    valid_idx = df.index[~np.isnan(preds)]
    axes[0].plot(valid_idx, preds[~np.isnan(preds)], label="Predicted", color="orange", alpha=0.7)
    axes[0].legend()

    result.equity_curve.plot(ax=axes[1], label="Portfolio Value", color="green")
    axes[1].axhline(result.initial_capital, linestyle="--", color="gray", alpha=0.5)
    axes[1].set_title("Equity Curve")
    axes[1].legend()

    plt.tight_layout()
    out = "backtest_result.png"
    plt.savefig(out, dpi=150)
    print(f"[main] Chart saved → {out}")


def cmd_trade(args):
    from model.trainer import inverse_scale_close, load, prepare_data
    from trading.paper_trader import PaperTrader

    model = load()
    df_raw = fetch_bars()
    df = add_features(df_raw)
    _, _, _, _, scaler, _, _ = prepare_data(df)

    trader = PaperTrader(model, scaler, qty=1, threshold=0.005)
    print("[main] Account:", trader.account_summary())
    trader.run_loop(interval_seconds=60)


def cmd_predict(args):
    from model.trainer import inverse_scale_close, load, prepare_data

    model = load()
    df_raw = fetch_bars()
    df = add_features(df_raw)
    _, _, _, _, scaler, _, _ = prepare_data(df)

    preds = _build_prediction_array(df, model, scaler)
    last_pred = preds[~np.isnan(preds)][-1]
    current = df["close"].iloc[-1]
    change_pct = (last_pred - current) / current * 100

    print(f"\n  NVDA current close : ${current:.4f}")
    print(f"  Predicted next bar : ${last_pred:.4f}  ({change_pct:+.2f}%)")
    print(f"  Signal             : {'BUY' if change_pct > 0.5 else 'HOLD/SELL'}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="NVDA LSTM Price Predictor")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--train", action="store_true", help="Train the model")
    group.add_argument("--backtest", action="store_true", help="Run backtest with saved model")
    group.add_argument("--trade", action="store_true", help="Start paper trading loop")
    group.add_argument("--predict", action="store_true", help="Print next-bar prediction")

    args = parser.parse_args()

    if args.train:
        cmd_train(args)
    elif args.backtest:
        cmd_backtest(args)
    elif args.trade:
        cmd_trade(args)
    elif args.predict:
        cmd_predict(args)
    else:
        parser.print_help()
        sys.exit(1)
