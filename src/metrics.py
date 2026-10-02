import numpy as np
import pandas as pd
from .config import TRADING_DAYS_PER_YEAR, PERIODS

def slice_timeframe(df, date_col, end_date, years):
    start_date = end_date - pd.DateOffset(years=years)
    mask = (df[date_col] >= start_date) & (df[date_col] <= end_date)
    return df.loc[mask].copy()

def calculate_sharpe(fund_returns, rf_returns=None, freq='daily'):
    """
    Calculates annualized Sharpe Ratio using either a dynamic RF return series or zero if not provided.
    """
    if len(fund_returns) < 3:
        return np.nan

    if rf_returns is not None:
        # Align series to ensure same length if they differ slightly
        df = pd.DataFrame({'fund': fund_returns, 'rf': rf_returns}).dropna()
        if len(df) < 3: return np.nan
        excess = df['fund'] - df['rf']
    else:
        excess = fund_returns

    mean_excess = excess.mean()
    std_excess = excess.std()

    if std_excess == 0:
        return np.nan

    periods = 12 if freq == 'monthly' else TRADING_DAYS_PER_YEAR
    sharpe = mean_excess / std_excess
    return sharpe * np.sqrt(periods)

def calculate_sortino(fund_returns, rf_returns=None, freq='daily'):
    """
    Calculates annualized Sortino Ratio.
    """
    if len(fund_returns) < 3:
        return np.nan

    if rf_returns is not None:
        df = pd.DataFrame({'fund': fund_returns, 'rf': rf_returns}).dropna()
        if len(df) < 3: return np.nan
        excess = df['fund'] - df['rf']
    else:
        excess = fund_returns

    mean_excess = excess.mean()

    # Morningstar Downside Deviation:
    # Set all positive excess returns to 0, square them, sum them, divide by the TOTAL number of periods (not just the down periods)
    downside_squared = np.minimum(excess, 0)**2
    downside_std = np.sqrt(np.mean(downside_squared))

    if downside_std == 0:
        return np.nan # No downside, Sortino infinite

    periods = 12 if freq == 'monthly' else TRADING_DAYS_PER_YEAR
    sortino = mean_excess / downside_std
    return sortino * np.sqrt(periods)

def calculate_capture_ratios(fund_returns, bmk_returns):
    """
    Calculates Up Capture and Down Capture based on Morningstar's Geometric Annualized methodology.
    """
    # Align the series
    combined = pd.DataFrame({
        'fund': fund_returns,
        'bmk': bmk_returns
    }).dropna()

    if len(combined) < 3:
        return np.nan, np.nan

    # Up periods = months where bmk >= 0
    up_periods = combined[combined['bmk'] >= 0]
    n_up = len(up_periods)
    if n_up > 0:
        fund_up_geo = np.prod(1 + up_periods['fund'])
        bmk_up_geo = np.prod(1 + up_periods['bmk'])

        # Annualize based on the number of up months (Morningstar method)
        fund_up_ann = (fund_up_geo ** (12 / n_up)) - 1
        bmk_up_ann = (bmk_up_geo ** (12 / n_up)) - 1

        up_capture = (fund_up_ann / bmk_up_ann) * 100 if bmk_up_ann != 0 else np.nan
    else:
        up_capture = np.nan

    # Down periods = months where bmk < 0
    down_periods = combined[combined['bmk'] < 0]
    n_down = len(down_periods)
    if n_down > 0:
        fund_down_geo = np.prod(1 + down_periods['fund'])
        bmk_down_geo = np.prod(1 + down_periods['bmk'])

        # Annualize based on the number of down months
        fund_down_ann = (fund_down_geo ** (12 / n_down)) - 1
        bmk_down_ann = (bmk_down_geo ** (12 / n_down)) - 1

        down_capture = (fund_down_ann / bmk_down_ann) * 100 if bmk_down_ann != 0 else np.nan
    else:
        down_capture = np.nan

    return up_capture, down_capture

def calculate_rolling_median(df, date_col, val_col, years):
    """
    Calculates the median of the rolling annualized return over the specified number of years.
    Returns the median CAGR.
    """
    df = df.sort_values(date_col).reset_index(drop=True)
    if len(df) < 250 * years:
        return np.nan

    df = df.set_index(date_col)

    # Calculate x-year trailing return for each day
    # Number of calendar days = 365 * years (or roughly)
    offset = pd.DateOffset(years=years)

    # Vectorized approach:
    # reindex with an older date to get "beginning value"
    past_dates = df.index - offset

    # We use asof to get the nearest valid NAV on or before the past_date
    # To do this efficiently via pandas:
    # df.index is sorted. We can map.
    past_navs = []

    # This loop can be slow for daily, so maybe use merge_asof
    # Prepare a DataFrame of shifts
    shifted = pd.DataFrame({'target_date': past_dates}, index=df.index)
    shifted = shifted.dropna()

    # Create lookup df
    lookup = df[[val_col]].copy()
    lookup = lookup.sort_index()

    # merge_asof requires backward search
    merged = pd.merge_asof(shifted.sort_values('target_date'), lookup, left_on='target_date', right_index=True, direction='backward')
    merged = merged.sort_index()

    # Now we have beg_val and end_val for valid rows
    valid = merged.dropna()
    valid_end_val = df.loc[valid.index, val_col]

    cagrs = (valid_end_val / valid[val_col]) ** (1 / years) - 1

    if len(cagrs) == 0:
        return np.nan

    return cagrs.median() * 100 # return as percentage
