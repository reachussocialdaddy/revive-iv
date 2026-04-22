/**
 * barba-init.js
 * Barba.js page transitions + GSAP "REVIVE IV" reveal animations
 * Works on both mobile and desktop.
 */

(function () {
    'use strict';


    // Dependency check for animations
    if (typeof barba === 'undefined' || typeof gsap === 'undefined') {
        console.warn('Barba or GSAP not found. Animations disabled.');
        return;
    }

    /* ── Curtain element ── */
    const curtain = document.getElementById('barba-curtain');

    /* ── Curtain: slide in (exit) ── */
    function curtainIn() {
        return new Promise(resolve => {
            gsap.set(curtain, { transformOrigin: 'bottom', scaleY: 0 });
            gsap.to(curtain, {
                scaleY: 1,
                duration: 0.65,
                ease: 'power4.inOut',
                onComplete: resolve
            });
        });
    }

    /* ── Curtain: slide out (enter) ── */
    function curtainOut() {
        return new Promise(resolve => {
            gsap.set(curtain, { transformOrigin: 'top', scaleY: 1 });
            gsap.to(curtain, {
                scaleY: 0,
                duration: 0.65,
                ease: 'power4.inOut',
                onComplete: resolve
            });
        });
    }

    /* ── Re-run page entrance animations ── */
    function runPageAnimations(container) {
        // Scroll to top
        window.scrollTo(0, 0);

        // Re-init GSAP reveal elements in new container
        const revealEls = container.querySelectorAll('.reveal');
        revealEls.forEach(el => {
            gsap.set(el, { autoAlpha: 0, y: 60, scale: 0.95 });
        });

        // Small delay then re-register ScrollTriggers
        setTimeout(() => {
            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.getAll().forEach(t => t.kill());
            }
            // Re-init app.js core logic (re-call the scroll animations)
            if (typeof initScrollAnimations === 'function') {
                initScrollAnimations();
            } else {
                // Fallback: manually re-trigger reveal animations
                revealEls.forEach(el => {
                    gsap.set(el, { autoAlpha: 0, y: 60, scale: 0.95 });
                    if (typeof ScrollTrigger !== 'undefined') {
                        gsap.to(el, {
                            scrollTrigger: {
                                trigger: el,
                                start: 'top 88%',
                                toggleActions: 'play none none reverse'
                            },
                            autoAlpha: 1, y: 0, scale: 1,
                            duration: 1.2, ease: 'power4.out'
                        });
                    }
                });
            }
        }, 100);

        // Hero content entrance
        const heroContent = container.querySelector('.hero-content');
        if (heroContent) {
            gsap.fromTo(heroContent.children,
                { autoAlpha: 0, y: 50, filter: 'blur(14px)' },
                { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.4, stagger: 0.15, ease: 'power4.out', delay: 0.2 }
            );
        }

        // Orbit icons
        const orbitIcons = container.querySelectorAll('.orbit-icon');
        if (orbitIcons.length) {
            gsap.fromTo(orbitIcons,
                { scale: 0, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.7, stagger: 0.1, ease: 'back.out(1.7)', delay: 0.5 }
            );
        }

        // Contact form card
        const formCard = container.querySelector('.contact-form-card');
        if (formCard) {
            gsap.fromTo(formCard,
                { autoAlpha: 0, y: 40 },
                { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.3 }
            );
        }
    }

    /* ── "REVIVE IV" Big Text Reveal ──────────────────────────────
     * Fires on the home namespace for the footer massive row.
     * Works on both desktop and mobile.
     ─────────────────────────────────────────────────────────────── */
    function initReviveIVReveal() {
        const massiveRow = document.querySelector('.footer-massive-row');
        if (!massiveRow || typeof ScrollTrigger === 'undefined') return;

        // Split by characters via spans
        const text = massiveRow.textContent.trim();
        massiveRow.innerHTML = '';
        massiveRow.style.overflow = 'hidden';
        massiveRow.style.display = 'flex';
        massiveRow.style.justifyContent = 'center';

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.overflow = 'hidden';

        text.split('').forEach(char => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.display = 'inline-block';
            span.style.willChange = 'transform, opacity';
            wrapper.appendChild(span);
        });
        massiveRow.appendChild(wrapper);

        const chars = wrapper.querySelectorAll('span');

        gsap.set(chars, { y: '110%', opacity: 0 });

        ScrollTrigger.create({
            trigger: massiveRow,
            start: 'top 90%',
            onEnter: () => {
                gsap.to(chars, {
                    y: '0%',
                    opacity: 1,
                    duration: 1.0,
                    stagger: 0.04,
                    ease: 'power4.out'
                });
            },
            onLeaveBack: () => {
                gsap.to(chars, {
                    y: '110%',
                    opacity: 0,
                    duration: 0.6,
                    stagger: 0.02,
                    ease: 'power3.in'
                });
            }
        });

        // Also parallax scale effect on scroll
        gsap.to(wrapper, {
            scale: 1.05,
            ease: 'none',
            scrollTrigger: {
                trigger: massiveRow,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
            }
        });
    }

    /* ── Barba hooks ── */
    barba.hooks.before(() => {
        // Prevent double-click spam
        document.querySelectorAll('a').forEach(a => a.style.pointerEvents = 'none');
    });

    barba.hooks.after(() => {
        document.querySelectorAll('a').forEach(a => a.style.pointerEvents = '');
        // Re-init Lenis if available
        if (typeof Lenis !== 'undefined') {
            try {
                const lenis = new Lenis({ duration: 1.2, smooth: true, smoothTouch: false });
                lenis.on('scroll', ScrollTrigger.update);
                gsap.ticker.add(time => lenis.raf(time * 1000));
            } catch(e) {}
        }
    });

    /* ── Barba init ── */
    barba.init({
        sync: true,
        transitions: [{
            name: 'curtain-transition',
            leave(data) {
                return curtainIn();
            },
            enter(data) {
                runPageAnimations(data.next.container);
                return curtainOut();
            }
        }]
    });

    /* ── Run on load (Standard Navigation) ── */
    document.addEventListener('DOMContentLoaded', () => {
        // Run entrance animations for the whole page
        runPageAnimations(document.body);
        
        // Init specialized animations
        initReviveIVReveal();
        
        if (typeof updateActiveNavLink === 'function') {
            updateActiveNavLink();
        }

        // Hero specialized inits
        if (document.querySelector('[data-barba-namespace="home"]')) {
            if (typeof initHeroRingScene === 'function') initHeroRingScene();
            if (typeof initOrbitAnimation === 'function') initOrbitAnimation();
        }

    });

})();
