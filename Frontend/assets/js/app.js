// Core JavaScript File - Handles Lenis, GSAP, and interactive UI micro-animations

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Lenis Smooth Scroll
    const initLenis = () => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });

        // Update ScrollTrigger on every scroll frame
        lenis.on('scroll', ScrollTrigger.update);

        // Tell GSAP to use Lenis ticker
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });

        // Lag smoothing adjustment
        gsap.ticker.lagSmoothing(0);
    };

    // 2. Initialize Interactive Card Hover Spotlight effect & 3D Magnetic Tilt
    const initSpotlightCards = () => {
        const cards = document.querySelectorAll(".premium-card");
        
        cards.forEach((card) => {
            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                card.style.setProperty("--x", `${x}px`);
                card.style.setProperty("--y", `${y}px`);

                // 3D Magnetic Tilt Micro-Interaction
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const tiltX = Math.max(-8, Math.min(8, ((y - centerY) / centerY) * -7));
                const tiltY = Math.max(-8, Math.min(8, ((x - centerX) / centerX) * 7));
                card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-5px)`;
            });

            card.addEventListener("mouseleave", () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
            });
        });
    };

    // 3. Mobile Navigation Drawer Toggle
    const initMobileMenu = () => {
        const burgerMenu = document.querySelector(".burger-menu");
        const navLinks = document.querySelector(".nav-links");
        
        if (burgerMenu && navLinks) {
            burgerMenu.addEventListener("click", () => {
                navLinks.classList.toggle("active");
                
                // Burger animation (optional cross transformation helper)
                const spans = burgerMenu.querySelectorAll("span");
                if (navLinks.classList.contains("active")) {
                    spans[0].style.transform = "rotate(45deg) translate(6px, 6px)";
                    spans[1].style.opacity = "0";
                    spans[2].style.transform = "rotate(-45deg) translate(5px, -5px)";
                } else {
                    spans[0].style.transform = "none";
                    spans[1].style.opacity = "1";
                    spans[2].style.transform = "none";
                }
            });

            // Close menu drawer when links are clicked
            const links = navLinks.querySelectorAll("a");
            links.forEach(link => {
                link.addEventListener("click", () => {
                    navLinks.classList.remove("active");
                    const spans = burgerMenu.querySelectorAll("span");
                    spans[0].style.transform = "none";
                    spans[1].style.opacity = "1";
                    spans[2].style.transform = "none";
                });
            });
        }
    };

    // 4. Initial GSAP Visual Entrances & Staggers
    const initEntrances = () => {
        // Register GSAP ScrollTrigger plugin
        gsap.registerPlugin(ScrollTrigger);

        // Header and navbar load animation
        gsap.from(".navbar-container", {
            y: -25,
            opacity: 0,
            duration: 1.1,
            ease: "power4.out"
        });

        // Hero Content Stagger
        const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
        heroTimeline
            .from("#hero-badge", { y: -20, opacity: 0, duration: 0.8, delay: 0.2 })
            .from("#hero-heading", { y: 30, opacity: 0, duration: 1 }, "-=0.5")
            .from("#hero-subtext", { y: 25, opacity: 0, duration: 0.9 }, "-=0.6")
            .from("#hero-call-to-actions", { y: 20, opacity: 0, duration: 0.8 }, "-=0.5")
            .from("#hero-stats-ribbon", { y: 30, opacity: 0, duration: 0.9, scale: 0.96 }, "-=0.4");

        // General section headers fade-in-up triggering on scroll
        const sectionHeaders = document.querySelectorAll(".section-header");
        sectionHeaders.forEach((header) => {
            gsap.from(header, {
                scrollTrigger: {
                    trigger: header,
                    start: "top 85%",
                    toggleActions: "play none none none"
                },
                y: 35,
                opacity: 0,
                duration: 1,
                ease: "power3.out"
            });
        });
    };

    // 5. Update live hero stats from API if available
    const initLiveStats = async () => {
        try {
            if (window.API?.ProjectsAPI) {
                const res = await window.API.ProjectsAPI.getAll();
                const count = res?.data?.length;
                if (count && count > 0) {
                    const el = document.getElementById('hero-stat-projects');
                    if (el) el.textContent = `${count}+`;
                }
            }
        } catch { /* non-critical */ }
    };

    // Expose spotlight init globally so portfolio.js can re-run it after injecting dynamic content
    window._initSpotlight = initSpotlightCards;

    // Run Initializations
    initLenis();
    initSpotlightCards();
    initMobileMenu();
    initEntrances();
    initLiveStats();
});
