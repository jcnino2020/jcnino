/**
 * Portfolio Shared JavaScript
 * JC Niñonuevo Portfolio
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    updateYear();
    initLightboxListeners();
});

/**
 * Mobile Menu Toggle logic
 */
function initMobileMenu() {
    const btn = document.getElementById('hamburger');
    const menu = document.getElementById('mobile-menu');
    const ham = document.getElementById('ham-icon');
    const x = document.getElementById('close-icon');
    
    if (!btn || !menu) return;

    let open = false;
    
    btn.addEventListener('click', () => {
        open = !open;
        menu.classList.toggle('open', open);
        menu.classList.toggle('closed', !open);
        if (ham) ham.classList.toggle('hidden', open);
        if (x) x.classList.toggle('hidden', !open);
    });

    // Close menu on link click
    menu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            open = false;
            menu.classList.add('closed');
            menu.classList.remove('open');
            if (ham) ham.classList.remove('hidden');
            if (x) x.classList.add('hidden');
        });
    });
}

/**
 * Automatically update copyright year
 */
function updateYear() {
    document.querySelectorAll('.year').forEach(e => {
        e.textContent = new Date().getFullYear();
    });
}

/**
 * Lightbox Core Logic
 * Global variables to track state
 */
let currentGallery = [];
let currentIndex = 0;

function openLightbox(photo, gallery) {
    currentGallery = gallery;
    currentIndex = gallery.indexOf(photo);
    syncLightbox();
    
    const lb = document.getElementById('lightbox');
    if (!lb) return;

    lb.classList.remove('hidden');
    lb.classList.add('flex');
    document.body.style.overflow = 'hidden';

    // GSAP: fade + scale in
    if (window.gsap) {
        gsap.fromTo(lb,
            { opacity: 0 },
            { opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
        gsap.fromTo('#lightbox-img',
            { scale: 0.94, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.4, ease: 'power3.out' }
        );
    }
}

function syncLightbox() {
    const p = currentGallery[currentIndex];
    const img = document.getElementById('lightbox-img');
    const counter = document.getElementById('lightbox-counter');
    
    if (img) {
        img.src = p.src;
        img.alt = p.alt || p.title || 'Portfolio Image';
    }
    if (counter) {
        counter.textContent = `${currentIndex + 1} / ${currentGallery.length}`;
    }
}

function closeLightbox() {
    const lb = document.getElementById('lightbox');
    if (!lb) return;

    if (window.gsap) {
        gsap.to(lb, {
            opacity: 0,
            duration: 0.25,
            ease: 'power2.in',
            onComplete: () => {
                lb.classList.add('hidden');
                lb.classList.remove('flex');
                document.body.style.overflow = '';
            }
        });
    } else {
        lb.classList.add('hidden');
        lb.classList.remove('flex');
        document.body.style.overflow = '';
    }
}

function prevImage() {
    if (currentGallery.length === 0) return;
    currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
    
    if (window.gsap) {
        gsap.fromTo('#lightbox-img',
            { x: -30, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.25, ease: 'power2.out' }
        );
    }
    syncLightbox();
}

function nextImage() {
    if (currentGallery.length === 0) return;
    currentIndex = (currentIndex + 1) % currentGallery.length;
    
    if (window.gsap) {
        gsap.fromTo('#lightbox-img',
            { x: 30, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.25, ease: 'power2.out' }
        );
    }
    syncLightbox();
}

function initLightboxListeners() {
    const lb = document.getElementById('lightbox');
    if (!lb) return;

    // Keyboard navigation
    document.addEventListener('keydown', e => {
        if (lb.classList.contains('hidden')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'ArrowRight') nextImage();
    });

    // Close on background click
    lb.addEventListener('click', e => {
        if (e.target === lb) closeLightbox();
    });

    // Swipe Support
    let startX = 0, startY = 0;
    lb.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });

    lb.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (absX > 50 && absY < 80) {
            if (dx < 0) nextImage();
            else prevImage();
        } else if (absY > 90 && absX < 60) {
            closeLightbox();
        }
    }, { passive: true });
}

/**
 * Shared GSAP Animation Helpers
 */
function revealOnScroll(elements, options = {}) {
    if (!window.ScrollTrigger) return;
    
    gsap.utils.toArray(elements).forEach(el => {
        gsap.fromTo(el, 
            { y: options.y || 30, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: options.duration || 0.8,
                ease: options.ease || 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: options.start || 'top 85%',
                    once: true
                }
            }
        );
    });
}
