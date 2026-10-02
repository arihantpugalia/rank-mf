import yfinance as yf
tickers = [
    "^NSEMDCP50",
    "^CRSLMC",
    "^CNXSC",
    "^NSEMIDCAP"
]
for t in tickers:
    data = yf.Ticker(t).history(period="5d")
    print(f"{t}: {len(data)}")
