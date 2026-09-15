let speedChart = null;
let distanceChart = null;


// ==========================================
// ELEMENT HELPER
// ==========================================

function el(id) {
    return document.getElementById(id);
}


// ==========================================
// NUMBER FORMATTER
// ==========================================

function numberValue(value) {

    const n = Number(value);

    if (!Number.isFinite(n)) {
        return "--";
    }

    return n.toFixed(2);
}


// ==========================================
// GET FILTERS
// ==========================================

function getFilterQuery() {

    const params = new URLSearchParams();


    const brake =
        el("brakeStatus").value;


    const start =
        el("startDate").value;


    const end =
        el("endDate").value;


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
// FETCH
// ==========================================

async function getJSON(url) {

    const response =
        await fetch(
            url,
            {
                cache: "no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            `Request failed: ${response.status}`
        );

    }


    return await response.json();

}


// ==========================================
// TELEMETRY ARRAY
// ==========================================

function getTelemetryArray(data) {

    if (Array.isArray(data)) {
        return data;
    }


    if (
        data &&
        Array.isArray(data.telemetry)
    ) {
        return data.telemetry;
    }


    if (
        data &&
        Array.isArray(data.data)
    ) {
        return data.data;
    }


    if (
        data &&
        Array.isArray(data.records)
    ) {
        return data.records;
    }


    return [];

}


// ==========================================
// CHART OPTIONS
// ==========================================

function chartOptions(title) {

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

                        enabled: false

                    },


                    mode: "x"

                }

            }

        },


        scales: {

            x: {

                ticks: {

                    color: "#8d9ab2",

                    maxTicksLimit: 10

                },

                grid: {

                    color:
                        "rgba(141,154,178,0.10)"

                }

            },


            y: {

                title: {

                    display: true,

                    text: title,

                    color: "#8d9ab2"

                },

                ticks: {

                    color: "#8d9ab2"

                },

                grid: {

                    color:
                        "rgba(141,154,178,0.10)"

                }

            }

        }

    };

}


// ==========================================
// CREATE CHARTS
// ==========================================

function createCharts(data) {

    if (!Array.isArray(data)) {
        data = [];
    }


    const labels =
        data.map(
            row =>
                new Date(
                    row.timestamp
                ).toLocaleString()
        );


    const speeds =
        data.map(
            row =>
                Number(row.speed)
        );


    const distances =
        data.map(
            row =>
                Number(
                    row.obstacle_distance
                )
        );


    // Destroy old charts

    if (speedChart) {

        speedChart.destroy();

        speedChart = null;

    }


    if (distanceChart) {

        distanceChart.destroy();

        distanceChart = null;

    }


    // ======================================
    // SPEED
    // ======================================

    speedChart = new Chart(

        el("speedChart"),

        {

            type: "line",


            data: {

                labels: labels,

                datasets: [

                    {

                        label:
                            "Speed",

                        data:
                            speeds,

                        borderWidth:
                            2,

                        pointRadius:
                            0,

                        tension:
                            0.2

                    }

                ]

            },


            options:
                chartOptions(
                    "Speed (m/s)"
                )

        }

    );


    // ======================================
    // DISTANCE
    // ======================================

    distanceChart = new Chart(

        el("distanceChart"),

        {

            type: "line",


            data: {

                labels: labels,

                datasets: [

                    {

                        label:
                            "Obstacle Distance",

                        data:
                            distances,

                        borderWidth:
                            2,

                        pointRadius:
                            0,

                        tension:
                            0.2

                    }

                ]

            },


            options:
                chartOptions(
                    "Distance (m)"
                )

        }

    );

}


// ==========================================
// LOAD DASHBOARD
// ==========================================

async function loadDashboard() {

    try {

        const query =
            getFilterQuery();


        const suffix =
            query
                ? `?${query}`
                : "";


        const summary =
            await getJSON(
                `/api/summary${suffix}`
            );


        const telemetryResponse =
            await getJSON(
                `/api/telemetry${suffix}`
            );


        const telemetry =
            getTelemetryArray(
                telemetryResponse
            );


        console.log(
            "SUMMARY:",
            summary
        );


        console.log(
            "TELEMETRY:",
            telemetry
        );


        // ==================================
        // SUPPORT MULTIPLE BACKEND NAMES
        // ==================================

        const latestSpeed =
            summary.latest_speed ??
            summary.current_speed ??
            summary.speed;


        const minimumDistance =
            summary.minimum_obstacle_distance ??
            summary.min_obstacle_distance ??
            summary.min_distance;


        const records =
            summary.records ??
            summary.total_records ??
            telemetry.length;


        const brakingEvents =
            summary.braking_events ??
            summary.brakes_applied ??
            0;


        // ==================================
        // CARDS
        // ==================================

        el("currentSpeed").textContent =
            `${numberValue(latestSpeed)} m/s`;


        el("minDistance").textContent =
            `${numberValue(minimumDistance)} m`;


        el("recordCount").textContent =
            records;


        el("brakingEvents").textContent =
            brakingEvents;


        // ==================================
        // CHARTS
        // ==================================

        createCharts(
            telemetry
        );

    }


    catch (error) {

        console.error(
            "Dashboard error:",
            error
        );


        el("currentSpeed").textContent =
            "--";


        el("minDistance").textContent =
            "--";


        el("recordCount").textContent =
            "--";


        el("brakingEvents").textContent =
            "--";

    }

}


// ==========================================
// ZOOM BUTTONS
// ==========================================

el("speedZoomIn").onclick =
    function () {

        if (speedChart) {

            speedChart.zoom(1.25);

        }

    };


el("speedZoomOut").onclick =
    function () {

        if (speedChart) {

            speedChart.zoom(0.8);

        }

    };


el("speedZoomReset").onclick =
    function () {

        if (speedChart) {

            speedChart.resetZoom();

        }

    };


el("distanceZoomIn").onclick =
    function () {

        if (distanceChart) {

            distanceChart.zoom(1.25);

        }

    };


el("distanceZoomOut").onclick =
    function () {

        if (distanceChart) {

            distanceChart.zoom(0.8);

        }

    };


el("distanceZoomReset").onclick =
    function () {

        if (distanceChart) {

            distanceChart.resetZoom();

        }

    };


// ==========================================
// FILTER BUTTONS
// ==========================================

el("applyFilters").onclick =
    function () {

        loadDashboard();

    };


el("resetFilters").onclick =
    function () {

        el("brakeStatus").value =
            "all";


        el("startDate").value =
            "";


        el("endDate").value =
            "";


        loadDashboard();

    };


// ==========================================
// START
// ==========================================

loadDashboard();
