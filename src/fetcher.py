import os
import io
import time
import requests
import pandas as pd
from tqdm import tqdm
from .config import CACHE_DIR, CATEGORY_BENCHMARKS, DEFAULT_BENCHMARK

AMFI_URL = "https://www.amfiindia.com/spages/NAVAll.txt"

def fetch_amfi_master_list():
    """
    Fetches the AMFI master list and parses categories, scheme codes, and identifies Regular Growth funds.
    """
    print("Fetching AMFI Master List...")
    response = requests.get(AMFI_URL)
    response.raise_for_status()

    lines = response.text.split('\r\n')

    funds = []
    current_category = "Unknown"

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Categories are usually headers without semicolons
        if ';' not in line and "Scheme" in line:
            if "Equity Scheme" in line or "Growth" in line or "Value" in line:
                # Extract the subtype, e.g., "Open Ended Schemes (Equity Scheme - Large Cap Fund)"
                try:
                    current_category = line.split('-')[1].split(')')[0].strip()
                except IndexError:
                    current_category = line
            else:
                current_category = "Non-Equity" # We will filter these out later
            continue

        if ';' in line:
            parts = line.split(';')
            if len(parts) >= 8:
                scheme_code = parts[0]
                scheme_name = parts[3]
                plan = parts[4]
                option = parts[5]

                # Check if it's an equity scheme
                if current_category != "Non-Equity":
                    # Filter for Regular Growth
                    plan_upper = plan.upper()
                    option_upper = option.upper()

                    if "REGULAR" in plan_upper and "GROWTH" in option_upper:
                        if "IDCW" not in option_upper and "DIVIDEND" not in option_upper:
                            funds.append({
                                'scheme_code': scheme_code,
                                'scheme_name': f"{scheme_name} - {plan} - {option}",
                                'category': current_category
                            })

            elif len(parts) >= 6 and len(parts) < 8:
                # Fallback for old format if some lines don't have Plan/Option separated
                scheme_code = parts[0]
                scheme_name = parts[3]

                name_upper = scheme_name.upper()
                if current_category != "Non-Equity":
                    if "REGULAR" in name_upper and "GROWTH" in name_upper:
                        if "IDCW" not in name_upper and "DIVIDEND" not in name_upper and "DIRECT" not in name_upper:
                            funds.append({
                                'scheme_code': scheme_code,
                                'scheme_name': scheme_name,
                                'category': current_category
                            })

    df = pd.DataFrame(funds)

    # Clean up combining Value and Contra if needed
    df['category'] = df['category'].replace({'Contra Fund': 'Value/Contra', 'Value Fund': 'Value/Contra'})

    # Filter Sectoral/Thematic
    df['category'] = df['category'].apply(lambda x: 'Sectoral/Thematic' if 'Sectoral' in x or 'Thematic' in x else x)

    return df

def fetch_nav_history(scheme_code, delay=0.1):
    """
    Fetches historical NAV for a given AMFI scheme code from mfapi.in
    Caches the result to avoid redundant network calls.
    """
    cache_path = os.path.join(CACHE_DIR, f"{scheme_code}.csv")

    if os.path.exists(cache_path):
        df = pd.read_csv(cache_path)
        df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y', errors='coerce')
        # if the csv date is yyyy-mm-dd format due to savings, parse it flexibly
        if df['date'].isna().all():
             df['date'] = pd.to_datetime(pd.read_csv(cache_path)['date'], errors='coerce')
        return df

    url = f"https://api.mfapi.in/mf/{scheme_code}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if 'data' in data and len(data['data']) > 0:
            df = pd.DataFrame(data['data'])
            # Save raw data to cache
            df.to_csv(cache_path, index=False)

            df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y')
            df['nav'] = pd.to_numeric(df['nav'], errors='coerce')
            df = df.dropna()

            time.sleep(delay) # throttle
            return df

    time.sleep(delay)
    return pd.DataFrame()

def get_benchmark_for_category(category):
    for key, ticker in CATEGORY_BENCHMARKS.items():
        if key in category:
            return ticker
    return DEFAULT_BENCHMARK
