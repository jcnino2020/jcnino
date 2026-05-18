/**
 * Portfolio Shared JavaScript
 * JC Niñonuevo Portfolio
 */

document.addEventListener('DOMContentLoaded', () => {
    injectComponents();
    initMobileMenu();
    updateYear();
    initLightboxListeners();
    initInteractiveEffects();
});

/**
 * Global templates for Navigation, Footer, and Lightbox Elements.
 * This completely isolates layout changes to this single JavaScript file
 * and avoids fetching HTML over CORS, supporting direct local execution.
 */
const navHtml = `
<nav id="main-nav" class="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/20">
  <div class="max-w-7xl mx-auto px-6 sm:px-10">
    <div class="flex items-center justify-between h-16 md:h-20">
      <a href="index.html" class="flex items-center">
        <img src="images/logo.png" alt="Portfolio" class="h-5 w-auto opacity-90 hover:opacity-100 transition-opacity" />
      </a>
      
      <!-- Desktop Nav -->
      <div class="hidden md:flex items-center gap-10" id="nav-links">
        <a href="index.html" data-page="index.html" class="nav-link text-text-muted hover:text-white text-sm font-bold tracking-normal transition-colors">Home</a>
        <a href="drone-shots.html" data-page="drone-shots.html" class="nav-link text-text-muted hover:text-white text-sm font-bold tracking-normal transition-colors">Drone</a>
        <a href="framed-moments.html" data-page="framed-moments.html" class="nav-link text-text-muted hover:text-white text-sm font-bold tracking-normal transition-colors">Framed</a>
        <a href="school-events.html" data-page="school-events.html" class="nav-link text-text-muted hover:text-white text-sm font-bold tracking-normal transition-colors">Events</a>
        <a href="video-projects.html" data-page="video-projects.html" class="nav-link text-text-muted hover:text-white text-sm font-bold tracking-normal transition-colors">Videos</a>
      </div>
      
      <div class="hidden md:flex items-center gap-6" id="nav-cta">
        <a href="index.html#contact" class="px-6 py-2.5 bg-white text-black text-sm font-bold rounded-full hover:bg-opacity-90 transition-all hover:scale-105">Contact</a>
      </div>

      <!-- Mobile Menu Button -->
      <button id="hamburger" class="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Menu">
        <svg id="ham-icon" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16"/></svg>
        <svg id="close-icon" class="w-6 h-6 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- Mobile Menu -->
    <div id="mobile-menu" class="closed md:hidden">
      <div class="py-6 flex flex-col gap-5 border-t border-white/10">
        <a href="index.html" data-page="index.html" class="text-text-muted hover:text-white text-2xl font-bold transition-colors">Home</a>
        <a href="drone-shots.html" data-page="drone-shots.html" class="text-text-muted hover:text-white text-2xl font-bold transition-colors">Drone Shots</a>
        <a href="framed-moments.html" data-page="framed-moments.html" class="text-text-muted hover:text-white text-2xl font-bold transition-colors">Framed Moments</a>
        <a href="school-events.html" data-page="school-events.html" class="text-text-muted hover:text-white text-2xl font-bold transition-colors">School Events</a>
        <a href="video-projects.html" data-page="video-projects.html" class="text-text-muted hover:text-white text-2xl font-bold transition-colors">Video Projects</a>
        <div class="pt-4 border-t border-white/10">
          <a href="index.html#contact" class="block text-center w-full py-3 rounded-full text-lg font-bold bg-white text-black">Get in Touch</a>
        </div>
      </div>
    </div>
  </div>
</nav>
`;

const footerHtml = `
<footer id="site-footer" class="bg-bg border-t border-border py-8 md:py-12">
  <div class="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
    <div class="flex flex-col items-center md:items-start gap-2">
       <span class="text-white text-sm"><span class="font-bold">JC</span><span class="font-light">Niñonuevo</span> &copy; <span class="year"></span></span>
       <p class="text-text-muted text-xs">Bacolod City, Philippines</p>
    </div>
    <div class="flex flex-wrap justify-center gap-8">
       <a href="index.html" data-page="index.html" class="text-text-muted hover:text-white text-sm font-bold transition-colors">Home</a>
       <a href="drone-shots.html" data-page="drone-shots.html" class="text-text-muted hover:text-white text-sm font-bold transition-colors">Drone</a>
       <a href="framed-moments.html" data-page="framed-moments.html" class="text-text-muted hover:text-white text-sm font-bold transition-colors">Framed</a>
       <a href="school-events.html" data-page="school-events.html" class="text-text-muted hover:text-white text-sm font-bold transition-colors">Events</a>
       <a href="video-projects.html" data-page="video-projects.html" class="text-text-muted hover:text-white text-sm font-bold transition-colors">Videos</a>
    </div>
    <p class="text-text-muted text-xs font-bold">Updated March 2026</p>
  </div>
</footer>
`;

const imageLightboxHtml = `
<div id="lightbox" class="fixed inset-0 z-[9999] bg-black/98 hidden flex-col items-center justify-center p-4 md:p-8" role="dialog" aria-modal="true" aria-label="Image lightbox">
  <button onclick="closeLightbox()" aria-label="Close lightbox"
    class="absolute top-6 right-6 z-50 w-12 h-12 flex items-center justify-center text-white bg-black/50 backdrop-blur-md hover:bg-white/10 transition-all rounded-full border border-white/10">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  </button>
  <button onclick="prevImage()" aria-label="Previous image"
    class="absolute left-4 md:left-12 lg:left-24 xl:left-40 top-1/2 -translate-y-1/2 z-50 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-white bg-black/50 backdrop-blur-md hover:bg-white/10 transition-all border border-white/10 rounded-full">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19l-7-7 7-7"/>
    </svg>
  </button>
  <button onclick="nextImage()" aria-label="Next image"
    class="absolute right-4 md:right-12 lg:right-24 xl:right-40 top-1/2 -translate-y-1/2 z-50 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-white bg-black/50 backdrop-blur-md hover:bg-white/10 transition-all border border-white/10 rounded-full">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7"/>
    </svg>
  </button>
  <img id="lightbox-img" src="" alt="" class="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
  <p id="lightbox-counter" class="absolute bottom-6 text-white text-xs font-bold tracking-normal" aria-live="polite"></p>
</div>
`;

const videoLightboxHtml = `
<div id="video-lightbox" class="fixed inset-0 z-[9999] bg-black/98 hidden flex-col items-center justify-center p-4 md:p-8" role="dialog" aria-modal="true" aria-label="Video lightbox">
  <button onclick="closeVideoLightbox()" aria-label="Close lightbox"
    class="absolute top-6 right-6 z-50 w-12 h-12 flex items-center justify-center text-white bg-black/50 backdrop-blur-md hover:bg-white/10 transition-all rounded-full border border-white/10">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  </button>
  <div id="video-player-container" class="w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
    <iframe id="video-iframe" class="w-full h-full"
      src="" title="Video Player" frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin">
    </iframe>
  </div>
  <p id="video-title" class="text-white text-lg font-bold mt-6 text-center"></p>
</div>
`;

/**
 * Dynamic Component Injector
 */
function injectComponents() {
    // Determine current page context
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    // Normalize page names by stripping the .html extension to support clean/extensionless URLs
    const normPage = page.replace(/\.html$/, '') || 'index';

    // 1. Inject Navbar
    if (!document.getElementById('main-nav')) {
        document.body.insertAdjacentHTML('afterbegin', navHtml);
    }

    // Toggle Nav Link Active classes
    document.querySelectorAll('#nav-links a, #mobile-menu a').forEach(a => {
        const pageAttr = a.getAttribute('data-page');
        if (pageAttr) {
            const normAttr = pageAttr.replace(/\.html$/, '');
            if (normPage === normAttr || (normPage === 'index' && normAttr === 'index')) {
                a.classList.remove('text-text-muted');
                a.classList.add('text-white', 'active');
            } else {
                a.classList.remove('text-white', 'active');
                a.classList.add('text-text-muted');
            }
        }
    });

    // 2. Inject Lightboxes
    if (normPage !== 'video-projects') {
        if (!document.getElementById('lightbox')) {
            document.body.insertAdjacentHTML('beforeend', imageLightboxHtml);
        }
    } else {
        if (!document.getElementById('video-lightbox')) {
            document.body.insertAdjacentHTML('beforeend', videoLightboxHtml);
        }
    }

    // 3. Inject Footer
    if (!document.getElementById('site-footer')) {
        document.body.insertAdjacentHTML('beforeend', footerHtml);
    }

    // Toggle Footer Link Active classes
    document.querySelectorAll('#site-footer a').forEach(a => {
        const pageAttr = a.getAttribute('data-page');
        if (pageAttr) {
            const normAttr = pageAttr.replace(/\.html$/, '');
            if (normPage === normAttr || (normPage === 'index' && normAttr === 'index')) {
                a.classList.remove('text-text-muted');
                a.classList.add('text-white');
            } else {
                a.classList.remove('text-white');
                a.classList.add('text-text-muted');
            }
        }
    });
}

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
    
    // Remote any duplicate events
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', () => {
        open = !open;
        menu.classList.toggle('open', open);
        menu.classList.toggle('closed', !open);
        const hamIcon = document.getElementById('ham-icon');
        const closeIcon = document.getElementById('close-icon');
        if (hamIcon) hamIcon.classList.toggle('hidden', open);
        if (closeIcon) closeIcon.classList.toggle('hidden', !open);
    });

    // Close menu on link click
    menu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            open = false;
            menu.classList.add('closed');
            menu.classList.remove('open');
            const hamIcon = document.getElementById('ham-icon');
            const closeIcon = document.getElementById('close-icon');
            if (hamIcon) hamIcon.classList.remove('hidden');
            if (closeIcon) closeIcon.classList.add('hidden');
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
 * Premium Interactive Effects: Mouse-Tilt Card Glare
 */
function initInteractiveEffects() {
    // Mouse Glare overlay tracking on categories & project cards
    const cards = document.querySelectorAll('.service-card, .video-card, #selected-work > div > div');
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
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
        const probe = new Image();
        probe.src = webpSrc;

        // Helper to perform the actual source swap
        const startLoading = () => {
            img.src = webpSrc;
            img.alt = p.alt || p.title || 'Portfolio Image';
            
            // Show loading state if not already cached
            if (!probe.complete) {
                img.classList.add('lb-loading');
            }
        };

        // Transition: Fade out the old image before showing the new one
        if (window.gsap && (direction === 'next' || direction === 'prev')) {
            gsap.to(img, { 
                opacity: 0, 
                x: direction === 'next' ? -30 : 30, 
                duration: 0.1, 
                ease: 'power2.inOut',
                onComplete: startLoading
            });
        } else {
            // Instant hide for initial open or jumps
            if (window.gsap) gsap.killTweensOf(img);
            img.style.opacity = '0';
            startLoading();
        }

        // Trigger smooth entry once loaded
        img.onload = function() {
            img.classList.remove('lb-loading');
            
            if (window.gsap) {
                let xOffset = 0;
                if (direction === 'next') xOffset = 30;
                if (direction === 'prev') xOffset = -30;

                gsap.fromTo(img,
                    { 
                        x: xOffset, 
                        opacity: 0, 
                        scale: direction === 'open' ? 0.96 : 0.99 
                    },
                    { 
                        x: 0, 
                        opacity: 1, 
                        scale: 1, 
                        duration: 0.25, 
                        ease: 'power2.out',
                        clearProps: 'transform'
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
