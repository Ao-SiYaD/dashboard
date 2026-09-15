let speedChart;
let distanceChart;

async function loadDashboard() {
    const params = new URLSearchParams();

    const brakeStatus = document.getElementById("brakeStatus").value;
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;

    if (brakeStatus !== "all") {
        params.append("brake_status", brakeStatus);
    }

    if (start) {
        params.append("start", new Date(start).toISOString());
    }

    if (end) {
        params.append("end", new Date(end).toISOString());
    }

    try {
        const response = await fetch(`/api/summary?${params.toString()}`);

        if (!response.ok) {
            throw new Error("Failed to load dashboard data");
        }

        const data = await response.json();

        document.getElementById("currentSpeed").textContent =
            `${Number(data.current_speed).toFixed(2)} m/s`;

        document.getElementById("minDistance").textContent =
            `${Number(data.min_obstacle_distance).toFixed(2)} m`;

        document.getElementById("recordCount").textContent =
            data.records;

        document.getElementById("brakingEvents").textContent =
            data.braking_events;

        createCharts(data.telemetry);

    } catch (error) {
        console.error(error);
    }
}


function createCharts(data) {
    const labels = data.map(item => item.timestamp);

    const speeds = data.map(item => Number(item.speed));

    const distances = data.map(
        item => Number(item.obstacle_distance)
    );


    // Destroy old charts before creating new ones
    if (speedChart) {
        speedChart.destroy();
    }

    if (distanceChart) {
        distanceChart.destroy();
    }


    // Speed Chart
    const speedCanvas =
        document.getElementById("speedChart");

    speedChart = new Chart(speedCanvas, {
        type: "line",

        data: {
            labels: labels,

            datasets: [{
                label: "Speed (m/s)",
                data: speeds,

                borderWidth: 2,
                pointRadius: 0,
                tension: 0.2
            }]
        },

        options: {
            responsive: true,

            interaction: {
                mode: "index",
                intersect: false
            },

            scales: {
                x: {
                    ticks: {
                        maxTicksLimit: 10
                    }
                },

                y: {
                    title: {
                        display: true,
                        text: "Speed (m/s)"
                    }
                }
            },

            plugins: {
                legend: {
                    display: false
                },

                zoom: {
                    pan: {
                        enabled: true,
                        mode: "x",
                        modifierKey: "shift"
                    },

                    zoom: {
                        wheel: {
                            enabled: true
                        },

                        pinch: {
                            enabled: true
                        },

                        drag: {
                            enabled: true
                        },

                        mode: "x"
                    }
                }
            }
        }
    });


    // Distance Chart
    const distanceCanvas =
        document.getElementById("distanceChart");

    distanceChart = new Chart(distanceCanvas, {
        type: "line",

        data: {
            labels: labels,

            datasets: [{
                label: "Obstacle Distance (m)",
                data: distances,

                borderWidth: 2,
                pointRadius: 0,
                tension: 0.2
            }]
        },

        options: {
            responsive: true,

            interaction: {
                mode: "index",
                intersect: false
            },

            scales: {
                x: {
                    ticks: {
                        maxTicksLimit: 10
                    }
                },

                y: {
                    title: {
                        display: true,
                        text: "Distance (m)"
                    }
                }
            },

            plugins: {
                legend: {
                    display: false
                },

                zoom: {
                    pan: {
                        enabled: true,
                        mode: "x",
                        modifierKey: "shift"
                    },

                    zoom: {
                        wheel: {
                            enabled: true
                        },

                        pinch: {
                            enabled: true
                        },

                        drag: {
                            enabled: true
                        },

                        mode: "x"
                    }
                }
            }
        }
    });


    // Zoom buttons
    setupZoomControls(
        speedChart,
        "speedZoomIn",
        "speedZoomOut",
        "speedZoomReset"
    );

    setupZoomControls(
        distanceChart,
        "distanceZoomIn",
        "distanceZoomOut",
        "distanceZoomReset"
    );
}


function setupZoomControls(
    chart,
    zoomInId,
    zoomOutId,
    resetId
) {
    const zoomIn = document.getElementById(zoomInId);
    const zoomOut = document.getElementById(zoomOutId);
    const reset = document.getElementById(resetId);

    if (zoomIn) {
        zoomIn.onclick = () => {
            chart.zoom(1.25);
        };
    }

    if (zoomOut) {
        zoomOut.onclick = () => {
            chart.zoom(0.8);
        };
    }

    if (reset) {
        reset.onclick = () => {
            chart.resetZoom();
        };
    }
}


// Apply filters
document.getElementById("applyFilters")
    .addEventListener("click", loadDashboard);


// Reset filters
document.getElementById("resetFilters")
    .addEventListener("click", () => {

        document.getElementById("brakeStatus").value = "all";
        document.getElementById("startDate").value = "";
        document.getElementById("endDate").value = "";

        loadDashboard();
    });


// Initial load
loadDashboard();
