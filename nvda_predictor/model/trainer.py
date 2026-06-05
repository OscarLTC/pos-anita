from pathlib import Path

import numpy as np
import pandas as pd
from keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from keras.models import load_model
from sklearn.preprocessing import MinMaxScaler

from config import BATCH_SIZE, EPOCHS, MODEL_PATH, SEQUENCE_LEN, TRAIN_SPLIT
from features.engineering import FEATURE_COLS
from model.lstm import build_lstm


def _make_sequences(
    data: np.ndarray, seq_len: int
) -> tuple[np.ndarray, np.ndarray]:
    X, y = [], []
    for i in range(seq_len, len(data)):
        X.append(data[i - seq_len : i])
        y.append(data[i, 3])  # close is index 3 in FEATURE_COLS
    return np.array(X), np.array(y)


def prepare_data(
    df: pd.DataFrame,
    seq_len: int = SEQUENCE_LEN,
    train_split: float = TRAIN_SPLIT,
) -> tuple:
    """Scale features, build sequences, split train/val."""
    raw = df[FEATURE_COLS].values.astype("float32")

    split_idx = int(len(raw) * train_split)
    train_raw = raw[:split_idx]
    val_raw = raw[split_idx:]

    scaler = MinMaxScaler()
    train_scaled = scaler.fit_transform(train_raw)
    val_scaled = scaler.transform(val_raw)

    X_train, y_train = _make_sequences(train_scaled, seq_len)
    X_val, y_val = _make_sequences(val_scaled, seq_len)

    # Scale y back to 0-1 range of close column for loss comparability
    close_idx = FEATURE_COLS.index("close")
    close_min = scaler.data_min_[close_idx]
    close_max = scaler.data_max_[close_idx]

    return X_train, y_train, X_val, y_val, scaler, close_min, close_max


def train(df: pd.DataFrame) -> tuple:
    """Train LSTM; return (model, scaler, close_min, close_max)."""
    X_train, y_train, X_val, y_val, scaler, close_min, close_max = prepare_data(df)

    model = build_lstm(
        sequence_len=SEQUENCE_LEN,
        n_features=X_train.shape[2],
    )
    model.summary()

    callbacks = [
        EarlyStopping(monitor="val_loss", patience=10, restore_best_weights=True),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=5, min_lr=1e-6),
        ModelCheckpoint(MODEL_PATH, save_best_only=True, monitor="val_loss"),
    ]

    model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=callbacks,
        verbose=1,
    )

    print(f"[trainer] Model saved → {MODEL_PATH}")
    return model, scaler, close_min, close_max


def load(path: str = MODEL_PATH):
    if not Path(path).exists():
        raise FileNotFoundError(f"No trained model found at '{path}'. Run main.py --train first.")
    return load_model(path)


def inverse_scale_close(
    scaled_val: np.ndarray,
    scaler: MinMaxScaler,
) -> np.ndarray:
    """Convert a scaled close value back to USD."""
    close_idx = FEATURE_COLS.index("close")
    min_ = scaler.data_min_[close_idx]
    max_ = scaler.data_max_[close_idx]
    return scaled_val * (max_ - min_) + min_
