from keras import Input, Model
from keras.layers import LSTM, Dense, Dropout, BatchNormalization


def build_lstm(sequence_len: int, n_features: int, units: int = 128) -> Model:
    """Stacked LSTM that predicts next-bar closing price (regression)."""
    inp = Input(shape=(sequence_len, n_features), name="ohlcv_sequence")

    x = LSTM(units, return_sequences=True, name="lstm_1")(inp)
    x = BatchNormalization()(x)
    x = Dropout(0.2)(x)

    x = LSTM(units // 2, return_sequences=False, name="lstm_2")(x)
    x = BatchNormalization()(x)
    x = Dropout(0.2)(x)

    x = Dense(32, activation="relu")(x)
    out = Dense(1, name="price_pred")(x)

    model = Model(inp, out, name="nvda_lstm")
    model.compile(optimizer="adam", loss="mse", metrics=["mae"])
    return model
