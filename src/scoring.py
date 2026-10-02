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

def apply_scoring(df):
    """
    Applies the full scoring architecture based on the rules.
    """
    # 1. Ensure we only score funds that have all 15 metrics
    # List of 15 metric columns
    metrics = [
        'sharpe_1y', 'sharpe_3y', 'sharpe_5y',
        'sortino_1y', 'sortino_3y', 'sortino_5y',
        'up_cap_1y', 'up_cap_3y', 'up_cap_5y',
        'down_cap_1y', 'down_cap_3y', 'down_cap_5y',
        'median_roll_1y', 'median_roll_3y', 'median_roll_5y'
    ]

    # Add a 'rankable' flag
    df['rankable'] = df[metrics].notna().all(axis=1)

    # 2. Iterate through categories and rank. We only rank 'rankable' funds
    # However we can calculate percentiles anyway, just ignoring NaNs
    # Metrics where higher is better
    higher_is_better = [m for m in metrics if not 'down_cap' in m]
    # Metrics where lower is better
    lower_is_better = [m for m in metrics if 'down_cap' in m]

    for m in higher_is_better:
        df = calculate_percentiles_within_category(df, m, ascending=True)

    for m in lower_is_better:
        df = calculate_percentiles_within_category(df, m, ascending=False)

    # 3. Calculate family scores (average of 1Y, 3Y, 5Y percentiles per family)
    df['sharpe_score'] = df[['sharpe_1y_score', 'sharpe_3y_score', 'sharpe_5y_score']].mean(axis=1)
    df['sortino_score'] = df[['sortino_1y_score', 'sortino_3y_score', 'sortino_5y_score']].mean(axis=1)
    df['up_cap_score'] = df[['up_cap_1y_score', 'up_cap_3y_score', 'up_cap_5y_score']].mean(axis=1)
    df['down_cap_score'] = df[['down_cap_1y_score', 'down_cap_3y_score', 'down_cap_5y_score']].mean(axis=1)
    df['rolling_score'] = df[['median_roll_1y_score', 'median_roll_3y_score', 'median_roll_5y_score']].mean(axis=1)

    # 4. Overall Score
    df['overall_score'] = (
        df['sharpe_score'] * 0.20 +
        df['sortino_score'] * 0.20 +
        df['up_cap_score'] * 0.20 +
        df['down_cap_score'] * 0.20 +
        df['rolling_score'] * 0.20
    )

    # Nullify overall score for non-rankable funds
    df.loc[~df['rankable'], 'overall_score'] = np.nan

    # 5. Ranking and Tie-breakers
    # Sort logically
    # Category, Overall Score (desc), 5Y Sortino (desc), 5Y Sharpe (desc), 5Y Roll (desc), 5Y Down Cap (asc - handled by score), 5Y Up Cap (desc)
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
