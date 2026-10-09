# Mutual Fund Screener - Backend API

FastAPI server that wraps the Python screener CLI as background jobs.

## Setup

```bash
cd backend
pip install -r requirements.txt
```

## Run Server

```bash
uvicorn main:app --reload --port 8000
```

Or:

```bash
python main.py
```

Server will be available at http://localhost:8000

## API Endpoints

### POST /api/screener
Trigger a new screener job.

**Request Body:**
```json
{
  "subset_limit": 5,
  "month_end": true,
  "metrics": ["Sharpe", "Sortino"],
  "timeframes": ["1y", "3y"]
}
```

**Response:**
```json
{
  "job_id": "uuid-string",
  "message": "Screener job started"
}
```

### GET /api/status/{job_id}
Get job status and progress logs (poll every 2 seconds).

**Response:**
```json
{
  "job_id": "uuid-string",
  "status": "running",
  "progress": ["Fetching funds...", "Processing category..."],
  "created_at": "2026-10-03T16:00:00",
  "completed_at": null,
  "error": null
}
```

### GET /api/results/{job_id}
Get parsed results from completed job.

**Response:**
```json
{
  "categories": [
    {
      "category": "Large Cap Fund",
      "funds_screened": 10,
      "rankable_funds": 8,
      "not_rankable": 2,
      "top_3": ["Fund A", "Fund B", "Fund C"]
    }
  ],
  "top_funds": [
    {
      "rank": 1,
      "scheme_name": "Fund A",
      "category": "Large Cap Fund",
      "overall_score": 85.5,
      "sharpe_score": 82.0,
      "sortino_score": 88.0,
      "up_cap_score": 84.0,
      "down_cap_score": 90.0,
      "rolling_score": 83.0,
      "fund_age": 5.2
    }
  ],
  "generated_at": "2026-10-03T16:15:00",
  "filter_summary": "Metrics: Sharpe, Sortino | Timeframes: 1y, 3y"
}
```

### GET /api/download/{job_id}
Download the generated Excel file.

Returns: Excel file download

## Architecture

- **main.py** - FastAPI routes
- **models.py** - Pydantic request/response models
- **jobs.py** - Job management (subprocess spawning, status tracking, Excel parsing)

Jobs are stored in-memory (dict) - sufficient for single-user MVP.
