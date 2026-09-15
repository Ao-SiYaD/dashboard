let speedChart = null;
let distanceChart = null;


async function loadDashboard() {

    const params = new URLSearchParams();


    // Brake filter

    const brakeStatus =
        document.getElementById("brakeStatus").value;


    if (brakeStatus !== "all") {

        params.append(
            "brake_status",
            brakeStatus
        );

    }


    // Start date

    const start =
        document.getElementById("startDate").value;


    if (start) {

        params.append(
            "start",
            new Date(start).toISOString()
        );

    }


    // End date

    const end =
        document.getElementById("endDate").value;


    if (end) {

        params.append(
            "end",
            new Date(end).toISOString()
        );

    }


    try {

        const response =
            await fetch(
                `/api/summary?${params.toString()}`
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load dashboard data"
            );

        }


        const data =
            await response.json();


        // ==================================
        // UPDATE SUMMARY CARDS
        // ==================================

        document.getElementById(
            "currentSpeed"
        ).textContent =
            `${Number(data.current_speed).toFixed(2)} m/s`;


        document.getElementById(
            "minDistance"
        ).textContent =
            `${Number(data.min_obstacle_distance).toFixed(2)} m`;


        document.getElementById(
            "recordCount"
        ).textContent =
            data.records;


        document.getElementById(
            "brakingEvents"
        ).textContent =
            data.braking_events;


        // ==================================
        // CREATE CHARTS
        // ==================================

        createCharts(data.telemetry);

    }

    catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

}


function createCharts(data) {



    const labels =
        data.map(
            item => item.timestamp
        );


    const speeds =
        data.map(
            item => Number(item.speed)
        );


    const distances =
        data.map(
            item => Number(
                item.obstacle_distance
            )
        );



    if (speedChart) {

        speedChart.destroy();

        speedChart = null;

    }


    if (distanceChart) {

        distanceChart.destroy();

        distanceChart = null;

    }



    const speedCanvas =
        document.getElementById(
            "speedChart"
        );


    speedChart =
        new Chart(
            speedCanvas,
            {

                type: "line",


                data: {

                    labels: labels,


                    datasets: [

                        {

                            label:
                                "Speed (m/s)",

                            data:
                                speeds,

                            borderWidth:
                                2,

                            pointRadius:
                                0,

                            pointHoverRadius:
                                4,

                            tension:
                                0.2

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,


                    interaction: {

                        mode:
                            "index",

                        intersect:
                            false

                    },


                    scales: {

                        x: {

                            ticks: {

                                maxTicksLimit:
                                    10

                            }

                        },


                        y: {

                            title: {

                                display:
                                    true,

                                text:
                                    "Speed (m/s)"

                            }

                        }

                    },


                    plugins: {

                        legend: {

                            display:
                                false

                        },


                        zoom: {

                            pan: {

                                enabled:
                                    true,

                                mode:
                                    "x"

                            },


                            zoom: {

                                wheel: {

                                    enabled:
                                        true

                                },


                                pinch: {

                                    enabled:
                                        true

                                },


                                drag: {

                                    enabled:
                                        true

                                },


                                mode:
                                    "x"

                            }

                        }

                    }

                }

            }
        );



    const distanceCanvas =
        document.getElementById(
            "distanceChart"
        );


    distanceChart =
        new Chart(
            distanceCanvas,
            {

                type: "line",


                data: {

                    labels: labels,


                    datasets: [

                        {

                            label:
                                "Obstacle Distance (m)",

                            data:
                                distances,

                            borderWidth:
                                2,

                            pointRadius:
                                0,

                            pointHoverRadius:
                                4,

                            tension:
                                0.2

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,


                    interaction: {

                        mode:
                            "index",

                        intersect:
                            false

                    },


                    scales: {

                        x: {

                            ticks: {

                                maxTicksLimit:
                                    10

                            }

                        },


                        y: {

                            title: {

                                display:
                                    true,

                                text:
                                    "Distance (m)"

                            }

                        }

                    },


                    plugins: {

                        legend: {

                            display:
                                false

                        },


                        zoom: {

                            pan: {

                                enabled:
                                    true,

                                mode:
                                    "x"

                            },


                            zoom: {

                                wheel: {

                                    enabled:
                                        true

                                },


                                pinch: {

                                    enabled:
                                        true

                                },


                                drag: {

                                    enabled:
                                        true

                                },


                                mode:
                                    "x"

                            }

                        }

                    }

                }

            }
        );



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

    const zoomIn =
        document.getElementById(
            zoomInId
        );


    const zoomOut =
        document.getElementById(
            zoomOutId
        );


    const reset =
        document.getElementById(
            resetId
        );


    // Zoom IN

    if (zoomIn) {

        zoomIn.onclick = function () {

            chart.zoom(1.25);

        };

    }


    // Zoom OUT

    if (zoomOut) {

        zoomOut.onclick = function () {

            chart.zoom(0.8);

        };

    }


    // RESET

    if (reset) {

        reset.onclick = function () {

            chart.resetZoom();

        };

    }

}


document
    .getElementById("applyFilters")
    .addEventListener(
        "click",
        function () {

            loadDashboard();

        }
    );


document
    .getElementById("resetFilters")
    .addEventListener(
        "click",
        function () {

            document.getElementById(
                "brakeStatus"
            ).value = "all";


            document.getElementById(
                "startDate"
            ).value = "";


            document.getElementById(
                "endDate"
            ).value = "";


            loadDashboard();

        }
    );


loadDashboard();
