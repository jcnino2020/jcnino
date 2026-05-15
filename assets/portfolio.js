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

/**
 * Preload cache — tracks URLs already requested to avoid duplicate fetches.
 * Persists for the lifetime of the page session.
 */
const preloadCache = new Set();

/**
 * Resolve a gallery src to its 1600px WebP counterpart for preloading.
 * (Same logic as getLightboxSrc but targeting the 1600/ folder.)
 */
function getPreloadSrc(src) {
    const decoded = decodeURIComponent(src);
    const match = decoded.match(/^images\/(?:(.+)\/)?([^\/]+)\.(jpe?g|png|webp)$/i);
    if (!match) return null;
    const subfolder = match[1] || null;
    const baseName  = match[2];
    const webpName  = `${baseName}-1600.webp`;
    return subfolder
        ? `images/optimized/1600/${subfolder}/${webpName}`
        : `images/optimized/1600/${webpName}`;
}

/**
 * Preload the ±3 images around the current index using the 1600px WebP.
 * Uses the Image() constructor so the browser caches the response;
 * subsequent requests for the same URL are served instantly from cache.
 * @param {Array}  gallery  - The current photo array
 * @param {number} index    - The current active index
 */
function preloadNearbyImages(gallery, index) {
    if (!gallery || gallery.length === 0) return;
    const RANGE = 3;
    for (let offset = -RANGE; offset <= RANGE; offset++) {
        if (offset === 0) continue; // current image is already displayed
        const targetIndex = index + offset;
        // Edge-case guard: skip out-of-bounds indexes
        if (targetIndex < 0 || targetIndex >= gallery.length) continue;
        const photo = gallery[targetIndex];
        if (!photo || !photo.src) continue;
        const preloadUrl = getPreloadSrc(photo.src);
        if (!preloadUrl) continue;
        // Skip if already in cache (no duplicate requests)
        if (preloadCache.has(preloadUrl)) continue;
        preloadCache.add(preloadUrl);
        const img = new Image();
        img.src = preloadUrl;
        // No onerror needed — failed preloads are silently ignored;
        // the lightbox fallback chain handles it at display time.
    }
}

function openLightbox(photo, gallery) {
    currentGallery = gallery;
    currentIndex = gallery.indexOf(photo);

    const lb = document.getElementById('lightbox');
    if (!lb) return;

    lb.classList.remove('hidden');
    lb.classList.add('flex');
    document.body.style.overflow = 'hidden';

    // GSAP: fade in the backdrop
    if (window.gsap) {
        gsap.fromTo(lb,
            { opacity: 0 },
            { opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
    }

    // syncLightbox will handle the image entry animation in its onload
    syncLightbox('open');
    
    // Preload nearby images
    preloadNearbyImages(currentGallery, currentIndex);
}

/**
 * Convert a gallery image src to its 2048px WebP counterpart.
 * Handles paths like:
 *   images/GH-01.JPG                        → images/optimized/2048/GH-01-2048.webp
 *   images/Drone%20Shots/Drone-001.JPG      → images/optimized/2048/Drone Shots/Drone-001-2048.webp
 *   images/Framed%20Moments/FM-01.JPG       → images/optimized/2048/Framed Moments/FM-01-2048.webp
 *   images/School%20Events/SE-01.JPG        → images/optimized/2048/School Events/SE-01-2048.webp
 *   images/Video%20Thumbnails/VI-01.jpg     → images/optimized/2048/Video Thumbnails/VI-01-2048.webp
 */
function getLightboxSrc(src) {
    // Decode any percent-encoded chars in the path
    const decoded = decodeURIComponent(src);
    // Match pattern: images/[optional subfolder/]FILENAME.EXT
    const match = decoded.match(/^images\/(?:(.+)\/)?([^\/]+)\.(jpe?g|png|webp)$/i);
    if (!match) return src; // fallback — return original
    const subfolder = match[1] || null;  // e.g. "Drone Shots", or null for root
    const baseName  = match[2];           // e.g. "GH-01"
    const webpName  = `${baseName}-2048.webp`;
    if (subfolder) {
        return `images/optimized/2048/${subfolder}/${webpName}`;
    } else {
        return `images/optimized/2048/${webpName}`;
    }
}

function syncLightbox(direction = null) {
    const p = currentGallery[currentIndex];
    const img = document.getElementById('lightbox-img');
    const counter = document.getElementById('lightbox-counter');

    if (img) {
        const webpSrc = getLightboxSrc(p.src);

        // Stop any current animations and hide image immediately to prevent "sticking"
        if (window.gsap) gsap.killTweensOf(img);
        img.style.opacity = '0';

        // Show loading state if not already cached
        const probe = new Image();
        probe.src = webpSrc;
        if (!probe.complete) {
            img.classList.add('lb-loading');
        }

        img.src = webpSrc;
        img.alt = p.alt || p.title || 'Portfolio Image';

        // Trigger smooth entry once loaded
        img.onload = function() {
            img.classList.remove('lb-loading');
            
            if (window.gsap) {
                let xOffset = 0;
                if (direction === 'next') xOffset = 40;
                if (direction === 'prev') xOffset = -40;

                gsap.fromTo(img,
                    { 
                        x: xOffset, 
                        opacity: 0, 
                        scale: direction === 'open' ? 0.94 : 0.98 
                    },
                    { 
                        x: 0, 
                        opacity: 1, 
                        scale: 1, 
                        duration: 0.4, 
                        ease: direction === 'open' ? 'power3.out' : 'power2.out',
                        clearProps: 'transform' // clean up x/scale after animation
                    }
                );
            } else {
                img.style.opacity = '1';
            }
        };

        // Fallback to original if optimized WebP fails
        img.onerror = function() {
            img.classList.remove('lb-loading');
            if (img.src !== p.src) {
                img.src = p.src;
                img.onerror = null;
            }
        };
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
    syncLightbox('prev');
    preloadNearbyImages(currentGallery, currentIndex);
}

function nextImage() {
    if (currentGallery.length === 0) return;
    currentIndex = (currentIndex + 1) % currentGallery.length;
    syncLightbox('next');
    preloadNearbyImages(currentGallery, currentIndex);
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
