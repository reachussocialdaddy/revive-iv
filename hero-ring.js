/**
 * hero-ring.js
 * Three.js scene: premium gold torus ring + ambient particles + orbiting icons
 * Works on both mobile and desktop.
 * Functions exposed globally for Barba.js re-use.
 */

(function () {
    'use strict';

    /* ─── Helpers ─────────────────────────────────────────────── */
    const isMobile = () => window.innerWidth <= 768;

    /* ─── Intro Loader ─────────────────────────────────────────── */
    function runIntroLoader() {
        const loader   = document.getElementById('intro-loader');
        const loaderBar = document.getElementById('loader-bar-fill');
        const loaderText = document.getElementById('loader-text');

        if (!loader) return;

        // Animate loader bar
        gsap.to(loaderBar, { width: '100%', duration: 1.4, ease: 'power2.inOut' });

        // Text reveal
        gsap.fromTo(loaderText,
            { y: 40, opacity: 0, filter: 'blur(12px)' },
            { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power4.out', delay: 0.1 }
        );

        // Exit loader
        if (typeof gsap !== 'undefined') {
            gsap.to(loader, {
                opacity: 0,
                duration: 0.6,
                delay: 1.6,
                ease: 'power2.inOut',
                onComplete: () => {
                    loader.classList.add('fade-out');
                    loader.style.display = 'none';
                    animateHeroEntrance();
                }
            });
        } else {
            // Fallback if GSAP is missing
            setTimeout(() => {
                loader.classList.add('fade-out');
                loader.style.display = 'none';
                animateHeroEntrance();
            }, 2000);
        }
    }

    /* ─── Hero entrance animations ─────────────────────────────── */
    function animateHeroEntrance() {
        const heroContent = document.querySelector('.hero-content');
        if (!heroContent) return;

        // Stagger hero children
        gsap.fromTo(heroContent.children,
            { autoAlpha: 0, y: 50, filter: 'blur(14px)' },
            {
                autoAlpha: 1, y: 0, filter: 'blur(0px)',
                duration: 1.4, stagger: 0.15, ease: 'power4.out', delay: 0.05
            }
        );

        // Animate orbit icons in
        gsap.fromTo('.orbit-icon',
            { opacity: 0, scale: 0 },
            { 
                opacity: 1, 
                scale: 1, 
                duration: 1, 
                stagger: 0.15, 
                ease: 'elastic.out(1, 0.75)', 
                delay: 0.5 
            }
        );
    }

    /* ─── Orbiting Icons continuous animation ───────────────────── */
    function initOrbitAnimation() {
        const cluster = document.getElementById('icon-orbit-cluster');
        if (!cluster) return;

        const icons = cluster.querySelectorAll('.orbit-icon');
        if (!icons.length) return;

        // Position icons absolute
        icons.forEach(icon => {
            icon.style.position = 'absolute';
            icon.style.top = '0';
            icon.style.left = '0';
            icon.style.margin = '0';
        });

        // Continuous orbit via GSAP ticker
        const startTime = performance.now();
        const speed = 0.0006;

        function updateOrbit() {
            const elapsed = performance.now() - startTime;
            const isMob = window.innerWidth <= 768;
            const clusterSize = isMob ? 220 : 320;
            const radius = isMob ? 80 : 125; // Reduced from 85
            const cx = clusterSize / 2;
            const cy = clusterSize / 2;
            const iconSize = isMob ? 36 : 48; // Reduced from 40

            icons.forEach((icon, i) => {
                const count = icons.length;
                const baseAngle = (2 * Math.PI / count) * i;
                const angle = baseAngle + elapsed * speed;
                
                const x = cx + radius * Math.cos(angle) - (iconSize / 2);
                const y = cy + radius * Math.sin(angle) - (iconSize / 2);
                
                gsap.set(icon, {
                    x: x,
                    y: y,
                    rotation: angle * 10,
                    force3D: true
                });
            });
        }

        gsap.ticker.add(updateOrbit);
    }

        // Sync cluster size on resize
        const syncSize = () => {
            const isMob = window.innerWidth <= 768;
            cluster.style.width  = isMob ? '220px' : '320px';
            cluster.style.height = isMob ? '220px' : '320px';
        };
        window.addEventListener('resize', syncSize);
        syncSize();
    }

    /* ─── Three.js Hero Ring Scene ──────────────────────────────── */
    function initHeroRingScene() {
        const canvas = document.getElementById('hero-ring-scene');
        if (!canvas || typeof THREE === 'undefined') return;
        // Guard against re-init
        if (canvas.dataset.ringActive) return;
        canvas.dataset.ringActive = 'true';

        const hero = canvas.parentElement;
        const W = () => hero.clientWidth;
        const H = () => hero.clientHeight;

        /* Scene */
        const scene = new THREE.Scene();

        /* Camera */
        const camera = new THREE.PerspectiveCamera(50, W() / H(), 0.1, 200);
        camera.position.set(0, 0, 12);

        /* Renderer */
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setSize(W(), H());
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        /* ── Premium Gold Torus Ring ── */
        // Radius depends on screen
        const ringRadius = isMobile() ? 2.0 : 2.4;
        const tubeRadius = isMobile() ? 0.12 : 0.14;

        const torusGeo = new THREE.TorusGeometry(ringRadius, tubeRadius, 32, 120);
        const torusMat = new THREE.MeshPhysicalMaterial({
            color: 0xC5A059,
            metalness: 0.85,
            roughness: 0.12,
            reflectivity: 1,
            envMapIntensity: 1,
            emissive: 0xC5A059,
            emissiveIntensity: 0.08,
        });
        const ringMesh = new THREE.Mesh(torusGeo, torusMat);
        // Tilt slightly for drama
        ringMesh.rotation.x = Math.PI / 8;
        scene.add(ringMesh);

        /* ── Inner glow ring (ghost) ── */
        const innerGeo = new THREE.TorusGeometry(ringRadius - 0.3, tubeRadius * 0.5, 16, 80);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0xF3E5AB, transparent: true, opacity: 0.25, side: THREE.DoubleSide
        });
        const innerRing = new THREE.Mesh(innerGeo, innerMat);
        innerRing.rotation.x = Math.PI / 8;
        scene.add(innerRing);

        /* ── Floating particles ── */
        const particleCount = isMobile() ? 80 : 180;
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(particleCount * 3);
        const pVel = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            // Distribute around a sphere
            const theta = Math.random() * Math.PI * 2;
            const phi   = Math.acos(2 * Math.random() - 1);
            const r     = 2.5 + Math.random() * 4;
            pPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
            pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pPos[i * 3 + 2] = r * Math.cos(phi);
            pVel[i] = 0.002 + Math.random() * 0.006;
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

        // Soft circle texture
        const pCanvas = document.createElement('canvas');
        pCanvas.width = pCanvas.height = 32;
        const pCtx = pCanvas.getContext('2d');
        const pGrad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
        pGrad.addColorStop(0, 'rgba(197,160,89,1)');
        pGrad.addColorStop(1, 'rgba(197,160,89,0)');
        pCtx.fillStyle = pGrad;
        pCtx.fillRect(0, 0, 32, 32);
        const pTex = new THREE.CanvasTexture(pCanvas);

        const pMat = new THREE.PointsMaterial({
            size: isMobile() ? 0.06 : 0.08,
            map: pTex,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const particles = new THREE.Points(pGeo, pMat);
        scene.add(particles);

        /* ── Lights ── */
        scene.add(new THREE.AmbientLight(0xffffff, 0.4));
        const dLight1 = new THREE.DirectionalLight(0xC5A059, 3);
        dLight1.position.set(5, 5, 5);
        scene.add(dLight1);
        const dLight2 = new THREE.DirectionalLight(0xF3E5AB, 2);
        dLight2.position.set(-5, -3, 3);
        scene.add(dLight2);
        const pointLight = new THREE.PointLight(0xC5A059, 1.5, 20);
        pointLight.position.set(0, 0, 5);
        scene.add(pointLight);

        /* ── Mouse parallax ── */
        let targetRotX = 0, targetRotY = 0;
        let currentRotX = 0, currentRotY = 0;

        document.addEventListener('mousemove', (e) => {
            targetRotY = ((e.clientX / window.innerWidth) - 0.5) * 0.6;
            targetRotX = ((e.clientY / window.innerHeight) - 0.5) * -0.3;
        });

        // Touch parallax
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length) {
                targetRotY = ((e.touches[0].clientX / window.innerWidth) - 0.5) * 0.4;
            }
        }, { passive: true });

        /* ── Animation loop ── */
        const clock = new THREE.Clock();
        function tick() {
            const t = clock.getElapsedTime();

            // Slow continuous spin
            ringMesh.rotation.z += 0.003;
            innerRing.rotation.z -= 0.002;

            // Mouse follow (smooth lerp)
            currentRotX += (targetRotX - currentRotX) * 0.04;
            currentRotY += (targetRotY - currentRotY) * 0.04;
            ringMesh.rotation.y = currentRotY;
            ringMesh.rotation.x = Math.PI / 8 + currentRotX;
            innerRing.rotation.y = currentRotY;
            innerRing.rotation.x = Math.PI / 8 + currentRotX;

            // Float up/down
            ringMesh.position.y = Math.sin(t * 0.6) * 0.12;
            innerRing.position.y = Math.sin(t * 0.6) * 0.12;

            // Particles slow drift
            particles.rotation.y = t * 0.04;
            particles.rotation.x = t * 0.02;

            // Pulsing glow
            innerMat.opacity = 0.15 + 0.15 * Math.sin(t * 1.2);
            torusMat.emissiveIntensity = 0.05 + 0.05 * Math.sin(t * 0.8);

            renderer.render(scene, camera);
            requestAnimationFrame(tick);
        }
        tick();

        /* ── Scroll: ring moves with formulation section ── */
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.to(ringMesh.position, {
                z: -4, y: -2,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.formulation-section',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1.5,
                }
            });
        }

        /* ── Resize ── */
        window.addEventListener('resize', () => {
            renderer.setSize(W(), H());
            camera.aspect = W() / H();
            camera.updateProjectionMatrix();
        });
    }

    /* ─── Boot ──────────────────────────────────────────────────── */
    function boot() {
        runIntroLoader();
        initHeroRingScene();
        initOrbitAnimation();
    }

    /* ─── Global exports for Barba.js ─────────────────────────── */
    window.initHeroRingScene  = initHeroRingScene;
    window.initOrbitAnimation = initOrbitAnimation;
    window.runIntroLoader     = runIntroLoader;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();
