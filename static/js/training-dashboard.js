/**
 * Training Dashboard Visualization
 * Animated training metrics showing loss curves and accuracy
 */

(function() {
    'use strict';

    // Check for Chart.js
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded');
        return;
    }

    // Check for reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const lossCanvas = document.getElementById('loss-chart');
    const accuracyCanvas = document.getElementById('accuracy-chart');

    if (!lossCanvas || !accuracyCanvas) return;

    // Chart.js global config
    Chart.defaults.color = '#8888a0';
    Chart.defaults.borderColor = 'rgba(0, 212, 255, 0.1)';
    Chart.defaults.font.family = "'JetBrains Mono', monospace";

    // Generate realistic training data
    function generateTrainingData(epochs) {
        const trainLoss = [];
        const valLoss = [];
        const trainAcc = [];
        const valAcc = [];

        let tLoss = 2.5 + Math.random() * 0.5;
        let vLoss = 2.8 + Math.random() * 0.5;
        let tAcc = 0.1 + Math.random() * 0.1;
        let vAcc = 0.08 + Math.random() * 0.1;

        for (let i = 0; i < epochs; i++) {
            // Loss decreases with noise
            tLoss = Math.max(0.05, tLoss * (0.92 + Math.random() * 0.05) - 0.02);
            vLoss = Math.max(0.1, vLoss * (0.93 + Math.random() * 0.06) - 0.015);

            // Accuracy increases with noise
            tAcc = Math.min(0.99, tAcc + (1 - tAcc) * (0.08 + Math.random() * 0.04));
            vAcc = Math.min(0.97, vAcc + (1 - vAcc) * (0.06 + Math.random() * 0.04));

            trainLoss.push(tLoss);
            valLoss.push(vLoss + (i > epochs * 0.7 ? (i - epochs * 0.7) * 0.01 : 0)); // Slight overfitting
            trainAcc.push(tAcc * 100);
            valAcc.push(vAcc * 100);
        }

        return { trainLoss, valLoss, trainAcc, valAcc };
    }

    const totalEpochs = 50;
    const data = generateTrainingData(totalEpochs);
    let currentEpoch = 0;

    // Loss Chart
    const lossChart = new Chart(lossCanvas, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Training Loss',
                    data: [],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                },
                {
                    label: 'Validation Loss',
                    data: [],
                    borderColor: '#ff0080',
                    backgroundColor: 'rgba(255, 0, 128, 0.05)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 300
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: 'Loss Curve',
                    color: '#e0e0e4',
                    font: {
                        size: 14,
                        weight: 'normal'
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Epoch'
                    },
                    grid: {
                        color: 'rgba(0, 212, 255, 0.05)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Loss'
                    },
                    min: 0,
                    grid: {
                        color: 'rgba(0, 212, 255, 0.05)'
                    }
                }
            }
        }
    });

    // Accuracy Chart
    const accuracyChart = new Chart(accuracyCanvas, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Training Accuracy',
                    data: [],
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                },
                {
                    label: 'Validation Accuracy',
                    data: [],
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.05)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 300
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: 'Accuracy',
                    color: '#e0e0e4',
                    font: {
                        size: 14,
                        weight: 'normal'
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Epoch'
                    },
                    grid: {
                        color: 'rgba(0, 212, 255, 0.05)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Accuracy (%)'
                    },
                    min: 0,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 212, 255, 0.05)'
                    }
                }
            }
        }
    });

    // Animate the training progress
    function updateCharts() {
        if (currentEpoch >= totalEpochs) {
            // Reset after completion
            setTimeout(() => {
                currentEpoch = 0;
                lossChart.data.labels = [];
                lossChart.data.datasets[0].data = [];
                lossChart.data.datasets[1].data = [];
                accuracyChart.data.labels = [];
                accuracyChart.data.datasets[0].data = [];
                accuracyChart.data.datasets[1].data = [];
                lossChart.update('none');
                accuracyChart.update('none');

                // Generate new data for variety
                const newData = generateTrainingData(totalEpochs);
                data.trainLoss = newData.trainLoss;
                data.valLoss = newData.valLoss;
                data.trainAcc = newData.trainAcc;
                data.valAcc = newData.valAcc;

                setTimeout(updateCharts, 1000);
            }, 3000);
            return;
        }

        // Add new data point
        lossChart.data.labels.push(currentEpoch + 1);
        lossChart.data.datasets[0].data.push(data.trainLoss[currentEpoch]);
        lossChart.data.datasets[1].data.push(data.valLoss[currentEpoch]);

        accuracyChart.data.labels.push(currentEpoch + 1);
        accuracyChart.data.datasets[0].data.push(data.trainAcc[currentEpoch]);
        accuracyChart.data.datasets[1].data.push(data.valAcc[currentEpoch]);

        lossChart.update();
        accuracyChart.update();

        currentEpoch++;

        // Update epoch counter
        const epochCounter = document.getElementById('epoch-counter');
        if (epochCounter) {
            epochCounter.textContent = `Epoch ${currentEpoch}/${totalEpochs}`;
        }

        // Update metrics
        const lossValue = document.getElementById('current-loss');
        const accValue = document.getElementById('current-accuracy');
        if (lossValue) {
            lossValue.textContent = data.trainLoss[currentEpoch - 1].toFixed(4);
        }
        if (accValue) {
            accValue.textContent = data.trainAcc[currentEpoch - 1].toFixed(1) + '%';
        }

        // Variable speed - faster at start, slower as it converges
        const delay = 100 + currentEpoch * 2;
        setTimeout(updateCharts, delay);
    }

    // Start animation when visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                updateCharts();
                observer.disconnect();
            }
        });
    }, { threshold: 0.2 });

    observer.observe(lossCanvas);

})();
