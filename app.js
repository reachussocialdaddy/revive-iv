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

/* ─── 5. Stacked Auto-Swiping Reviews ────────────────────────── */
function initStackedReviews() {
    const cards = document.querySelectorAll('.review-card');
    if (!cards.length) return;
    
    let currentIndex = 0;
    let isAnimating = false;
    
    function updateStack() {
        cards.forEach((card, i) => {
            // Relative index from the front
            let relIndex = (i - currentIndex + cards.length) % cards.length;
            
            if (relIndex === 0) {
                card.classList.add('active');
                gsap.to(card, {
                    z: 0, y: 0, scale: 1, opacity: 1, 
                    duration: 0.8, ease: "power3.out",
                    zIndex: 10
                });
            } else if (relIndex < 3) {
                card.classList.remove('active');
                gsap.to(card, {
                    z: -60 * relIndex,
                    y: 20 * relIndex,
                    scale: 1 - (0.05 * relIndex),
                    opacity: 1 - (0.25 * relIndex),
                    duration: 0.8, 
                    ease: "power3.out",
                    zIndex: 10 - relIndex
                });
            } else {
                card.classList.remove('active');
                gsap.to(card, {
                    opacity: 0, z: -200, duration: 0.8, zIndex: 0
                });
            }
        });
    }

    function showNext() {
        if (isAnimating) return;
        isAnimating = true;

        const currentCard = cards[currentIndex];
        
        // Throw top card away
        gsap.to(currentCard, {
            x: -150,
            y: 50,
            rotation: -15,
            opacity: 0,
            duration: 0.7,
            ease: "power2.inOut",
            onComplete: () => {
                gsap.set(currentCard, { x: 0, y: 0, rotation: 0, zIndex: 0 });
                currentIndex = (currentIndex + 1) % cards.length;
                updateStack();
                setTimeout(() => { isAnimating = false; }, 100);
            }
        });
    }

    // Initial state
    updateStack();
    
    // Auto cycle
    if (window.reviewInterval) clearInterval(window.reviewInterval);
    window.reviewInterval = setInterval(showNext, 5000);
    
    // Click to go next manually
    const wrapper = document.querySelector('.reviews-wrapper');
    if (wrapper) {
        wrapper.style.cursor = 'pointer';
        wrapper.onclick = showNext;
    }
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
    initStackedReviews();
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
    initStackedReviews();
    window.initScrollAnimations();
});
