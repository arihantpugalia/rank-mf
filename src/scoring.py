import pandas as pd
import numpy as np
from scipy.stats import percentileofscore

def calculate_percentiles_within_category(df, col_name, ascending=True):
    """
    Ranks funds within their 'category' based on col_name.
    ascending=True: Higher value = Higher percentile (e.g. Sharpe).
    ascending=False: Lower value = Higher percentile (e.g. Down Capture).
    """
    # Create the score column
    score_col = col_name + "_score"
    df[score_col] = np.nan

    for category, group in df.groupby('category'):
        valid_data = group[col_name].dropna()
        if len(valid_data) == 0:
            continue

        scores = []
        for val in group[col_name]:
            if pd.isna(val):
                scores.append(np.nan)
            else:
                pct = percentileofscore(valid_data, val, kind='rank')
                if not ascending:
                    pct = 100.0 - pct
                scores.append(pct)

        df.loc[group.index, score_col] = scores

    return df

def apply_scoring(df, metric_filter="All", timeframe_filter="All"):
    """
    Applies scoring logic dynamically based on selected metric and timeframe filters.
    metric_filter: "All" or comma-separated list like "Sharpe,Rolling Returns"
    timeframe_filter: "All" or comma-separated list like "1y,3y"
    """
    all_metrics = {
        'Sharpe': ['sharpe_1y', 'sharpe_3y', 'sharpe_5y'],
        'Sortino': ['sortino_1y', 'sortino_3y', 'sortino_5y'],
        'Up Capture': ['up_cap_1y', 'up_cap_3y', 'up_cap_5y'],
        'Down Capture': ['down_cap_1y', 'down_cap_3y', 'down_cap_5y'],
        'Rolling Returns': ['median_roll_1y', 'median_roll_3y', 'median_roll_5y']
    }

    # Parse filters
    if metric_filter == "All" or not metric_filter:
        selected_families = list(all_metrics.keys())
    else:
        selected_families = [m.strip() for m in metric_filter.split(',')]

    if timeframe_filter == "All" or not timeframe_filter:
        selected_timeframes = ['1y', '3y', '5y']
    else:
        selected_timeframes = [t.strip() for t in timeframe_filter.split(',')]

    active_metrics = []

    # Identify which raw columns are required based on filters
    for family in selected_families:
        if family in all_metrics:
            for col in all_metrics[family]:
                # Check if this column matches any selected timeframe
                if any(tf in col for tf in selected_timeframes):
                    active_metrics.append(col)

    # 1. Ensure rankability dynamically (funds only need history for the ACTIVE metrics!)
    df['rankable'] = df[active_metrics].notna().all(axis=1)

    # 2. Iterate through categories and calculate percentiles for ALL possible metrics initially
    # (so raw metrics sheets still have rich data). But only rankable impacts final.
    flat_metrics = [m for sublist in all_metrics.values() for m in sublist]
    higher_is_better = [m for m in flat_metrics if not 'down_cap' in m]
    lower_is_better = [m for m in flat_metrics if 'down_cap' in m]

    for m in higher_is_better:
        df = calculate_percentiles_within_category(df, m, ascending=True)

    for m in lower_is_better:
        df = calculate_percentiles_within_category(df, m, ascending=False)

    # 3. Calculate family scores dynamically based ONLY on the active timeframe
    def get_active_score_cols(family_name):
        if family_name not in all_metrics:
            return []
        return [c + "_score" for c in all_metrics[family_name] if c in active_metrics]

    sharpe_cols = get_active_score_cols('Sharpe')
    sortino_cols = get_active_score_cols('Sortino')
    up_cols = get_active_score_cols('Up Capture')
    down_cols = get_active_score_cols('Down Capture')
    roll_cols = get_active_score_cols('Rolling Returns')

    # Mean of available/active timeframes
    df['sharpe_score'] = df[sharpe_cols].mean(axis=1) if sharpe_cols else np.nan
    df['sortino_score'] = df[sortino_cols].mean(axis=1) if sortino_cols else np.nan
    df['up_cap_score'] = df[up_cols].mean(axis=1) if up_cols else np.nan
    df['down_cap_score'] = df[down_cols].mean(axis=1) if down_cols else np.nan
    df['rolling_score'] = df[roll_cols].mean(axis=1) if roll_cols else np.nan

    # 4. Calculate Overall Score dynamically (only include families that have active metrics)
    active_family_scores = []
    for family in selected_families:
        if family == 'Sharpe' and sharpe_cols:
            active_family_scores.append('sharpe_score')
        elif family == 'Sortino' and sortino_cols:
            active_family_scores.append('sortino_score')
        elif family == 'Up Capture' and up_cols:
            active_family_scores.append('up_cap_score')
        elif family == 'Down Capture' and down_cols:
            active_family_scores.append('down_cap_score')
        elif family == 'Rolling Returns' and roll_cols:
            active_family_scores.append('rolling_score')

    df['overall_score'] = df[active_family_scores].mean(axis=1)

    # Nullify overall score for non-rankable funds
    df.loc[~df['rankable'], 'overall_score'] = np.nan

    # 5. Ranking and Tie-breakers
    # Using existing logic:
    # If 5Y exists we tie break on it, otherwise standard overall score wins
    df.sort_values(by=[
        'category',
        'overall_score',
        'sortino_5y',
        'sharpe_5y',
        'median_roll_5y',
        'down_cap_5y',
        'up_cap_5y'
    ], ascending=[
        True, False, False, False, False, True, False
    ], inplace=True)

    # Assign rank within category
    df['category_rank'] = df.groupby('category')['overall_score'].rank(method='first', ascending=False)

    return df
