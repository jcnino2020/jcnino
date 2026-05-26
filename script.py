import json, os, re, ast

# Central Database Dynamic Loader
def load_gallery_data():
    with open("assets/gallery-data.js", "r", encoding="utf-8") as f:
        content = f.read()
    start_idx = content.find("{")
    end_idx = content.rfind("}")
    js_str = content[start_idx:end_idx+1]
    
    # 1. Single-pass regex to match comments, string literals, and unquoted keys
    pattern = re.compile(
        r'(?P<comment>//.*?$|/\*.*?\*/)'
        r'|(?P<string>"[^"\\]*(?:\\.[^"\\]*)*"|\'[^\'\\]*(?:\\.[^\'\\]*)*\')'
        r'|(?P<key>\b[a-zA-Z_][a-zA-Z0-9_]*)\s*:',
        re.MULTILINE | re.DOTALL
    )
    
    def replacer(match):
        if match.group('comment'):
            return ''  # Strip comments
        elif match.group('string'):
            return match.group('string')  # Leave strings untouched
        else:
            return f'"{match.group("key")}":'  # Quote unquoted keys
            
    js_str = pattern.sub(replacer, js_str)
    
    # 2. Replace JS keywords with Python equivalents (safely avoiding strings)
    keyword_pattern = re.compile(
        r'(?P<string>"[^"\\]*(?:\\.[^"\\]*)*"|\'[^\'\\]*(?:\\.[^\'\\]*)*\')'
        r'|\b(?P<kw>true|false|null)\b',
        re.DOTALL
    )
    
    def keyword_replacer(match):
        if match.group('string'):
            return match.group('string')
        else:
            kw = match.group('kw')
            if kw == 'true': return 'True'
            if kw == 'false': return 'False'
            if kw == 'null': return 'None'
            return kw
            
    js_str = keyword_pattern.sub(keyword_replacer, js_str)
    
    # 3. Parse with Python AST
    return ast.literal_eval(js_str)

# Extract configurations from database settings node with safe fallbacks
try:
    data = load_gallery_data()
    settings = data.get("settings", {})
except Exception as e:
    print("Warning: could not parse settings from assets/gallery-data.js, using default values:", e)
    settings = {}

# Map theme presets to color palettes
theme = settings.get("theme", "obsidian")
if theme == "cyberpunk":
    accent_color = "#a855f7"      # Electric violet
    accent_dim = "168, 85, 247"
elif theme == "emerald":
    accent_color = "#10b981"      # Emerald green
    accent_dim = "16, 185, 129"
elif theme == "amber":
    accent_color = "#f59e0b"      # Amber sunset
    accent_dim = "245, 158, 11"
else: # obsidian or default
    accent_color = "#ffffff"      # Obsidian gold / pure white
    accent_dim = "255, 255, 255"

site_title = settings.get("siteTitle", "JC Niñonuevo | Photo & Video")
hero_eyebrow = settings.get("heroEyebrow", "Photography & Video")
hero_title = settings.get("heroTitle", "Capturing<br/><span class=\"font-bold italic\">Moments.</span>")
hero_subtitle = settings.get("heroSubtitle", "Drone aerials, editorial frames, school event coverage & cinematic video — Bacolod City.")
about_heading = settings.get("aboutHeading", "The<br/>Photographer.")
about_bio1 = settings.get("aboutBio1", "3rd year IT student and photo/video editor for the school yearbook. Nikon Z50 with Viltrox primes, covering everything from drone aerials to school publication events.")
about_bio2 = settings.get("aboutBio2", "Based in Bacolod City, Philippines. Editing in Lightroom Classic and Final Cut Pro on an M5 MacBook Air.")

gear = settings.get("gear", {})
gear_camera = gear.get("camera", "Nikon Z50")
gear_lenses = gear.get("lenses", "Viltrox 25mm f/1.7 · 56mm f/1.7 · 85mm f/2 | Nikon 16-50mm VR · 50-250mm VR")
gear_editing = gear.get("editing", "Lightroom Classic · Final Cut Pro")
gear_machine = gear.get("machine", "M5 MacBook Air")
gear_storage = gear.get("storage", "T7 Shield 1TB · WD 2TB HDD")

socials = settings.get("socials", {})
social_instagram = socials.get("instagram", "https://instagram.com/jcnino")
social_behance = socials.get("behance", "https://behance.net/jcnino")
social_youtube = socials.get("youtube", "https://youtube.com/@jcnino")
social_email = socials.get("email", "your@email.com")

GALLERY_RENDER_JS = """
function buildCard(p, gallery) {
  const wrap = document.createElement('div');
  wrap.className = 'gallery-item relative rounded-xl overflow-hidden cursor-pointer border border-white/[0.06]';
  wrap.innerHTML = `
    <img src="${p.src}" alt="${p.alt}" loading="lazy"
      class="w-full h-auto block"
      onerror="this.src='https://placehold.co/900x600/111/333?text=Photo'" />
    <div class="img-overlay absolute inset-0 bg-black/40 flex items-end p-3" style="opacity:0;transition:opacity .2s;">
      <svg class="w-4 h-4 text-white/60 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
    </div>
  `;
  wrap.addEventListener('click', () => openLightbox(p, gallery));
  return wrap;
}
"""

def page_shell(title, active, body):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>{title}</title>
  <link rel="icon" type="image/png" href="images/favicon.png">
  
  <!-- SEO & Metadata -->
  <meta name="description" content="Photography & cinematography portfolio of JC Niñonuevo. Drone aerials, editorial street frames, and cinematic storytelling. Based in Bacolod City.">
  
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="assets/portfolio.css">
  
  <script>
    tailwind.config = {{
      theme: {{
        extend: {{
          colors: {{
            'bg':    '#000000',
            'surface': '#0f0f0f',
            'border': '#1f1f1f',
            'text-main': '#ffffff',
            'text-muted': '#a0a0a0',
            'accent': '{accent_color}',
          }},
          fontFamily: {{
            sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
          }},
        }},
      }},
    }}
  </script>
  <style>
    :root {{
      --accent: {accent_dim};
      --accent-color: {accent_color};
      --accent-glow: rgba({accent_dim}, 0.08);
    }}
    .text-accent {{
      color: {accent_color} !important;
    }}
    .border-accent {{
      border-color: {accent_color} !important;
    }}
    .bg-accent {{
      background-color: {accent_color} !important;
    }}
    .glow-hover:hover {{
      box-shadow: 0 0 25px rgba({accent_dim}, 0.15) !important;
    }}
  </style>
</head>
<body class="min-h-screen bg-black text-white" data-theme="{theme}">

<!-- Navigation -->
<nav class="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/[0.05]">
  <div class="max-w-7xl mx-auto px-6 sm:px-10">
    <div class="flex items-center justify-between h-20">
      <a href="index.html" class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full border border-accent/30 flex items-center justify-center font-bold text-xs bg-accent/5 text-accent">JN</div>
        <span class="text-white font-bold tracking-tight text-sm uppercase">JC NIÑONUEVO</span>
      </a>
      
      <!-- Desktop Nav -->
      <div class="hidden md:flex items-center gap-8">
        <a href="index.html" class="text-xs font-bold uppercase tracking-wider {'text-accent font-bold' if active == 'home' else 'text-text-muted hover:text-accent'} transition-colors">Home</a>
        <a href="drone-shots.html" class="text-xs font-bold uppercase tracking-wider {'text-accent font-bold' if active == 'drone' else 'text-text-muted hover:text-accent'} transition-colors">Drone</a>
        <a href="framed-moments.html" class="text-xs font-bold uppercase tracking-wider {'text-accent font-bold' if active == 'framed' else 'text-text-muted hover:text-accent'} transition-colors">Framed</a>
        <a href="school-events.html" class="text-xs font-bold uppercase tracking-wider {'text-accent font-bold' if active == 'events' else 'text-text-muted hover:text-accent'} transition-colors">Events</a>
        <a href="video-projects.html" class="text-xs font-bold uppercase tracking-wider {'text-accent font-bold' if active == 'video' else 'text-text-muted hover:text-accent'} transition-colors">Videos</a>
      </div>

      <a href="index.html#contact" class="hidden md:inline-flex px-6 py-2.5 border border-accent/25 hover:bg-accent hover:text-black font-bold text-xs rounded-full transition-all">Contact</a>
    </div>
  </div>
</nav>

<script src="assets/portfolio.js" defer></script>

{body}

<!-- Back to Top -->
<div class="flex justify-center py-12 border-t border-border">
  <button
    onclick="window.scrollTo({{top:0,behavior:'smooth'}})"
    aria-label="Back to top"
    class="flex items-center gap-2 px-6 py-3 border border-accent/20 text-white text-sm font-bold rounded-full hover:bg-accent hover:text-black transition-all duration-300 group">
    <svg class="w-4 h-4 transform group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
    </svg>
    Back to Top
  </button>
</div>


<!-- Lightbox Placeholder -->
<div id="lightbox-placeholder"></div>

<!-- GSAP + ScrollTrigger -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13/dist/ScrollTrigger.min.js"></script>

<script>
  gsap.registerPlugin(ScrollTrigger);
</script>

<script defer src="/_vercel/insights/script.js"></script>
</body>
</html>"""

def gallery_page(title, subtitle, tag, photos_js):
    return f"""
<div class="pt-20">
  <!-- Page Header -->
  <section id="page-header" class="pt-12 pb-6 md:py-16 border-b border-border">
    <div class="max-w-7xl mx-auto px-6 sm:px-10">
      <div class="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <p id="header-eyebrow" class="text-accent text-xs font-bold uppercase mb-4">{tag}</p>
          <h1 id="header-title" class="text-4xl sm:text-5xl text-white font-bold">{title}</h1>
          <p id="header-desc" class="text-text-muted text-lg max-w-lg mt-4">{subtitle}</p>
        </div>
        <div class="flex justify-end">
          <p id="photo-count" class="text-text-muted text-xs font-bold"></p>
        </div>
      </div>
    </div>
  </section>

  <!-- Gallery Grid -->
  <section class="pt-6 pb-12 md:py-16">
    <div class="max-w-7xl mx-auto px-6 sm:px-10">
      <div class="gallery-grid" id="main-grid"></div>
    </div>
  </section>
</div>

<script src="assets/gallery-data.js"></script>
<script>
  const allPhotos = {photos_js};

  {GALLERY_RENDER_JS}

  function renderGrid() {{
    const grid = document.getElementById('main-grid');
    if(!grid) return;
    grid.innerHTML = '';
    document.getElementById('photo-count').textContent = allPhotos.length + ' photos';
    allPhotos.forEach(p => grid.appendChild(buildCard(p, allPhotos)));

    requestAnimationFrame(() => {{
      ScrollTrigger.batch('#main-grid .gallery-item', {{
        onEnter: batch => gsap.fromTo(batch,
          {{ y: 50, opacity: 0 }},
          {{
            y: 0, opacity: 1,
            duration: 0.6,
            stagger: 0.07,
            ease: 'power3.out',
            clearProps: 'transform,opacity'
          }}
        ),
        once: true,
        start: 'top 95%'
      }});
    }});
  }}

  document.addEventListener('DOMContentLoaded', renderGrid);
</script>
"""

# Dynamic photo structures linking mapped assets
drone_photos = """window.galleryData.drone.map((p, i) => {
    const base = p.file.replace(/\\.[^/.]+$/, "");
    return {
      id: i,
      src: 'images/Drone%20Shots/' + p.file,
      srcDecoded: 'images/Drone Shots/' + p.file,
      subfolder: 'Drone Shots',
      base: base,
      alt: p.alt || ('Drone aerial photograph by JC Niñonuevo — ' + base)
    };
  })"""

framed_photos = """window.galleryData.framed.map((p, i) => {
    const base = p.file.replace(/\\.[^/.]+$/, "");
    return {
      id: i,
      src: 'images/Framed%20Moments/' + p.file,
      srcDecoded: 'images/Framed Moments/' + p.file,
      subfolder: 'Framed Moments',
      base: base,
      alt: p.alt || ('Framed moments photograph by JC Niñonuevo — ' + base)
    };
  })"""

school_photos = """window.galleryData.events.map((p, i) => {
    const base = p.file.replace(/\\.[^/.]+$/, "");
    return {
      id: i,
      src: 'images/School%20Events/' + p.file,
      srcDecoded: 'images/School Events/' + p.file,
      subfolder: 'School Events',
      base: base,
      alt: p.alt || ('School events photograph by JC Niñonuevo — ' + base)
    };
  })"""

all_highlights = """window.galleryData.highlights.map((p, i) => {
    const base = p.file.replace(/\\.[^/.]+$/, "");
    return {
      id: i,
      src: 'images/' + p.file,
      base: base,
      alt: p.alt || ('Portfolio photograph by JC Niñonuevo — ' + base)
    };
  })"""

# Define and build dynamic pages loop
pages = [
    ("drone-shots.html",    "drone",   "Drone Shots",    "drone",
     "Aerial perspectives. Landscapes, campuses, and skylines seen from above.",
     drone_photos),
    ("framed-moments.html", "framed",  "Framed Moments", "editorial",
     "Street, portrait, and documentary frames. Stories told through careful composition.",
     framed_photos),
    ("school-events.html",  "events",  "School Events",  "event coverage",
     "Publication-grade coverage of school activities, ceremonies, and campus life.",
     school_photos),
]

for fn, active, title, tag, subtitle, photos_js in pages:
    body = gallery_page(title, subtitle, tag, photos_js)
    with open(fn, "w", encoding="utf-8") as f:
        f.write(page_shell(f"{title} — Portfolio", active, body))
    print(f"{fn} ✓")

# Video page content definition
video_body = f"""
<div class="pt-20">
  <div class="page-hero">
    <div class="max-w-7xl mx-auto px-6 sm:px-10 py-16 md:py-20 fade-in">
      <p class="text-accent/40 text-xs font-mono uppercase tracking-[0.3em] mb-5">motion work</p>
      <h1 class="text-5xl md:text-6xl font-light text-white mb-4 tracking-tight">Video Projects</h1>
      <p class="text-white/30 text-base max-w-lg font-light leading-relaxed">
        Edited in Final Cut Pro on {gear_machine}. Reels, cinematic films, and B-roll cuts.
      </p>
    </div>
  </div>
  <section class="py-12">
    <div class="max-w-7xl mx-auto px-6 sm:px-10">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="video-grid"></div>
    </div>
  </section>
</div>
<script src="assets/gallery-data.js"></script>
<script>
  const videos = window.galleryData.videos.concat(window.galleryData.videos2 || []);
  const grid = document.getElementById('video-grid');
  
  videos.forEach(v => {{
    const card = document.createElement('div');
    card.className = 'video-card group relative rounded-xl overflow-hidden cursor-pointer bg-surface border border-border hover:border-accent/40 transition-all duration-300';
    card.innerHTML = `
      <div class="relative aspect-video overflow-hidden bg-bg">
        <img src="${{v.thumb}}" alt="${{v.title}}"
          onerror="this.src='${{v.thumbFallback}}'; this.onerror=function(){{this.src='images/favicon.png'}}"
          class="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-12 h-12 rounded-full border border-accent/30 flex items-center justify-center
            group-hover:border-accent/70 group-hover:scale-110 transition-all duration-300 bg-black/40">
            <svg class="w-4 h-4 text-accent ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <span class="absolute bottom-2 right-2 text-white/40 text-xs font-mono">${{v.duration}}</span>
      </div>
      <div class="p-5">
        <h3 class="text-white/80 font-medium text-sm mb-1.5">${{v.title}}</h3>
        <p class="text-white/25 text-xs leading-relaxed mb-4 font-light">Cinematic edit — YouTube: ${{v.youtubeId}}</p>
      </div>
    `;
    card.addEventListener('click', () => openLightbox({{src: 'https://www.youtube.com/embed/' + v.youtubeId + '?autoplay=1'}}, []));
    grid.appendChild(card);
  }});
</script>
"""

with open("video-projects.html", "w", encoding="utf-8") as f:
    f.write(page_shell("Video Projects — Portfolio", "video", video_body))
print("video-projects.html ✓")

# Index Page dynamic content
index_body = f"""
<div>
  <section id="home" class="relative min-h-screen bg-black flex items-center justify-center overflow-hidden">
    <div class="absolute inset-0 pointer-events-none"
      style="background:radial-gradient(ellipse 100% 70% at 50% 30%,rgba(255,255,255,0.02) 0%,transparent 70%);"></div>
    <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>
    <div class="relative z-10 text-center px-6 max-w-4xl mx-auto fade-in">
      <p class="text-accent/30 text-xs font-mono uppercase tracking-[0.4em] mb-10">{hero_eyebrow}</p>
      <h1 class="text-6xl md:text-8xl font-extralight text-white mb-6 leading-none tracking-tight">
        {hero_title}
      </h1>
      <p class="text-white/30 text-base md:text-lg max-w-xl mx-auto mb-12 font-light leading-relaxed">
        {hero_subtitle}
      </p>
      <div class="flex flex-wrap gap-4 justify-center">
        <a href="#gallery" class="px-8 py-3 rounded-full text-xs font-mono uppercase tracking-widest bg-accent text-black hover:bg-opacity-90 transition-all font-bold">View Gallery</a>
        <a href="#contact" class="px-8 py-3 rounded-full text-xs font-mono uppercase tracking-widest border border-accent/25 text-white hover:bg-accent/5 transition-all font-bold">Contact</a>
      </div>
    </div>
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
      <svg class="w-4 h-4 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 9l-7 7-7-7"/>
      </svg>
    </div>
  </section>

  <section class="py-16 bg-black border-y border-white/[0.05]">
    <div class="max-w-7xl mx-auto px-5 sm:px-8">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.05]">
        <a href="drone-shots.html" class="group bg-black hover:bg-surface transition-colors p-8 flex flex-col gap-5 border border-white/[0.03]">
          <p class="text-white/15 text-xs font-mono uppercase tracking-widest">01</p>
          <h3 class="text-white/70 group-hover:text-accent font-light text-xl transition-colors">Drone Shots</h3>
          <p class="text-white/20 text-xs font-light leading-relaxed">Aerial perspective — landscapes &amp; cityscapes.</p>
          <div class="mt-auto"><svg class="w-4 h-4 text-white/20 group-hover:text-accent transition-all group-hover:translate-x-1 transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg></div>
        </a>
        <a href="framed-moments.html" class="group bg-black hover:bg-surface transition-colors p-8 flex flex-col gap-5 border border-white/[0.03]">
          <p class="text-white/15 text-xs font-mono uppercase tracking-widest">02</p>
          <h3 class="text-white/70 group-hover:text-accent font-light text-xl transition-colors">Framed Moments</h3>
          <p class="text-white/20 text-xs font-light leading-relaxed">Street, editorial &amp; documentary frames.</p>
          <div class="mt-auto"><svg class="w-4 h-4 text-white/20 group-hover:text-accent transition-all group-hover:translate-x-1 transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg></div>
        </a>
        <a href="school-events.html" class="group bg-black hover:bg-surface transition-colors p-8 flex flex-col gap-5 border border-white/[0.03]">
          <p class="text-white/15 text-xs font-mono uppercase tracking-widest">03</p>
          <h3 class="text-white/70 group-hover:text-accent font-light text-xl transition-colors">School Events</h3>
          <p class="text-white/20 text-xs font-light leading-relaxed">Yearbook-grade event &amp; ceremony coverage.</p>
          <div class="mt-auto"><svg class="w-4 h-4 text-white/20 group-hover:text-accent transition-all group-hover:translate-x-1 transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg></div>
        </a>
        <a href="video-projects.html" class="group bg-black hover:bg-surface transition-colors p-8 flex flex-col gap-5 border border-white/[0.03]">
          <p class="text-white/15 text-xs font-mono uppercase tracking-widest">04</p>
          <h3 class="text-white/70 group-hover:text-accent font-light text-xl transition-colors">Video Projects</h3>
          <p class="text-white/20 text-xs font-light leading-relaxed">FCP edits — reels, films &amp; B-roll.</p>
          <div class="mt-auto"><svg class="w-4 h-4 text-white/20 group-hover:text-accent transition-all group-hover:translate-x-1 transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg></div>
        </a>
      </div>
    </div>
  </section>

  <section id="gallery" class="py-20 bg-surface">
    <div class="max-w-7xl mx-auto px-5 sm:px-8">
      <div class="flex items-end justify-between mb-12 flex-wrap gap-4 border-b border-white/5 pb-6">
        <div>
          <p class="text-accent/30 text-xs font-mono uppercase tracking-[0.3em] mb-3">Selected work</p>
          <h2 class="text-3xl font-light text-white">Gallery Highlights</h2>
        </div>
      </div>
      <div class="gallery-grid" id="highlights-grid"></div>
      <div class="text-center mt-14 pt-8 border-t border-white/[0.05]">
        <a href="drone-shots.html" class="inline-flex items-center gap-3 px-8 py-3 rounded-full text-xs font-mono uppercase tracking-widest border border-accent/20 text-white hover:bg-accent/5 transition-all">
          Browse full archive
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
        </a>
      </div>
    </div>
  </section>

  <section id="about" class="py-20 bg-black border-y border-white/[0.05]">
    <div class="max-w-7xl mx-auto px-5 sm:px-8">
      <div class="grid md:grid-cols-2 gap-20 items-start">
        <div class="fade-in">
          <p class="text-accent/30 text-xs font-mono uppercase tracking-[0.3em] mb-5">About</p>
          <h2 class="text-4xl font-light text-white mb-8 leading-snug">{about_heading}</h2>
          <p class="text-white/40 leading-relaxed mb-5 font-light text-sm">{about_bio1}</p>
          <p class="text-white/40 leading-relaxed mb-5 font-light text-sm">{about_bio2}</p>
        </div>
        <div class="fade-in space-y-2">
          <p class="text-accent/30 text-xs font-mono uppercase tracking-[0.3em] mb-5">Gear Checklist</p>
          <div class="flex justify-between items-center py-4 border-b border-white/[0.06]"><span class="text-white/30 text-xs font-mono uppercase tracking-widest">Camera</span><span class="text-white/60 text-sm font-light">{gear_camera}</span></div>
          <div class="flex justify-between items-start py-4 border-b border-white/[0.06] gap-4"><span class="text-white/30 text-xs font-mono uppercase tracking-widest flex-shrink-0">Lenses</span><div class="text-right"><p class="text-white/60 text-sm font-light">{gear_lenses.split('|')[0].strip()}</p><p class="text-white/40 text-xs font-light mt-0.5">{gear_lenses.split('|')[1].strip() if '|' in gear_lenses else ''}</p></div></div>
          <div class="flex justify-between items-center py-4 border-b border-white/[0.06]"><span class="text-white/30 text-xs font-mono uppercase tracking-widest">Editing</span><span class="text-white/60 text-sm font-light">{gear_editing}</span></div>
          <div class="flex justify-between items-center py-4 border-b border-white/[0.06]"><span class="text-white/30 text-xs font-mono uppercase tracking-widest">Machine</span><span class="text-white/60 text-sm font-light">{gear_machine}</span></div>
          <div class="flex justify-between items-center py-4"><span class="text-white/30 text-xs font-mono uppercase tracking-widest">Storage</span><span class="text-white/60 text-sm font-light text-right">{gear_storage}</span></div>
        </div>
      </div>
    </div>
  </section>

  <section id="contact" class="py-20 bg-surface">
    <div class="max-w-2xl mx-auto px-5 sm:px-8 border border-white/5 bg-black/10 rounded-2xl p-8 md:p-12 shadow-2xl">
      <div class="mb-12 text-center">
        <p class="text-accent/30 text-xs font-mono uppercase tracking-[0.3em] mb-3">Contact</p>
        <h2 class="text-4xl font-light text-white mb-3">Get in Touch.</h2>
        <p class="text-white/30 text-sm font-light">Available for event coverage, yearbook assignments, or creative collaborations.</p>
      </div>
      <form id="contact-form" onsubmit="handleSubmit(event)" class="space-y-5">
        <div class="grid sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-white/20 text-xs font-mono uppercase tracking-widest mb-2">Name</label>
            <input type="text" placeholder="Your name" required class="w-full bg-surface border border-white/[0.08] text-white/70 placeholder-white/15 rounded-xl px-4 py-3 text-sm font-light outline-none focus:border-white/30" />
          </div>
          <div>
            <label class="block text-white/20 text-xs font-mono uppercase tracking-widest mb-2">Email</label>
            <input type="email" placeholder="{social_email}" required class="w-full bg-surface border border-white/[0.08] text-white/70 placeholder-white/15 rounded-xl px-4 py-3 text-sm font-light outline-none focus:border-white/30" />
          </div>
        </div>
        <div>
          <label class="block text-white/20 text-xs font-mono uppercase tracking-widest mb-2">Subject</label>
          <input type="text" placeholder="Event coverage, collaboration..." class="w-full bg-surface border border-white/[0.08] text-white/70 placeholder-white/15 rounded-xl px-4 py-3 text-sm font-light outline-none focus:border-white/30" />
        </div>
        <div>
          <label class="block text-white/20 text-xs font-mono uppercase tracking-widest mb-2">Message</label>
          <textarea rows="5" placeholder="Tell me about your project specifications..." required class="w-full bg-surface border border-white/[0.08] text-white/70 placeholder-white/15 rounded-xl px-4 py-3 text-sm resize-none font-light outline-none focus:border-white/30"></textarea>
        </div>
        <button type="submit" class="w-full py-3.5 bg-accent text-black rounded-full text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all shadow-lg glow-hover">

          Send Message
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
        </button>
        <p id="form-success" class="text-white/40 text-xs text-center font-mono hidden mt-3">✓ Message sent! I'll get back to you shortly.</p>
      </form>
    </div>
  </section>
</div>

<script src="assets/gallery-data.js"></script>
<script>
  const allPhotos = {all_highlights};
  {GALLERY_RENDER_JS}

  function renderHighlights() {{
    const grid = document.getElementById('highlights-grid');
    if (!grid) return;
    grid.innerHTML = '';
    allPhotos.forEach(p => grid.appendChild(buildCard(p, allPhotos)));
    
    requestAnimationFrame(() => {{
      ScrollTrigger.batch('#highlights-grid .gallery-item', {{
        onEnter: batch => gsap.fromTo(batch,
          {{ y: 50, opacity: 0 }},
          {{
            y: 0, opacity: 1,
            duration: 0.6,
            stagger: 0.06,
            ease: 'power3.out',
            clearProps: 'transform,opacity'
          }}
        ),
        once: true,
        start: 'top 92%'
      }});
    }});
  }}
  
  function handleSubmit(e) {{
    e.preventDefault();
    document.getElementById('form-success').classList.remove('hidden');
    e.target.reset();
    setTimeout(() => document.getElementById('form-success').classList.add('hidden'), 5000);
  }}
  
  document.addEventListener('DOMContentLoaded', renderHighlights);
</script>
"""

with open("index.html", "w", encoding="utf-8") as f:
    f.write(page_shell(site_title, "home", index_body))
print("index.html ✓")

print("\nAll files compiled successfully:")
for fn in ['index.html', 'drone-shots.html', 'framed-moments.html', 'school-events.html', 'video-projects.html']:
    print(f"  {fn:<26} {os.path.getsize(fn):>7,} bytes")
