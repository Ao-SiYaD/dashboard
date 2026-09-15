# Vehicle Telemetry Monitoring Dashboard

A small FastAPI + Pandas + Chart.js dashboard for the braking-state telemetry selection test.

## Features

- Latest/current vehicle speed (m/s)
- Minimum obstacle distance (m)
- Speed-over-time graph
- Obstacle-distance-over-time graph
- Brake-status filter
- Start/end date-time filters
- Filtered summary cards
- Responsive mobile-friendly UI
- FastAPI interactive API docs at `/docs`
- Health endpoint at `/health`

## Dataset

Expected CSV columns:

```text
timestamp,speed,obstacle_distance,brakes_applied
```

Speed is **m/s**. Obstacle distance is **m**.

Replace `data/telemetry.csv` with the provided selection-test dataset, keeping the filename `telemetry.csv`.

The included CSV is only a tiny demo dataset so the project can be run immediately.

## Run locally / Termux

From the project root:

```bash
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Open:

```text
http://127.0.0.1:8000
```

API docs:

```text
http://127.0.0.1:8000/docs
```

## Koyeb

Deploy the repository as a Python web service.

Build/install:

```bash
pip install -r requirements.txt
```

Run command:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

The application listens on port 8000.

## API

```text
GET /api/summary
GET /api/telemetry
GET /api/metadata
GET /health
```

Filters:

```text
?brake_status=1
?brake_status=0
?start=2026-09-01T10:00:00
?end=2026-09-01T11:00:00
```

Filters can be combined.

## Notes

The backend validates required columns, parses timestamps and numeric fields, normalizes common brake-status values, removes invalid telemetry rows, and sorts records chronologically.
