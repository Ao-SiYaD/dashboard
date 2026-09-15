from pathlib import Path
from typing import Optional
from fastapi import FastAPI, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "telemetry.csv"

REQUIRED_COLUMNS = ["timestamp", "speed", "obstacle_distance", "brakes_applied"]

app = FastAPI(
    title="Vehicle Braking State Dashboard",
    description="Telemetry dashboard for speed, obstacle distance and braking state.",
    version="1.0.0",
)

app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")


def load_data() -> pd.DataFrame:
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"Dataset not found: {DATA_FILE}")

    df = pd.read_csv(DATA_FILE)

    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")

    df = df[REQUIRED_COLUMNS].copy()

    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df["speed"] = pd.to_numeric(df["speed"], errors="coerce")
    df["obstacle_distance"] = pd.to_numeric(df["obstacle_distance"], errors="coerce")

    # Normalize common representations of brake status to 0/1.
    brake_map = {
        "true": 1, "false": 0,
        "yes": 1, "no": 0,
        "on": 1, "off": 0,
        "applied": 1, "not applied": 0,
    }
    if df["brakes_applied"].dtype == object:
        normalized = df["brakes_applied"].astype(str).str.strip().str.lower()
        df["brakes_applied"] = normalized.map(brake_map).fillna(
            pd.to_numeric(normalized, errors="coerce")
        )
    df["brakes_applied"] = pd.to_numeric(df["brakes_applied"], errors="coerce")

    df = df.dropna(subset=["timestamp", "speed", "obstacle_distance", "brakes_applied"])
    df["brakes_applied"] = df["brakes_applied"].astype(int).clip(0, 1)
    df = df.sort_values("timestamp").reset_index(drop=True)

    return df


def apply_filters(
    df: pd.DataFrame,
    start: Optional[str],
    end: Optional[str],
    brake_status: str,
) -> pd.DataFrame:
    if start:
        start_dt = pd.to_datetime(start, errors="coerce")
        if pd.isna(start_dt):
            raise ValueError("Invalid start time.")
        df = df[df["timestamp"] >= start_dt]

    if end:
        end_dt = pd.to_datetime(end, errors="coerce")
        if pd.isna(end_dt):
            raise ValueError("Invalid end time.")
        df = df[df["timestamp"] <= end_dt]

    if brake_status in {"0", "1"}:
        df = df[df["brakes_applied"] == int(brake_status)]

    return df


def records_from_df(df: pd.DataFrame):
    result = df.copy()
    result["timestamp"] = result["timestamp"].dt.strftime("%Y-%m-%dT%H:%M:%S")
    return result.to_dict(orient="records")


@app.get("/", include_in_schema=False)
def dashboard():
    return FileResponse(BASE_DIR / "static" / "index.html")


@app.get("/api/summary")
def summary(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    brake_status: str = Query("all"),
):
    df = apply_filters(load_data(), start, end, brake_status)

    if df.empty:
        return {
            "latest_speed": None,
            "minimum_obstacle_distance": None,
            "records": 0,
            "braking_events": 0,
        }

    return {
        "latest_speed": round(float(df.iloc[-1]["speed"]), 3),
        "minimum_obstacle_distance": round(float(df["obstacle_distance"].min()), 3),
        "records": int(len(df)),
        "braking_events": int((df["brakes_applied"] == 1).sum()),
    }


@app.get("/api/telemetry")
def telemetry(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    brake_status: str = Query("all"),
):
    df = apply_filters(load_data(), start, end, brake_status)
    return records_from_df(df)


@app.get("/api/metadata")
def metadata():
    df = load_data()
    return {
        "rows": int(len(df)),
        "start": df["timestamp"].min().strftime("%Y-%m-%dT%H:%M:%S"),
        "end": df["timestamp"].max().strftime("%Y-%m-%dT%H:%M:%S"),
        "speed_unit": "m/s",
        "distance_unit": "m",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
