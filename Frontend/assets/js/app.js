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

    // 2. Initialize Interactive Card Hover Spotlight effect
    const initSpotlightCards = () => {
        const cards = document.querySelectorAll(".premium-card");
        
        cards.forEach((card) => {
            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                card.style.setProperty("--x", `${x}px`);
                card.style.setProperty("--y", `${y}px`);
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

    // 4. Initial GSAP Visual Entrances
    const initEntrances = () => {
        // Register GSAP ScrollTrigger plugin
        gsap.registerPlugin(ScrollTrigger);

        // Header and navbar load animation
        gsap.from(".navbar-container", {
            y: -20,
            opacity: 0,
            duration: 1,
            ease: "power4.out"
        });

        // General section headers fade-in-up triggering on scroll
        const sectionHeaders = document.querySelectorAll(".section-header");
        sectionHeaders.forEach((header) => {
            gsap.from(header, {
                scrollTrigger: {
                    trigger: header,
                    start: "top 85%",
                    toggleActions: "play none none none"
                },
                y: 30,
                opacity: 0,
                duration: 1,
                ease: "power3.out"
            });
        });
    };

    // Expose spotlight init globally so portfolio.js can re-run it after injecting dynamic content
    window._initSpotlight = initSpotlightCards;

    // Run Initializations
    initLenis();
    initSpotlightCards();
    initMobileMenu();
    initEntrances();
});
