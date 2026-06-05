import os
from dotenv import load_dotenv

load_dotenv()

ALPACA_API_KEY = os.environ["ALPACA_API_KEY"]
ALPACA_SECRET_KEY = os.environ["ALPACA_SECRET_KEY"]
ALPACA_BASE_URL = os.getenv("ALPACA_BASE_URL", "https://paper-api.alpaca.markets")

SYMBOL = "NVDA"
TIMEFRAME = "1Day"

SEQUENCE_LEN = int(os.getenv("SEQUENCE_LEN", 60))
EPOCHS = int(os.getenv("EPOCHS", 50))
BATCH_SIZE = int(os.getenv("BATCH_SIZE", 32))

TRAIN_SPLIT = 0.8
MODEL_PATH = "nvda_lstm.keras"
