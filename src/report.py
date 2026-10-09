import pandas as pd

def export_to_excel(df, filename="Mutual_Fund_Rankings.xlsx"):
    print(f"Generating Excel report: {filename}...")

    with pd.ExcelWriter(filename, engine='openpyxl') as writer:
        # Methodology Sheet
        methodology = [
            ["Equity Mutual Fund Quantitative Selection Engine"],
            [""],
            ["Metric Configuration:"],
            ["- Risk-Free Rate", "Dynamic proxy (Nippon India Liquid Fund return series)"],
            ["- Trading Days/Year", "252"],
            ["- Benchmarks", "Dynamic proxy (Direct Index Funds mapped to Large, Mid, Smallcap TRI)"],
            ["- Data Source", "AMFI APIs (api.mfapi.in) exclusively for hyper-accurate local calculation"],
            [""],
            ["Methodology Highlights:"],
            ["1. All funds evaluated based on regular-growth NAVs only."],
            ["2. Calculated metrics: Sharpe, Sortino, Up/Down Capture, Median Rolling Return across 1Y, 3Y, 5Y."],
            ["3. Each parameter family weighted at 20%; internally 1Y, 3Y, 5Y are 33.33% each."],
            ["4. Percentile scoring within identical SEBI categories (0-100 scale, higher is better)."],
            ["5. Down Capture is inverted (lower % yields higher percentile score)."],
            ["6. Missing any of the 15 data points moves a fund to 'Not Rankable'."],
            ["7. Complete raw metrics are provided for audibility."]
        ]
        pd.DataFrame(methodology).to_excel(writer, sheet_name="Methodology", index=False, header=False)

        # Category Summaries
        summary = []
        for cat in df['category'].unique():
            cat_df = df[df['category'] == cat]
            rankable = cat_df[cat_df['rankable'] == True]
            unrankable = cat_df[cat_df['rankable'] == False]

            top_3_names = []
            if not rankable.empty:
                top_3 = rankable.head(3)
                top_3_names = top_3['scheme_name'].tolist()

            summary.append({
                "Category": cat,
                "Funds Screened": len(cat_df),
                "Rankable Funds": len(rankable),
                "Not Rankable": len(unrankable),
                "#1": top_3_names[0] if len(top_3_names) > 0 else "N/A",
                "#2": top_3_names[1] if len(top_3_names) > 1 else "N/A",
                "#3": top_3_names[2] if len(top_3_names) > 2 else "N/A"
            })

        pd.DataFrame(summary).to_excel(writer, sheet_name="Category Summary", index=False)

        # Each Category Top 3
        # We consolidate all top 3s into one sheet to reduce tab clutter, but maintain clear grouping
        top_3_frames = []
        for cat in df['category'].unique():
            cat_df = df[(df['category'] == cat) & (df['rankable'] == True)].head(3).copy()
            top_3_frames.append(cat_df)

        if top_3_frames:
            top_3_all = pd.concat(top_3_frames)
            # Layout specific to Top 3 requirements
            top_3_all.rename(columns={'category_rank': 'Rank', 'scheme_name': 'Mutual Fund Name', 'category': 'Category'}, inplace=True)
            top3_cols = [
                'Rank', 'Mutual Fund Name', 'Category', 'overall_score',
                'sharpe_score', 'sortino_score', 'up_cap_score', 'down_cap_score', 'rolling_score',
                'aum', 'expense_ratio', 'fund_age'
            ]
            top_3_all[top3_cols].to_excel(writer, sheet_name="Top 3 By Category", index=False)

        # All Rankable Scores (Complete list of scored funds)
        rankable_funds = df[df['rankable'] == True].copy()
        if not rankable_funds.empty:
            rankable_funds.rename(columns={'category_rank': 'Rank', 'scheme_name': 'Mutual Fund Name', 'category': 'Category'}, inplace=True)
            all_scores_cols = [
                'Rank', 'Mutual Fund Name', 'Category', 'overall_score',
                'sharpe_score', 'sortino_score', 'up_cap_score', 'down_cap_score', 'rolling_score',
                'aum', 'expense_ratio', 'fund_age'
            ]
            rankable_funds[all_scores_cols].to_excel(writer, sheet_name="All Rankable Scores", index=False)

        # Detailed Raw Metrics for ALL funds
        raw_cols = [
            'scheme_code', 'scheme_name', 'category', 'rankable',
            'sharpe_1y', 'sharpe_3y', 'sharpe_5y',
            'sortino_1y', 'sortino_3y', 'sortino_5y',
            'up_cap_1y', 'up_cap_3y', 'up_cap_5y',
            'down_cap_1y', 'down_cap_3y', 'down_cap_5y',
            'median_roll_1y', 'median_roll_3y', 'median_roll_5y'
        ]
        df[raw_cols].to_excel(writer, sheet_name="Raw Metrics", index=False)

        # Unrankable Breakdown
        unrankable_funds = df[df['rankable'] == False].copy()
        if not unrankable_funds.empty:
            unrankable_funds[['scheme_name', 'category', 'fund_age']].to_excel(writer, sheet_name="Not Rankable", index=False)

        # #1 Fund Explanations
        if top_3_frames:
            explanations = []
            for cat in df['category'].unique():
                top1 = top_3_all[(top_3_all['Category'] == cat) & (top_3_all['Rank'] == 1)]
                if not top1.empty:
                    row = top1.iloc[0]
                    name = row['Mutual Fund Name']
                    exp = (
                        f"This fund achieved the highest quantitative score within its category under the defined methodology. "
                        f"Overall Score: {row['overall_score']:.2f}. Family Scores (out of 100) -> "
                        f"Sharpe: {row['sharpe_score']:.2f}, Sortino: {row['sortino_score']:.2f}, "
                        f"Up Capture: {row['up_cap_score']:.2f}, Down Capture: {row['down_cap_score']:.2f}, "
                        f"Rolling Returns: {row['rolling_score']:.2f}."
                    )
                    explanations.append({"Category": cat, "Fund": name, "Explanation": exp})
            pd.DataFrame(explanations).to_excel(writer, sheet_name="#1 Fund Explanation", index=False)

        # Data Limitations
        limitations = [
            ["Data Limitations & Disclosures"],
            ["- Data Source: AMFI India NAV APIs (api.mfapi.in)"],
            ["- Methodology Realignment: Sharpe, Sortino, Up Capture, and Down Capture are properly resampled/calculated on Monthly returns (Morningstar standard). Median Rolling Returns are daily."],
            ["- Data-As-Of: Locked to previous Month-End (or dynamic if flag unchecked)."],
            ["- Expense Ratio / AUM: Currently unavailable through the free daily NAV API. Set to N/A."],
            ["- Risk-Free Rate: Dynamic historical daily returns of SBI/Nippon Liquid Fund used as a pure proxy for the RBI overnight curve."],
            ["- Benchmarks: Tracking exactly against Index Funds representing TRI variants of Large, Mid, Smallcap, avoiding free-API Yahoo limit issues."],
            ["- Survivorship Bias: The scraper evaluates currently active regular growth schemes. Dead/merged funds may not be fully represented."]
        ]
        pd.DataFrame(limitations).to_excel(writer, sheet_name="Data Limitations", index=False, header=False)

    print(f"Report successfully saved to {filename}")
