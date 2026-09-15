let speedChart = null;
let distanceChart = null;

const $ = (id) => document.getElementById(id);

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined) return "—";
  return Number(value).toFixed(digits);
}

function queryString() {
  const params = new URLSearchParams();
  const brake = $("brakeStatus").value;
  const start = $("startTime").value;
  const end = $("endTime").value;

  if (brake !== "all") params.set("brake_status", brake);
  if (start) params.set("start", new Date(start).toISOString());
  if (end) params.set("end", new Date(end).toISOString());

  return params.toString();
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json();
}

function chartOptions(yTitle) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        ticks: { color: "#8d9ab2", maxTicksLimit: 8 },
        grid: { color: "rgba(141,154,178,.10)" }
      },
      y: {
        title: { display: true, text: yTitle, color: "#8d9ab2" },
        ticks: { color: "#8d9ab2" },
        grid: { color: "rgba(141,154,178,.10)" }
      }
    }
  };
}

function updateCharts(rows) {
  const labels = rows.map(r => new Date(r.timestamp).toLocaleString());
  const speeds = rows.map(r => Number(r.speed));
  const distances = rows.map(r => Number(r.obstacle_distance));

  if (speedChart) speedChart.destroy();
  if (distanceChart) distanceChart.destroy();

  speedChart = new Chart($("speedChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Speed",
        data: speeds,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.2
      }]
    },
    options: chartOptions("Speed (m/s)")
  });

  distanceChart = new Chart($("distanceChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Obstacle distance",
        data: distances,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.2
      }]
    },
    options: chartOptions("Distance (m)")
  });
}

async function loadDashboard() {
  const qs = queryString();
  const suffix = qs ? `?${qs}` : "";

  $("filterMessage").textContent = "Loading telemetry…";

  try {
    const [summary, rows] = await Promise.all([
      fetchJson(`/api/summary${suffix}`),
      fetchJson(`/api/telemetry${suffix}`)
    ]);

    $("latestSpeed").textContent = formatNumber(summary.latest_speed);
    $("minDistance").textContent = formatNumber(summary.minimum_obstacle_distance);
    $("records").textContent = summary.records;
    $("brakingEvents").textContent = summary.braking_events;

    updateCharts(rows);

    $("filterMessage").textContent =
      `${summary.records} telemetry points match the selected filters.`;
  } catch (error) {
    console.error(error);
    $("filterMessage").textContent =
      "Could not load telemetry. Check the CSV format and server logs.";
  }
}

async function loadMetadata() {
  try {
    const meta = await fetchJson("/api/metadata");
    $("datasetInfo").textContent =
      `${meta.rows} rows · ${meta.start} → ${meta.end} · speed: ${meta.speed_unit} · distance: ${meta.distance_unit}`;
  } catch {
    $("datasetInfo").textContent = "Dataset information unavailable.";
  }
}

$("applyBtn").addEventListener("click", loadDashboard);

$("resetBtn").addEventListener("click", () => {
  $("brakeStatus").value = "all";
  $("startTime").value = "";
  $("endTime").value = "";
  loadDashboard();
});

loadMetadata();
loadDashboard();
