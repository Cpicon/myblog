/**
 * Neural Network Flow Visualization
 * Animated visualization showing data flowing through network layers
 */

(function() {
    'use strict';

    const canvas = document.getElementById('nn-canvas');
    if (!canvas) return;

    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];
    let time = 0;

    // Network configuration
    const config = {
        layers: [4, 8, 12, 8, 4],  // neurons per layer
        layerSpacing: 0,  // calculated dynamically
        neuronRadius: 8,
        particleSpeed: 2,
        particleSize: 3,
        connectionOpacity: 0.15,
        activeConnectionOpacity: 0.6,
        colors: {
            neuron: '#00d4ff',
            neuronActive: '#00ff88',
            connection: '#00d4ff',
            particle: '#00ff88',
            particleTrail: '#8b5cf6'
        }
    };

    // Resize canvas
    function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        config.layerSpacing = canvas.width / (config.layers.length + 1);
    }

    // Get neuron positions
    function getNeuronPositions() {
        const positions = [];
        for (let l = 0; l < config.layers.length; l++) {
            const layerPositions = [];
            const x = (l + 1) * config.layerSpacing;
            const neuronCount = config.layers[l];
            const spacing = canvas.height / (neuronCount + 1);

            for (let n = 0; n < neuronCount; n++) {
                layerPositions.push({
                    x: x,
                    y: (n + 1) * spacing,
                    activation: 0
                });
            }
            positions.push(layerPositions);
        }
        return positions;
    }

    // Create a particle flowing through the network
    function createParticle(neurons) {
        const startLayer = 0;
        const startNeuron = Math.floor(Math.random() * neurons[0].length);

        return {
            layer: startLayer,
            neuronIndex: startNeuron,
            x: neurons[0][startNeuron].x,
            y: neurons[0][startNeuron].y,
            targetX: 0,
            targetY: 0,
            progress: 0,
            speed: config.particleSpeed + Math.random() * 1,
            color: Math.random() > 0.5 ? config.colors.particle : config.colors.particleTrail,
            trail: []
        };
    }

    // Update particle position
    function updateParticle(particle, neurons) {
        if (particle.layer >= neurons.length - 1) {
            // Reset particle to start
            particle.layer = 0;
            particle.neuronIndex = Math.floor(Math.random() * neurons[0].length);
            particle.x = neurons[0][particle.neuronIndex].x;
            particle.y = neurons[0][particle.neuronIndex].y;
            particle.progress = 0;
            particle.trail = [];
            return;
        }

        if (particle.progress === 0) {
            // Choose random target neuron in next layer
            const nextLayer = neurons[particle.layer + 1];
            const targetIndex = Math.floor(Math.random() * nextLayer.length);
            particle.targetX = nextLayer[targetIndex].x;
            particle.targetY = nextLayer[targetIndex].y;
            particle.targetIndex = targetIndex;
        }

        // Store trail position
        particle.trail.push({ x: particle.x, y: particle.y });
        if (particle.trail.length > 10) {
            particle.trail.shift();
        }

        // Move towards target
        particle.progress += particle.speed / 100;

        if (particle.progress >= 1) {
            particle.layer++;
            particle.neuronIndex = particle.targetIndex;
            particle.x = particle.targetX;
            particle.y = particle.targetY;
            particle.progress = 0;

            // Activate target neuron
            if (neurons[particle.layer]) {
                neurons[particle.layer][particle.neuronIndex].activation = 1;
            }
        } else {
            // Interpolate position with easing
            const ease = particle.progress * particle.progress * (3 - 2 * particle.progress);
            const startX = neurons[particle.layer][particle.neuronIndex].x;
            const startY = neurons[particle.layer][particle.neuronIndex].y;
            particle.x = startX + (particle.targetX - startX) * ease;
            particle.y = startY + (particle.targetY - startY) * ease;
        }
    }

    // Draw connections between layers
    function drawConnections(neurons) {
        ctx.lineWidth = 1;

        for (let l = 0; l < neurons.length - 1; l++) {
            for (let n1 = 0; n1 < neurons[l].length; n1++) {
                for (let n2 = 0; n2 < neurons[l + 1].length; n2++) {
                    const from = neurons[l][n1];
                    const to = neurons[l + 1][n2];

                    // Vary opacity based on activation
                    const opacity = config.connectionOpacity +
                        (from.activation * 0.3) + (to.activation * 0.3);

                    ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
                    ctx.beginPath();
                    ctx.moveTo(from.x, from.y);
                    ctx.lineTo(to.x, to.y);
                    ctx.stroke();
                }
            }
        }
    }

    // Draw neurons
    function drawNeurons(neurons) {
        for (let l = 0; l < neurons.length; l++) {
            for (let n = 0; n < neurons[l].length; n++) {
                const neuron = neurons[l][n];

                // Decay activation
                neuron.activation *= 0.95;

                // Glow effect for active neurons
                if (neuron.activation > 0.1) {
                    const gradient = ctx.createRadialGradient(
                        neuron.x, neuron.y, 0,
                        neuron.x, neuron.y, config.neuronRadius * 3
                    );
                    gradient.addColorStop(0, `rgba(0, 255, 136, ${neuron.activation * 0.5})`);
                    gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(neuron.x, neuron.y, config.neuronRadius * 3, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Neuron circle
                const color = neuron.activation > 0.1 ? config.colors.neuronActive : config.colors.neuron;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(neuron.x, neuron.y, config.neuronRadius, 0, Math.PI * 2);
                ctx.fill();

                // Neuron border
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
    }

    // Draw particles
    function drawParticles() {
        for (const particle of particles) {
            // Draw trail
            for (let i = 0; i < particle.trail.length; i++) {
                const alpha = i / particle.trail.length * 0.5;
                ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
                ctx.beginPath();
                ctx.arc(particle.trail[i].x, particle.trail[i].y, config.particleSize * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw particle
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, config.particleSize, 0, Math.PI * 2);
            ctx.fill();

            // Glow
            const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, config.particleSize * 4
            );
            gradient.addColorStop(0, `rgba(0, 255, 136, 0.3)`);
            gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, config.particleSize * 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw layer labels
    function drawLabels(neurons) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px JetBrains Mono, monospace';
        ctx.textAlign = 'center';

        const labels = ['Input', 'Hidden', 'Hidden', 'Hidden', 'Output'];
        for (let l = 0; l < neurons.length; l++) {
            const x = neurons[l][0].x;
            ctx.fillText(labels[l] || 'Hidden', x, 25);
        }
    }

    // Main animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const neurons = getNeuronPositions();

        // Update particles
        for (const particle of particles) {
            updateParticle(particle, neurons);
        }

        // Draw everything
        drawConnections(neurons);
        drawNeurons(neurons);
        drawParticles();
        drawLabels(neurons);

        time++;
        animationId = requestAnimationFrame(animate);
    }

    // Initialize
    function init() {
        resize();

        const neurons = getNeuronPositions();

        // Create initial particles
        for (let i = 0; i < 8; i++) {
            const p = createParticle(neurons);
            p.layer = Math.floor(Math.random() * (neurons.length - 1));
            p.neuronIndex = Math.floor(Math.random() * neurons[p.layer].length);
            p.x = neurons[p.layer][p.neuronIndex].x;
            p.y = neurons[p.layer][p.neuronIndex].y;
            particles.push(p);
        }

        animate();
    }

    // Handle resize
    window.addEventListener('resize', () => {
        resize();
        particles = [];
        const neurons = getNeuronPositions();
        for (let i = 0; i < 8; i++) {
            particles.push(createParticle(neurons));
        }
    });

    // Start
    init();

})();
