from src.fetcher import fetch_amfi_master_list
df = fetch_amfi_master_list()
if not df.empty:
    print(len(df))
    print(df['category'].unique())
else:
    print("Empty dataframe")
