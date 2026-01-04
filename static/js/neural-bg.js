/**
 * Neural Network Background Animation
 * Creates an interactive particle network that responds to mouse movement
 * Using Three.js for WebGL rendering
 */

(function() {
    'use strict';

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        console.log('Neural animation disabled: prefers-reduced-motion');
        return;
    }

    // Check if canvas exists
    const canvas = document.getElementById('neural-canvas');
    if (!canvas) return;

    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.warn('Three.js not loaded');
        return;
    }

    // Configuration
    const CONFIG = {
        particleCount: 100,
        connectionDistance: 150,
        particleSize: 2,
        particleSpeed: 0.3,
        mouseInfluenceRadius: 200,
        mouseInfluenceStrength: 0.02,
        lineOpacity: 0.15,
        particleOpacity: 0.6,
        colors: {
            particle: 0x00d4ff, // Electric cyan
            line: 0x00d4ff
        }
    };

    // Mobile detection - reduce particles for performance
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
        CONFIG.particleCount = 50;
        CONFIG.connectionDistance = 100;
    }

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        75,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000
    );
    camera.position.z = 300;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Particles
    const particles = [];
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(CONFIG.particleCount * 3);
    const velocities = [];

    // Initialize particles
    for (let i = 0; i < CONFIG.particleCount; i++) {
        const x = (Math.random() - 0.5) * canvas.clientWidth;
        const y = (Math.random() - 0.5) * canvas.clientHeight;
        const z = (Math.random() - 0.5) * 100;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        velocities.push({
            x: (Math.random() - 0.5) * CONFIG.particleSpeed,
            y: (Math.random() - 0.5) * CONFIG.particleSpeed,
            z: (Math.random() - 0.5) * CONFIG.particleSpeed * 0.5
        });

        particles.push({ x, y, z, vx: velocities[i].x, vy: velocities[i].y, vz: velocities[i].z });
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle material
    const particleMaterial = new THREE.PointsMaterial({
        color: CONFIG.colors.particle,
        size: CONFIG.particleSize,
        transparent: true,
        opacity: CONFIG.particleOpacity,
        sizeAttenuation: true
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // Lines for connections
    const lineMaterial = new THREE.LineBasicMaterial({
        color: CONFIG.colors.line,
        transparent: true,
        opacity: CONFIG.lineOpacity
    });

    let linesMesh = null;

    // Mouse tracking
    const mouse = { x: 0, y: 0, active: false };

    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        mouse.active = true;
    });

    canvas.addEventListener('mouseleave', () => {
        mouse.active = false;
    });

    // Update lines between particles
    function updateLines() {
        // Remove old lines
        if (linesMesh) {
            scene.remove(linesMesh);
            linesMesh.geometry.dispose();
        }

        const linePositions = [];
        const pos = particleGeometry.attributes.position.array;

        for (let i = 0; i < CONFIG.particleCount; i++) {
            for (let j = i + 1; j < CONFIG.particleCount; j++) {
                const dx = pos[i * 3] - pos[j * 3];
                const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
                const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < CONFIG.connectionDistance) {
                    linePositions.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
                    linePositions.push(pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]);
                }
            }
        }

        if (linePositions.length > 0) {
            const lineGeometry = new THREE.BufferGeometry();
            lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
            scene.add(linesMesh);
        }
    }

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        const positions = particleGeometry.attributes.position.array;

        for (let i = 0; i < CONFIG.particleCount; i++) {
            const particle = particles[i];

            // Apply velocity
            positions[i * 3] += particle.vx;
            positions[i * 3 + 1] += particle.vy;
            positions[i * 3 + 2] += particle.vz;

            // Mouse influence
            if (mouse.active) {
                const mouseX = mouse.x * canvas.clientWidth / 2;
                const mouseY = mouse.y * canvas.clientHeight / 2;

                const dx = positions[i * 3] - mouseX;
                const dy = positions[i * 3 + 1] - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.mouseInfluenceRadius && dist > 0) {
                    const force = (CONFIG.mouseInfluenceRadius - dist) / CONFIG.mouseInfluenceRadius;
                    positions[i * 3] += (dx / dist) * force * CONFIG.mouseInfluenceStrength * 10;
                    positions[i * 3 + 1] += (dy / dist) * force * CONFIG.mouseInfluenceStrength * 10;
                }
            }

            // Boundary bounce
            const halfWidth = canvas.clientWidth / 2;
            const halfHeight = canvas.clientHeight / 2;

            if (Math.abs(positions[i * 3]) > halfWidth) {
                particle.vx *= -1;
                positions[i * 3] = Math.sign(positions[i * 3]) * halfWidth;
            }
            if (Math.abs(positions[i * 3 + 1]) > halfHeight) {
                particle.vy *= -1;
                positions[i * 3 + 1] = Math.sign(positions[i * 3 + 1]) * halfHeight;
            }
            if (Math.abs(positions[i * 3 + 2]) > 50) {
                particle.vz *= -1;
            }
        }

        particleGeometry.attributes.position.needsUpdate = true;

        // Update lines every few frames for performance
        if (Math.random() < 0.3) {
            updateLines();
        }

        renderer.render(scene, camera);
    }

    // Handle resize
    function handleResize() {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    window.addEventListener('resize', handleResize);

    // Initial line update and start animation
    updateLines();
    animate();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        renderer.dispose();
        particleGeometry.dispose();
        particleMaterial.dispose();
        lineMaterial.dispose();
    });

})();
