import argparse
import pandas as pd
from datetime import datetime
from pandas.tseries.offsets import MonthEnd
from .fetcher import fetch_amfi_master_list, fetch_nav_history, get_benchmark_for_category
from .metrics import calculate_sharpe, calculate_sortino, calculate_capture_ratios, calculate_rolling_median
from .scoring import apply_scoring
from .report import export_to_excel
from .config import RISK_FREE_SCHEME_CODE

def main():
    parser = argparse.ArgumentParser(description="Mutual Fund Screener")
    parser.add_argument('--subset-limit', type=int, default=None, help="Limit funds per category for testing")
    parser.add_argument('--category', type=str, default=None, help="Filter by specific category")
    parser.add_argument('--month-end', action='store_true', help="Lock evaluation date to previous month-end")
    parser.add_argument('--metric', type=str, default="All", help="Filter metric: All, Sharpe, Sortino, Up Capture, Down Capture, Rolling Returns")
    parser.add_argument('--timeframe', type=str, default="All", help="Filter timeframe: All, 1y, 3y, 5y")
    args = parser.parse_args()

    # 1. Fetch Funds
    funds_df = fetch_amfi_master_list()
    if args.category:
        funds_df = funds_df[funds_df['category'].str.contains(args.category, case=False, na=False)]

    if args.subset_limit:
        funds_df = funds_df.groupby('category').head(args.subset_limit).reset_index(drop=True)

    print(f"Total funds to process: {len(funds_df)}")

    if args.month_end:
        # Get previous month-end date
        today = pd.Timestamp(datetime.now().date())
        evaluation_date = (today.replace(day=1) - pd.Timedelta(days=1))
        print(f"Locked Evaluation Date to Month-End: {evaluation_date.date()}")
    else:
        evaluation_date = pd.Timestamp(datetime.now().date())

    def get_fund_series(scheme_code, end_date):
        df = fetch_nav_history(scheme_code)
        if df.empty: return df
        df['date'] = pd.to_datetime(df['date']).dt.normalize()
        df = df[df['date'] <= end_date]
        df = df.sort_values('date').reset_index(drop=True)
        df['daily_return'] = df['nav'].pct_change()
        return df.dropna(subset=['daily_return'])

    print("Fetching Risk-Free Rate data (Liquid Fund)...")
    rf_df = get_fund_series(RISK_FREE_SCHEME_CODE, evaluation_date)
    if not rf_df.empty:
        # Create monthly RF returns
        rf_monthly = rf_df.set_index('date').resample('ME').last().dropna()
        rf_monthly['monthly_return'] = rf_monthly['nav'].pct_change()
        rf_monthly_returns = rf_monthly['monthly_return'].dropna()
    else:
        rf_monthly_returns = None

    print("Fetching Benchmark Index Fund datasets...")
    benchmarks = funds_df['category'].apply(get_benchmark_for_category).unique()
    benchmark_data = {}
    for b in benchmarks:
        print(f"  Fetching AMFI Code {b}...")
        df_b = get_fund_series(b, evaluation_date)
        if not df_b.empty:
            benchmark_data[b] = df_b

    # 2. Iterate and Calculate
    results = []
    print("Fetching NAVs and calculating metrics...")

    for idx, row in funds_df.iterrows():
        scheme_code = row['scheme_code']
        cat = row['category']

        nav_df = get_fund_series(scheme_code, evaluation_date)

        metric_row = row.to_dict()

        if nav_df.empty or len(nav_df) < 250:
            for m in ['sharpe_1y', 'sharpe_3y', 'sharpe_5y', 'sortino_1y', 'sortino_3y', 'sortino_5y',
                      'up_cap_1y', 'up_cap_3y', 'up_cap_5y', 'down_cap_1y', 'down_cap_3y', 'down_cap_5y',
                      'median_roll_1y', 'median_roll_3y', 'median_roll_5y']:
                metric_row[m] = pd.NA
            results.append(metric_row)
            continue

        # We will anchor around the latest NAV date if it's recent
        recent_date = nav_df['date'].max()

        bmk_ticker = get_benchmark_for_category(cat)
        bmk_df = benchmark_data.get(bmk_ticker, pd.DataFrame())

        def calc_for_years(years):
            offset_date = recent_date - pd.DateOffset(years=years)
            sliced_nav = nav_df[nav_df['date'] >= offset_date].copy()

            if len(sliced_nav) < 200 * years: # Minimal trading days sanity check
                return {
                    'sharpe': pd.NA, 'sortino': pd.NA,
                    'up_cap': pd.NA, 'down_cap': pd.NA
                }

            # Resample to monthly end natively for Morningstar metrics
            monthly_nav = sliced_nav.set_index('date').resample('ME').last().dropna()
            monthly_nav['monthly_return'] = monthly_nav['nav'].pct_change()
            monthly_returns = monthly_nav['monthly_return'].dropna()

            # Slice the risk-free returns to match this period roughly
            if rf_monthly_returns is not None:
                rf_sliced = rf_monthly_returns[rf_monthly_returns.index >= offset_date]
            else:
                rf_sliced = None

            s = calculate_sharpe(monthly_returns, rf_returns=rf_sliced, freq='monthly')
            so = calculate_sortino(monthly_returns, rf_returns=rf_sliced, freq='monthly')

            up = pd.NA
            down = pd.NA
            if not bmk_df.empty:
                sliced_bmk = bmk_df[bmk_df['date'] >= offset_date].copy()
                monthly_bmk = sliced_bmk.set_index('date').resample('ME').last().dropna()
                monthly_bmk['monthly_return'] = monthly_bmk['nav'].pct_change()

                merged = pd.merge(monthly_nav[['monthly_return']], monthly_bmk[['monthly_return']], left_index=True, right_index=True, suffixes=('_fund', '_bmk')).dropna()
                if len(merged) >= 10 * years: # At least 10 months per year of valid history
                    up, down = calculate_capture_ratios(merged['monthly_return_fund'], merged['monthly_return_bmk'])

            return {
                'sharpe': s, 'sortino': so,
                'up_cap': up, 'down_cap': down
            }

        c1 = calc_for_years(1)
        c3 = calc_for_years(3)
        c5 = calc_for_years(5)

        metric_row.update({
            'sharpe_1y': c1['sharpe'], 'sharpe_3y': c3['sharpe'], 'sharpe_5y': c5['sharpe'],
            'sortino_1y': c1['sortino'], 'sortino_3y': c3['sortino'], 'sortino_5y': c5['sortino'],
            'up_cap_1y': c1['up_cap'], 'up_cap_3y': c3['up_cap'], 'up_cap_5y': c5['up_cap'],
            'down_cap_1y': c1['down_cap'], 'down_cap_3y': c3['down_cap'], 'down_cap_5y': c5['down_cap'],
        })

        # Rolling median calculation over the ENTIRE history
        roll_1y = calculate_rolling_median(nav_df, 'date', 'nav', 1)
        roll_3y = calculate_rolling_median(nav_df, 'date', 'nav', 3)
        roll_5y = calculate_rolling_median(nav_df, 'date', 'nav', 5)

        metric_row.update({
            'median_roll_1y': roll_1y,
            'median_roll_3y': roll_3y,
            'median_roll_5y': roll_5y
        })

        # Extra metadata
        fund_age_years = (nav_df['date'].max() - nav_df['date'].min()).days / 365.25 if not nav_df.empty else 0
        metric_row['fund_age'] = round(fund_age_years, 1)
        metric_row['aum'] = "N/A"
        metric_row['expense_ratio'] = "N/A"

        results.append(metric_row)

    # 3. Score
    df_results = pd.DataFrame(results)
    scored_df = apply_scoring(df_results, metric_filter=args.metric, timeframe_filter=args.timeframe)

    # 4. Export
    export_to_excel(scored_df)

if __name__ == "__main__":
    main()