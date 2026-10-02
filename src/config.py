import os

# Project Directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
CACHE_DIR = os.path.join(DATA_DIR, "cache")
REF_DIR = os.path.join(DATA_DIR, "reference")

os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(REF_DIR, exist_ok=True)

# Risk Free Rate Proxy
# Using Nippon India Liquid Fund - Regular Growth for an exact historical daily RBI / T-Bill proxy.
RISK_FREE_SCHEME_CODE = "100837"

# Constants for calculations
TRADING_DAYS_PER_YEAR = 252

# Timeframes
PERIODS = {
    '1Y': 1 * 365,
    '3Y': 3 * 365,
    '5Y': 5 * 365
}

# Parameter Families
PARAMETERS = ["Sharpe", "Sortino", "Up Capture", "Down Capture", "Median Rolling Return"]

# SEBI Equity Categories mapped to absolute Index Mutual Fund scheme codes instead of Yahoo Finance endpoints.
# This prevents 404s and accurately matches the TRI benchmarks directly!
CATEGORY_BENCHMARKS = {
    "Large Cap Fund": "120716",                         # UTI Nifty 50 Index Fund
    "Large & Mid Cap Fund": "147626",                   # Motilal Oswal Nifty 500 Index Fund
    "Mid Cap Fund": "147621",                           # Motilal Oswal Nifty Midcap 150 Index
    "Small Cap Fund": "148518",                         # Nippon India Nifty Smallcap 250 Index
    "Flexi Cap Fund": "147626",                         # Motilal Oswal Nifty 500 Index Fund
    "Multi Cap Fund": "147626",
    "Value/Contra": "147626",
    "Focused Fund": "147626",
    "ELSS": "147626",
    "Dividend Yield Fund": "147626",
    "Sectoral/Thematic": "147626",
}

DEFAULT_BENCHMARK = "147626" # Motilal Oswal Nifty 500 Index Fund
