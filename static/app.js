let speedChart = null;
let distanceChart = null;


// ==========================================
// HELPER
// ==========================================

const $ = (id) => document.getElementById(id);


function formatNumber(value, digits = 2) {

    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(Number(value))
    ) {
        return "—";
    }

    return Number(value).toFixed(digits);
}


// ==========================================
// BUILD QUERY STRING
// ==========================================

function queryString() {

    const params = new URLSearchParams();

    const brake = $("brakeStatus").value;
    const start = $("startTime").value;
    const end = $("endTime").value;


    if (brake !== "all") {

        params.set(
            "brake_status",
            brake
        );

    }


    if (start) {

        params.set(
            "start",
            new Date(start).toISOString()
        );

    }


    if (end) {

        params.set(
            "end",
            new Date(end).toISOString()
        );

    }


    return params.toString();
}


// ==========================================
// FETCH JSON
// ==========================================

async function fetchJson(url) {

    const response = await fetch(url);


    if (!response.ok) {

        const text = await response.text();

        throw new Error(
            text || `HTTP ${response.status}`
        );

    }


    return response.json();
}


// ==========================================
// CHART OPTIONS
// ==========================================

function chartOptions(yTitle) {

    return {

        responsive: true,

        maintainAspectRatio: false,


        interaction: {

            mode: "index",

            intersect: false

        },


        plugins: {

            legend: {

                display: false

            },


            zoom: {

                pan: {

                    enabled: true,

                    mode: "x"

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

        },


        scales: {

            x: {

                ticks: {

                    color: "#8d9ab2",

                    maxTicksLimit: 8

                },


                grid: {

                    color:
                        "rgba(141,154,178,.10)"

                }

            },


            y: {

                title: {

                    display: true,

                    text: yTitle,

                    color: "#8d9ab2"

                },


                ticks: {

                    color: "#8d9ab2"

                },


                grid: {

                    color:
                        "rgba(141,154,178,.10)"

                }

            }

        }

    };

}


// ==========================================
// UPDATE CHARTS
// ==========================================

function updateCharts(rows) {

    const labels = rows.map(
        row => new Date(
            row.timestamp
        ).toLocaleString()
    );


    const speeds = rows.map(
        row => Number(row.speed)
    );


    const distances = rows.map(
        row => Number(
            row.obstacle_distance
        )
    );


    // Destroy previous charts

    if (speedChart) {

        speedChart.destroy();

        speedChart = null;

    }


    if (distanceChart) {

        distanceChart.destroy();

        distanceChart = null;

    }


    // ==================================
    // SPEED CHART
    // ==================================

    speedChart = new Chart(
        $("speedChart"),
        {

            type: "line",


            data: {

                labels: labels,


                datasets: [

                    {

                        label: "Speed",

                        data: speeds,

                        borderWidth: 2,

                        pointRadius: 0,

                        pointHoverRadius: 4,

                        tension: 0.2

                    }

                ]

            },


            options:
                chartOptions(
                    "Speed (m/s)"
                )

        }
    );


    addZoomControls(
        "speedChart",
        speedChart
    );


    // ==================================
    // DISTANCE CHART
    // ==================================

    distanceChart = new Chart(
        $("distanceChart"),
        {

            type: "line",


            data: {

                labels: labels,


                datasets: [

                    {

                        label:
                            "Obstacle distance",

                        data:
                            distances,

                        borderWidth: 2,

                        pointRadius: 0,

                        pointHoverRadius: 4,

                        tension: 0.2

                    }

                ]

            },


            options:
                chartOptions(
                    "Distance (m)"
                )

        }
    );


    addZoomControls(
        "distanceChart",
        distanceChart
    );

}


// ==========================================
// ZOOM CONTROLS
// ==========================================

function addZoomControls(
    canvasId,
    chart
) {

    const canvas = $(canvasId);

    const wrap =
        canvas.closest(".chart-wrap");


    if (!wrap) {
        return;
    }


    // Remove old controls

    const old =
        wrap.querySelector(
            ".zoom-controls"
        );


    if (old) {
        old.remove();
    }


    // Container

    const controls =
        document.createElement("div");


    controls.className =
        "zoom-controls";


    // Hint

    const hint =
        document.createElement("span");


    hint.className =
        "zoom-hint";


    hint.textContent =
        "Wheel / pinch: zoom";


    // Button group

    const group =
        document.createElement("span");


    group.className =
        "zoom-buttons";


    // Zoom out

    const minus =
        document.createElement("button");


    minus.type = "button";

    minus.textContent = "−";

    minus.title = "Zoom out";

    minus.setAttribute(
        "aria-label",
        "Zoom out"
    );


    minus.addEventListener(
        "click",
        () => {

            chart.zoom(0.8);

        }
    );


    // Reset

    const reset =
        document.createElement("button");


    reset.type = "button";

    reset.textContent = "Reset";

    reset.title = "Reset zoom";


    reset.addEventListener(
        "click",
        () => {

            chart.resetZoom();

        }
    );


    // Zoom in

    const plus =
        document.createElement("button");


    plus.type = "button";

    plus.textContent = "+";

    plus.title = "Zoom in";

    plus.setAttribute(
        "aria-label",
        "Zoom in"
    );


    plus.addEventListener(
        "click",
        () => {

            chart.zoom(1.25);

        }
    );


    group.append(
        minus,
        reset,
        plus
    );


    controls.append(
        hint,
        group
    );


    wrap.appendChild(
        controls
    );

}


// ==========================================
// LOAD DASHBOARD
// ==========================================

async function loadDashboard() {

    const qs =
        queryString();


    const suffix =
        qs
            ? `?${qs}`
            : "";


    $("filterMessage").textContent =
        "Loading telemetry…";


    try {

        const [
            summary,
            rows
        ] = await Promise.all([

            fetchJson(
                `/api/summary${suffix}`
            ),

            fetchJson(
                `/api/telemetry${suffix}`
            )

        ]);


        // ==================================
        // IMPORTANT:
        // These names MUST match main.py
        // ==================================

        $("latestSpeed").textContent =
            formatNumber(
                summary.latest_speed
            );


        $("minDistance").textContent =
            formatNumber(
                summary.minimum_obstacle_distance
            );


        $("records").textContent =
            summary.records;


        $("brakingEvents").textContent =
            summary.braking_events;


        // Charts

        updateCharts(rows);


        // Filter information

        $("filterMessage").textContent =
            `${summary.records} telemetry points match the selected filters.`;

    }


    catch (error) {

        console.error(
            "Dashboard error:",
            error
        );


        $("filterMessage").textContent =
            "Could not load telemetry. Check the CSV format and server logs.";

    }

}


// ==========================================
// DATASET METADATA
// ==========================================

async function loadMetadata() {

    try {

        const meta =
            await fetchJson(
                "/api/metadata"
            );


        $("datasetInfo").textContent =
            `${meta.rows} rows · ${meta.start} → ${meta.end} · speed: ${meta.speed_unit} · distance: ${meta.distance_unit}`;

    }


    catch (error) {

        console.error(
            "Metadata error:",
            error
        );


        $("datasetInfo").textContent =
            "Dataset information unavailable.";

    }

}


// ==========================================
// APPLY FILTERS
// ==========================================

$("applyBtn").addEventListener(
    "click",
    loadDashboard
);


// ==========================================
// RESET FILTERS
// ==========================================

$("resetBtn").addEventListener(
    "click",
    () => {

        $("brakeStatus").value =
            "all";


        $("startTime").value =
            "";


        $("endTime").value =
            "";


        loadDashboard();

    }
);


// ==========================================
// INITIAL LOAD
// ==========================================

loadMetadata();

loadDashboard();
