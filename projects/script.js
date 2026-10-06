document.addEventListener("DOMContentLoaded", () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.querySelectorAll(".hero-title, .hero-subtitle").forEach((element, index) => {
        if (typeof element.animate !== "function") return;
        element.animate([
            { opacity: 0.3, transform: "translateY(12px)" },
            { opacity: 1, transform: "translateY(0)" }
        ], {
            duration: 400,
            delay: index * 60,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)"
        });
    });
});
