/**
 * app.js — Revive IV Core JS
 * Modular: all scroll animations exported so Barba.js can re-run on transitions.
 */

/* ─── 1. Mobile Menu Toggle ─────────────────────────────────── */
function initMobileMenu() {
    const hamburger  = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        mobileMenu.classList.toggle('open');
    });

    // Close menu when a link inside it is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('open');
            mobileMenu.classList.remove('open');
        });
    });
}

/* ─── 2. Lenis Smooth Scroll ────────────────────────────────── */
let lenisInstance = null;

function initLenis() {
    if (typeof Lenis === 'undefined') return;
    if (lenisInstance) { lenisInstance.destroy(); }
    lenisInstance = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        smoothTouch: false,
        touchMultiplier: 2,
    });
    if (typeof ScrollTrigger !== 'undefined') {
        lenisInstance.on('scroll', ScrollTrigger.update);
    }
    gsap.ticker.add((time) => { lenisInstance.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
}

/* ─── 3. Infinite Marquee ───────────────────────────────────── */
function initMarquee() {
    const marqueeTrack = document.querySelector('.marquee-track');
    if (!marqueeTrack) return;
    const content = marqueeTrack.querySelector('.marquee-content');
    if (!content || marqueeTrack.dataset.cloned) return;
    marqueeTrack.appendChild(content.cloneNode(true));
    marqueeTrack.dataset.cloned = 'true';
    gsap.to(marqueeTrack, {
        xPercent: -50,
        repeat: -1,
        duration: 45,
        ease: 'none'
    });
}

/* ─── 4. Horizontal Scroll Section (Process) ───────────────── */
function initHorizontalScroll() {
    const processWrapper = document.querySelector('#process-wrapper');
    const processTrack   = document.querySelector('#process-track');
    if (!processWrapper || !processTrack) return;

    let mm = gsap.matchMedia();
    mm.add('(min-width: 769px)', () => {
        let getScrollAmount = () => processTrack.scrollWidth - window.innerWidth;
        gsap.to(processTrack, {
            x: () => -getScrollAmount(),
            ease: 'none',
            scrollTrigger: {
                trigger: processWrapper,
                start: 'top top',
                end: () => `+=${getScrollAmount()}`,
                pin: true,
                scrub: 1,
                invalidateOnRefresh: true
            }
        });
    });
}

/* ─── 5. Responsive Reviews ─────────────────────────────────── */
function initReviews() {
    const wrapper = document.querySelector('.reviews-wrapper');
    const track = document.querySelector('.reviews-track');
    const cards = document.querySelectorAll('.review-card');
    if (!wrapper || !track || !cards.length) return;

    let mm = gsap.matchMedia();
    let reviewInterval;
    let currentIndex = 0;

    mm.add({
        isDesktop: "(min-width: 1024px)",
        isMobile: "(max-width: 1023px)"
    }, (context) => {
        let { isDesktop, isMobile } = context.conditions;

        if (reviewInterval) clearInterval(reviewInterval);

        if (isMobile) {
            /* ─── Mobile: Single Card Swipe ─── */
            let isAnimating = false;

            function updateStack() {
                cards.forEach((card, i) => {
                    if (i === currentIndex) {
                        gsap.to(card, {
                            x: 0, opacity: 1, scale: 1, duration: 0.6, ease: "power2.out", 
                            zIndex: 10, pointerEvents: 'auto'
                        });
                    } else {
                        gsap.to(card, {
                            opacity: 0, scale: 0.9, duration: 0.6, ease: "power2.out", 
                            zIndex: 0, pointerEvents: 'none'
                        });
                    }
                });
            }

            function showNext() {
                if (isAnimating) return;
                isAnimating = true;
                const currentCard = cards[currentIndex];
                
                gsap.to(currentCard, {
                    x: -100, opacity: 0, duration: 0.5, ease: "power2.in",
                    onComplete: () => {
                        currentIndex = (currentIndex + 1) % cards.length;
                        updateStack();
                        isAnimating = false;
                    }
                });
            }

            updateStack();
            reviewInterval = setInterval(showNext, 5000);
            wrapper.onclick = showNext;
            wrapper.style.cursor = 'pointer';

        } else {
            /* ─── Desktop: Seamless Infinite Auto-Slider ─── */
            // 1. Clone cards for seamless loop
            if (!track.dataset.cloned) {
                track.innerHTML += track.innerHTML;
                track.dataset.cloned = "true";
            }
            
            const allCards = track.querySelectorAll('.review-card');
            gsap.set(allCards, { opacity: 1, x: 0, y: 0, z: 0, rotation: 0, scale: 1, pointerEvents: 'auto' });
            
            let cardWidth = 432; // 400px + 32px gap
            let totalOriginalWidth = cardWidth * (allCards.length / 2);
            let currentX = 0;

            function autoSlideDesktop() {
                currentX -= cardWidth;
                
                gsap.to(track, {
                    x: currentX,
                    duration: 1.2,
                    ease: "power3.inOut",
                    onComplete: () => {
                        // If we've reached the end of the first set, jump back to start
                        if (Math.abs(currentX) >= totalOriginalWidth) {
                            currentX = 0;
                            gsap.set(track, { x: 0 });
                        }
                    }
                });
            }

            reviewInterval = setInterval(autoSlideDesktop, 5000);

            if (typeof Draggable !== 'undefined') {
                Draggable.create(track, {
                    type: "x",
                    inertia: true,
                    onDragStart: () => clearInterval(reviewInterval),
                    onDrag: function() {
                        // Handle infinite wrap while dragging
                        if (this.x > 0) gsap.set(this.target, { x: this.x - totalOriginalWidth });
                        if (this.x < -totalOriginalWidth) gsap.set(this.target, { x: this.x + totalOriginalWidth });
                    },
                    onThrowUpdate: function() {
                        if (this.x > 0) gsap.set(this.target, { x: this.x - totalOriginalWidth });
                        if (this.x < -totalOriginalWidth) gsap.set(this.target, { x: this.x + totalOriginalWidth });
                    }
                });
            }
            wrapper.onclick = null;
            wrapper.style.cursor = 'grab';
        }

        return () => {
            if (reviewInterval) clearInterval(reviewInterval);
            const draggables = Draggable.get(track);
            if (draggables) draggables.kill();
        };
    });
}

/* ─── 6. Hero Parallax ──────────────────────────────────────── */
function initHeroParallax() {
    const heroBg = document.querySelector('.hero-bg');
    if (!heroBg) return;
    gsap.to(heroBg, {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        }
    });
}

/* ─── 7. GSAP Scroll Reveal Animations ─────────────────────── */
function initRevealAnimations() {
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => {
        gsap.set(el, { autoAlpha: 0, y: 60, scale: 0.95 });
        gsap.to(el, {
            scrollTrigger: {
                trigger: el,
                start: 'top 87%',
                toggleActions: 'play none none reverse'
            },
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 1.2,
            ease: 'power4.out'
        });
    });
}

/* ─── 8. Bento Stagger ──────────────────────────────────────── */
function initBentoStagger() {
    const bentoItems = document.querySelectorAll('.bento-stagger');
    if (!bentoItems.length) return;
    gsap.set(bentoItems, { autoAlpha: 0, y: 100 });
    ScrollTrigger.batch(bentoItems, {
        start: 'top 85%',
        onEnter: batch => gsap.to(batch, {
            autoAlpha: 1, y: 0, stagger: 0.2, duration: 1.2, ease: 'power4.out'
        }),
        onLeaveBack: batch => gsap.to(batch, {
            autoAlpha: 0, y: 100, duration: 0.8
        })
    });
}

/* ─── 9. Hero Image Slider ─────────────────────────────────────── */
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;
    
    let currentSlide = 0;
    
    if (window.heroSliderInterval) {
        clearInterval(window.heroSliderInterval);
    }
    
    // reset animations by removing and re-adding them if needed, but CSS handles it
    window.heroSliderInterval = setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        
        // Force reflow to reset animation if it finished, though infinite looping doesn't need it if we handle it well
        // Actually, CSS keyframes will stay at 100% since it's `both`. To replay, we must remove and add the animation class
        // But since we have 4 slides, by the time it comes back, we can just reset it
        const nextSlide = slides[currentSlide];
        
        // Hack to reset CSS animation: remove class, trigger reflow, add class
        const animClass = Array.from(nextSlide.classList).find(c => c.startsWith('anim-'));
        if (animClass) {
            nextSlide.classList.remove(animClass);
            void nextSlide.offsetWidth; // trigger reflow
            nextSlide.classList.add(animClass);
        }
        
        nextSlide.classList.add('active');
    }, 6000); // 6 seconds per slide
}

/* ─── 10. Shot Card Toggle ─────────────────────────────────────── */
function initShotCards() {
    const shotCards = document.querySelectorAll('.shot-card');
    shotCards.forEach(card => {
        card.onclick = () => {
            // Optional: Close others
            shotCards.forEach(other => {
                if (other !== card) other.classList.remove('active');
            });
            card.classList.toggle('active');
        };
    });
}

/* ─── Exported: initScrollAnimations ────────────────────────
 * Called by Barba.js after each page transition.
 * Re-initializes ScrollTriggers, Sliders, and 3D scenes.
 */
window.initScrollAnimations = function () {
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.getAll().forEach(t => t.kill());
        ScrollTrigger.refresh();
    }
    initRevealAnimations();
    initBentoStagger();
    initHeroParallax();
    initHorizontalScroll();
    initReviews();
    initHeroSlider();
    initMarquee();
    initShotCards();
};

/* ─── Boot on DOMContentLoaded ──────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initLenis();
    initMarquee();
    initShotCards();
    initReviews();
    window.initScrollAnimations();
});
