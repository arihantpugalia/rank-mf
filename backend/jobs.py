import subprocess
import uuid
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional
import pandas as pd
from pathlib import Path

from models import JobStatus, ScreenerRequest, ScreenerResults, CategorySummary, FundResult


# In-memory job storage
jobs: Dict[str, dict] = {}


def create_job(config: ScreenerRequest) -> str:
    """Create a new screener job and spawn subprocess."""
    job_id = str(uuid.uuid4())

    # Build command
    project_root = Path(__file__).parent.parent
    cmd = [sys.executable, "-m", "src.main"]

    if config.subset_limit:
        cmd.extend(["--subset-limit", str(config.subset_limit)])

    if config.month_end:
        cmd.append("--month-end")

    # Join metrics and timeframes
    metrics_str = ",".join(config.metrics) if config.metrics else "All"
    timeframes_str = ",".join(config.timeframes) if config.timeframes else "All"

    cmd.extend(["--metric", metrics_str])
    cmd.extend(["--timeframe", timeframes_str])

    # Spawn subprocess
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        cwd=str(project_root),
        bufsize=1
    )

    # Store job info
    jobs[job_id] = {
        "job_id": job_id,
        "status": "running",
        "process": process,
        "progress": [],
        "created_at": datetime.now(),
        "completed_at": None,
        "error": None,
        "config": config,
        "excel_file": f"Mutual_Fund_Rankings_{job_id}.xlsx"
    }

    return job_id


def get_job_status(job_id: str) -> Optional[JobStatus]:
    """Get current status of a job."""
    if job_id not in jobs:
        return None

    job = jobs[job_id]
    process = job.get("process")

    # Read new output lines
    if process and process.poll() is None:
        # Process still running, read stdout
        try:
            while True:
                line = process.stdout.readline()
                if not line:
                    break
                job["progress"].append(line.strip())
        except:
            pass
    elif process and process.poll() is not None:
        # Process finished
        if process.returncode == 0:
            job["status"] = "completed"
            job["completed_at"] = datetime.now()
        else:
            job["status"] = "failed"
            job["completed_at"] = datetime.now()
            job["error"] = f"Process exited with code {process.returncode}"

        # Read any remaining output
        try:
            remaining = process.stdout.read()
            if remaining:
                for line in remaining.split('\n'):
                    if line.strip():
                        job["progress"].append(line.strip())
        except:
            pass

    return JobStatus(
        job_id=job["job_id"],
        status=job["status"],
        progress=job["progress"][-50:],  # Last 50 lines
        created_at=job["created_at"],
        completed_at=job.get("completed_at"),
        error=job.get("error")
    )


def parse_excel_results(job_id: str) -> Optional[ScreenerResults]:
    """Parse generated Excel file and return results as JSON."""
    if job_id not in jobs:
        return None

    job = jobs[job_id]

    if job["status"] != "completed":
        return None

    # Find the Excel file
    project_root = Path(__file__).parent.parent
    excel_file = project_root / "Mutual_Fund_Rankings.xlsx"

    if not excel_file.exists():
        return None

    try:
        # Read Category Summary sheet
        category_df = pd.read_excel(excel_file, sheet_name="Category Summary")
        categories = []

        for _, row in category_df.iterrows():
            categories.append(CategorySummary(
                category=row["Category"],
                funds_screened=int(row["Funds Screened"]),
                rankable_funds=int(row["Rankable Funds"]),
                not_rankable=int(row["Not Rankable"]),
                top_3=[
                    str(row["#1"]) if pd.notna(row["#1"]) else "",
                    str(row["#2"]) if pd.notna(row["#2"]) else "",
                    str(row["#3"]) if pd.notna(row["#3"]) else ""
                ]
            ))

        # Read Top 3 By Category sheet
        top3_df = pd.read_excel(excel_file, sheet_name="Top 3 By Category")
        top_funds = []

        for _, row in top3_df.iterrows():
            top_funds.append(FundResult(
                rank=int(row["Rank"]) if pd.notna(row["Rank"]) else 0,
                scheme_name=str(row["Mutual Fund Name"]),
                category=str(row["Category"]),
                overall_score=float(row["overall_score"]) if pd.notna(row["overall_score"]) else 0.0,
                sharpe_score=float(row["sharpe_score"]) if pd.notna(row["sharpe_score"]) else None,
                sortino_score=float(row["sortino_score"]) if pd.notna(row["sortino_score"]) else None,
                up_cap_score=float(row["up_cap_score"]) if pd.notna(row["up_cap_score"]) else None,
                down_cap_score=float(row["down_cap_score"]) if pd.notna(row["down_cap_score"]) else None,
                rolling_score=float(row["rolling_score"]) if pd.notna(row["rolling_score"]) else None,
                fund_age=float(row["fund_age"]) if pd.notna(row["fund_age"]) else None,
                aum=str(row.get("aum", "N/A")),
                expense_ratio=str(row.get("expense_ratio", "N/A"))
            ))

        # Read All Rankable Scores sheet
        all_rankable = []
        try:
            all_df = pd.read_excel(excel_file, sheet_name="All Rankable Scores")
            for _, row in all_df.iterrows():
                all_rankable.append(FundResult(
                    rank=int(row["Rank"]) if pd.notna(row["Rank"]) else 0,
                    scheme_name=str(row["Mutual Fund Name"]),
                    category=str(row["Category"]),
                    overall_score=float(row["overall_score"]) if pd.notna(row["overall_score"]) else 0.0,
                    sharpe_score=float(row["sharpe_score"]) if pd.notna(row["sharpe_score"]) else None,
                    sortino_score=float(row["sortino_score"]) if pd.notna(row["sortino_score"]) else None,
                    up_cap_score=float(row["up_cap_score"]) if pd.notna(row["up_cap_score"]) else None,
                    down_cap_score=float(row["down_cap_score"]) if pd.notna(row["down_cap_score"]) else None,
                    rolling_score=float(row["rolling_score"]) if pd.notna(row["rolling_score"]) else None,
                    fund_age=float(row["fund_age"]) if pd.notna(row["fund_age"]) else None,
                    aum=str(row.get("aum", "N/A")),
                    expense_ratio=str(row.get("expense_ratio", "N/A"))
                ))
        except Exception:
            all_rankable = top_funds

        # Build filter summary
        config = job["config"]
        filter_summary = f"Metrics: {', '.join(config.metrics)} | Timeframes: {', '.join(config.timeframes)}"

        return ScreenerResults(
            categories=categories,
            top_funds=top_funds,
            all_rankable=all_rankable,
            generated_at=job["completed_at"].isoformat() if job["completed_at"] else "",
            filter_summary=filter_summary
        )

    except Exception as e:
        print(f"Error parsing Excel: {e}")
        return None


def get_excel_path(job_id: str) -> Optional[Path]:
    """Get path to generated Excel file."""
    if job_id not in jobs or jobs[job_id]["status"] != "completed":
        return None

    project_root = Path(__file__).parent.parent
    excel_file = project_root / "Mutual_Fund_Rankings.xlsx"

    return excel_file if excel_file.exists() else None
