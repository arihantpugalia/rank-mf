import streamlit as st
import subprocess
import os
import pandas as pd
from urllib.error import HTTPError

st.set_page_config(page_title="Mutual Fund Screener", layout="wide")

st.title("📈 Equity Mutual Fund Quantitative Screener")
st.markdown("Filter and rank Indian Mutual Funds across Sharpe, Sortino, Up/Down Capture, and Rolling Returns methodology.")

st.sidebar.header("Configuration")

# Filter options
subset_limit_chk = st.sidebar.checkbox("Use a small subset for quick testing", value=True)
subset_limit = st.sidebar.number_input("Limit per category", min_value=1, max_value=50, value=5, disabled=not subset_limit_chk)

st.sidebar.markdown("---")
st.sidebar.write("**Data Alignment Flags**")
month_end_chk = st.sidebar.checkbox("Lock to Previous Month-End (Matches Moneycontrol/Morningstar)", value=True)

st.sidebar.markdown("---")
run_button = st.sidebar.button("🚀 Run Screener Engine", type="primary")

st.sidebar.markdown("""
**Note on execution time:**
Unchecking the subset will pull data for hundreds of funds.
First run takes ~15-20 min. Subsequent runs are cached!
""")

if run_button:
    st.info("Screener engine is running. Please monitor the logs below for current status. Do not close this tab.")

    # Construct the command
    cmd = ["python", "-m", "src.main"]
    if subset_limit_chk:
        cmd.extend(["--subset-limit", str(subset_limit)])
    if month_end_chk:
        cmd.append("--month-end")

    # We will use subprocess to run the screener and capture output
    with st.spinner("Processing funds and calculating metrics..."):
        try:
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

            output_container = st.empty()
            log_lines = []

            for line in process.stdout:
                log_lines.append(line)
                # Keep only last 15 lines to avoid huge scroll areas
                output_container.text("".join(log_lines[-15:]))

            process.wait()

            if process.returncode == 0:
                st.success("Screener execution completed successfully!")

                # Check for excel
                if os.path.exists("Mutual_Fund_Rankings.xlsx"):
                    with open("Mutual_Fund_Rankings.xlsx", "rb") as file:
                        btn = st.download_button(
                            label="📥 Download Excel Report",
                            data=file,
                            file_name="Mutual_Fund_Rankings.xlsx",
                            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        )

                    st.subheader("Preview of Top 3 Rankings")
                    try:
                        df = pd.read_excel("Mutual_Fund_Rankings.xlsx", sheet_name="Top 3 By Category")
                        st.dataframe(df.style.highlight_max(axis=0))
                    except Exception as e:
                        st.warning("Could not load preview, please download the excel.")
            else:
                st.error(f"Screener execution failed with return code {process.returncode}.")
        except Exception as e:
            st.error(f"Error running pipeline: {str(e)}")

