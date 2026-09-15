let speedChart = null;
let distanceChart = null;


// ==========================================
// HELPER
// ==========================================

function getElement(id) {
    return document.getElementById(id);
}


function formatNumber(value) {

    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(Number(value))
    ) {
        return "--";
    }

    return Number(value).toFixed(2);
}


// ==========================================
// GET FILTERS
// ==========================================

function getFilters() {

    const params = new URLSearchParams();

    const brakeStatus =
        getElement("brakeStatus").value;

    const start =
        getElement("startDate").value;

    const end =
        getElement("endDate").value;


    if (brakeStatus !== "all") {

        params.set(
            "brake_status",
            brakeStatus
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
// FETCH DATA
// ==========================================

async function fetchJSON(url) {

    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            `HTTP ${response.status}`
        );

    }


    return await response.json();

}


// ==========================================
// CHART OPTIONS
// ==========================================

function getChartOptions(yAxisTitle) {

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

                    text: yAxisTitle,

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

function createCharts(rows) {

    const labels =
        rows.map(
            row =>
                new Date(
                    row.timestamp
                ).toLocaleString()
        );


    const speeds =
        rows.map(
            row =>
                Number(row.speed)
        );


    const distances =
        rows.map(
            row =>
                Number(
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

        getElement("speedChart"),

        {

            type: "line",


            data: {

                labels: labels,

                datasets: [

                    {

                        label:
                            "Vehicle Speed",

                        data:
                            speeds,

                        borderWidth:
                            2,

                        pointRadius:
                            0,

                        pointHoverRadius:
                            5,

                        tension:
                            0.25

                    }

                ]

            },


            options:
                getChartOptions(
                    "Speed (m/s)"
                )

        }

    );


    // ==================================
    // DISTANCE CHART
    // ==================================

    distanceChart = new Chart(

        getElement("distanceChart"),

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

                        pointHoverRadius:
                            5,

                        tension:
                            0.25

                    }

                ]

            },


            options:
                getChartOptions(
                    "Distance (m)"
                )

        }

    );

}


// ==========================================
// ZOOM BUTTONS
// ==========================================

function setupZoomButtons() {


    // SPEED ZOOM IN

    getElement("speedZoomIn")
        .onclick = function () {

            if (speedChart) {

                speedChart.zoom(1.25);

            }

        };


    // SPEED ZOOM OUT

    getElement("speedZoomOut")
        .onclick = function () {

            if (speedChart) {

                speedChart.zoom(0.8);

            }

        };


    // SPEED RESET

    getElement("speedZoomReset")
        .onclick = function () {

            if (speedChart) {

                speedChart.resetZoom();

            }

        };


    // DISTANCE ZOOM IN

    getElement("distanceZoomIn")
        .onclick = function () {

            if (distanceChart) {

                distanceChart.zoom(1.25);

            }

        };


    // DISTANCE ZOOM OUT

    getElement("distanceZoomOut")
        .onclick = function () {

            if (distanceChart) {

                distanceChart.zoom(0.8);

            }

        };


    // DISTANCE RESET

    getElement("distanceZoomReset")
        .onclick = function () {

            if (distanceChart) {

                distanceChart.resetZoom();

            }

        };

}


// ==========================================
// LOAD DASHBOARD
// ==========================================

async function loadDashboard() {

    try {

        const query =
            getFilters();


        const suffix =
            query
                ? `?${query}`
                : "";


        // Load both APIs

        const [
            summary,
            telemetry
        ] = await Promise.all([

            fetchJSON(
                `/api/summary${suffix}`
            ),

            fetchJSON(
                `/api/telemetry${suffix}`
            )

        ]);


        // ==================================
        // SUMMARY CARDS
        // ==================================

        getElement(
            "currentSpeed"
        ).textContent =

            `${formatNumber(
                summary.latest_speed
            )} m/s`;


        getElement(
            "minDistance"
        ).textContent =

            `${formatNumber(
                summary.minimum_obstacle_distance
            )} m`;


        getElement(
            "recordCount"
        ).textContent =

            summary.records;


        getElement(
            "brakingEvents"
        ).textContent =

            summary.braking_events;


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


        getElement(
            "currentSpeed"
        ).textContent =
            "--";


        getElement(
            "minDistance"
        ).textContent =
            "--";


        getElement(
            "recordCount"
        ).textContent =
            "--";


        getElement(
            "brakingEvents"
        ).textContent =
            "--";

    }

}


// ==========================================
// APPLY FILTERS
// ==========================================

getElement(
    "applyFilters"
).addEventListener(
    "click",
    function () {

        loadDashboard();

    }
);


// ==========================================
// RESET FILTERS
// ==========================================

getElement(
    "resetFilters"
).addEventListener(
    "click",
    function () {

        getElement(
            "brakeStatus"
        ).value = "all";


        getElement(
            "startDate"
        ).value = "";


        getElement(
            "endDate"
        ).value = "";


        loadDashboard();

    }
);


// ==========================================
// START
// ==========================================

setupZoomButtons();

loadDashboard();
