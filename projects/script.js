document.addEventListener("DOMContentLoaded", () => {
    // Register GSAP plugins if needed (none strictly needed for basic fromTo)
    
    // Animate Navbar
    gsap.from(".navbar", {
        y: -100,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
    });

    // Animate Hero Section
    const heroTl = gsap.timeline();
    heroTl.from(".badge", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out"
    })
    .from(".hero-title", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    }, "-=0.4")
    .from(".hero-subtitle", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    }, "-=0.6");

    // Animate Grid Cards with Stagger
    gsap.from(".project-card", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.5, // Start after hero animation begins
        onComplete: function() {
            document.querySelectorAll(".project-card").forEach(card => {
                card.classList.add("animated");
            });
        }
    });
});
