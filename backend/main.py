from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path

from models import ScreenerRequest, JobStatus, ScreenerResults
from jobs import create_job, get_job_status, parse_excel_results, get_excel_path

app = FastAPI(title="Mutual Fund Screener API")

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    """Root endpoint."""
    return {"message": "Mutual Fund Screener API", "version": "1.0.0"}


@app.post("/api/screener")
def run_screener(request: ScreenerRequest):
    """
    Trigger a new screener job.
    Returns job_id for status polling.
    """
    try:
        job_id = create_job(request)
        return {"job_id": job_id, "message": "Screener job started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/status/{job_id}")
def get_status(job_id: str) -> JobStatus:
    """
    Get current status and progress logs for a job.
    Poll this endpoint every 2 seconds.
    """
    status = get_job_status(job_id)
    if not status:
        raise HTTPException(status_code=404, detail="Job not found")
    return status


@app.get("/api/results/{job_id}")
def get_results(job_id: str) -> ScreenerResults:
    """
    Get parsed results from completed job.
    Returns JSON with category summaries and top funds.
    """
    results = parse_excel_results(job_id)
    if not results:
        status = get_job_status(job_id)
        if not status:
            raise HTTPException(status_code=404, detail="Job not found")
        if status.status != "completed":
            raise HTTPException(status_code=400, detail=f"Job status: {status.status}")
        raise HTTPException(status_code=500, detail="Failed to parse results")
    return results


@app.get("/api/download/{job_id}")
def download_excel(job_id: str):
    """
    Download the generated Excel file.
    """
    excel_path = get_excel_path(job_id)
    if not excel_path:
        raise HTTPException(status_code=404, detail="Excel file not found")

    return FileResponse(
        path=excel_path,
        filename="Mutual_Fund_Rankings.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
