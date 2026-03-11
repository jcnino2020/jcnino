
import json, os

# Only the card renderer changes — everything else stays identical
GALLERY_RENDER_JS = """
function buildCard(p, gallery) {
  const wrap = document.createElement('div');
  wrap.className = 'gallery-item relative rounded-xl overflow-hidden cursor-pointer border border-white/[0.06]';
  wrap.innerHTML = `
    <img src="${p.src}" alt="${p.title}" loading="lazy"
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

# Rebuild all pages with the updated card renderer
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
    with open(fn,"w",encoding="utf-8") as f:
        f.write(page_shell(f"{title} — Portfolio", active, body))
    print(f"{fn} ✓")

# Video page — same as before, no card renderer used there
video_body = """
<div class="pt-14">
  <div class="page-hero">
    <div class="max-w-7xl mx-auto px-5 sm:px-8 py-20 fade-in">
      <p class="text-white/20 text-xs font-mono uppercase tracking-[0.3em] mb-5">motion work</p>
      <h1 class="text-5xl md:text-6xl font-light text-white mb-4 tracking-tight">Video Projects</h1>
      <p class="text-white/30 text-base max-w-lg font-light leading-relaxed">
        Edited in Final Cut Pro on M1 MacBook Air. Reels, cinematic films, and B-roll cuts.
      </p>
    </div>
  </div>
  <section class="py-14">
    <div class="max-w-7xl mx-auto px-5 sm:px-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" id="video-grid"></div>
    </div>
  </section>
</div>
<script>
  const videos = [
    {id:1,title:'School Highlights Reel 2024',desc:'End-of-year montage covering key school events and milestones.',
     thumb:'https://placehold.co/640x360/111/333?text=School+Reel',duration:'3:42',tags:['Event','FCP']},
    {id:2,title:'Graduation Day Cinematic',desc:'Cinematic edit of graduation ceremonies with color-graded footage.',
     thumb:'https://placehold.co/640x360/0d0d0d/333?text=Grad+Day',duration:'5:18',tags:['Cinematic','FCP']},
    {id:3,title:'Campus Life B-Roll',desc:'Atmospheric walk around campus — handheld and drone footage.',
     thumb:'https://placehold.co/640x360/151515/333?text=B-Roll',duration:'2:05',tags:['B-Roll','Drone']},
    {id:4,title:'Yearbook Feature Film',desc:'Documentary-style yearbook video featuring student profiles.',
     thumb:'https://placehold.co/640x360/111/333?text=Yearbook',duration:'8:30',tags:['Documentary','Yearbook']},
    {id:5,title:'Sports Day Coverage',desc:'Fast-paced edit of intramural sports day highlights.',
     thumb:'https://placehold.co/640x360/0a0a0a/333?text=Sports',duration:'4:12',tags:['Sports','Fast-Cut']},
    {id:6,title:'Organization Intro Reel',desc:'Short intro reel for a student organization.',
     thumb:'https://placehold.co/640x360/131313/333?text=Org+Reel',duration:'1:30',tags:['Branding','Motion']},
  ];
  const grid=document.getElementById('video-grid');
  videos.forEach(v=>{
    const card=document.createElement('div');
    card.className='card-item group relative overflow-hidden rounded-xl bg-ink-3 border border-white/[0.06] cursor-pointer';
    card.innerHTML=`
      <div class="relative aspect-video overflow-hidden bg-ink-4">
        <img src="${v.thumb}" alt="${v.title}"
          class="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center
            group-hover:border-white/70 group-hover:scale-110 transition-all duration-300 bg-black/40">
            <svg class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <span class="absolute bottom-2 right-2 text-white/40 text-xs font-mono">${v.duration}</span>
      </div>
      <div class="p-5">
        <h3 class="text-white/80 font-medium text-sm mb-1.5">${v.title}</h3>
        <p class="text-white/25 text-xs leading-relaxed mb-4 font-light">${v.desc}</p>
        <div class="flex gap-2 flex-wrap">
          ${v.tags.map(t=>`<span class="text-xs text-white/30 border border-white/10 px-2.5 py-0.5 rounded-full font-mono">${t}</span>`).join('')}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
</script>
"""
with open("video-projects.html","w",encoding="utf-8") as f:
    f.write(page_shell("Video Projects — Portfolio","video",video_body))
print("video-projects.html ✓")

# Index — same body as before, just rebuild with updated GALLERY_RENDER_JS in scope
index_body = f"""
<div>
  <section id="home" class="relative min-h-screen bg-black flex items-center justify-center overflow-hidden">
    <div class="absolute inset-0 pointer-events-none"
      style="background:radial-gradient(ellipse 100% 70% at 50% 30%,rgba(255,255,255,0.02) 0%,transparent 70%);"></div>
    <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>
    <div class="relative z-10 text-center px-6 max-w-4xl mx-auto fade-in">
      <p class="text-white/20 text-xs font-mono uppercase tracking-[0.4em] mb-10">Photography &amp; Video</p>
      <h1 class="text-6xl md:text-8xl font-extralight text-white mb-6 leading-none tracking-tight">
        Capturing<br/><span class="font-bold italic">Moments.</span>
      </h1>
      <p class="text-white/30 text-base md:text-lg max-w-xl mx-auto mb-12 font-light leading-relaxed">
        Drone aerials, editorial frames, school event coverage &amp; cinematic video — Bacolod City.
      </p>
      <div class="flex flex-wrap gap-4 justify-center">
        <a href="#gallery" class="btn-white px-8 py-3 rounded-full text-sm uppercase tracking-widest">View Gallery</a>
        <a href="#contact" class="btn-outline px-8 py-3 rounded-full text-sm uppercase tracking-widest">Contact</a>
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
        <a href="drone-shots.html" class="group bg-black hover:bg-ink-3 transition-colors p-8 flex flex-col gap-5">
          <p class="text-white/15 text-xs font-mono uppercase tracking-widest">01</p>
          <h3 class="text-white/70 group-hover:text-white font-light text-xl transition-colors">Drone Shots</h3>
          <p class="text-white/20 text-xs font-light leading-relaxed">Aerial perspective — landscapes &amp; cityscapes.</p>
          <div class="mt-auto"><svg class="w-4 h-4 text-white/20 group-hover:text-white/60 transition-all group-hover:translate-x-1 transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg></div>
        </a>
        <a href="framed-moments.html" class="group bg-black hover:bg-ink-3 transition-colors p-8 flex flex-col gap-5">
          <p class="text-white/15 text-xs font-mono uppercase tracking-widest">02</p>
          <h3 class="text-white/70 group-hover:text-white font-light text-xl transition-colors">Framed Moments</h3>
          <p class="text-white/20 text-xs font-light leading-relaxed">Street, editorial &amp; documentary frames.</p>
          <div class="mt-auto"><svg class="w-4 h-4 text-white/20 group-hover:text-white/60 transition-all group-hover:translate-x-1 transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg></div>
        </a>
        <a href="school-events.html" class="group bg-black hover:bg-ink-3 transition-colors p-8 flex flex-col gap-5">
          <p class="text-white/15 text-xs font-mono uppercase tracking-widest">03</p>
          <h3 class="text-white/70 group-hover:text-white font-light text-xl transition-colors">School Events</h3>
          <p class="text-white/20 text-xs font-light leading-relaxed">Yearbook-grade event &amp; ceremony coverage.</p>
          <div class="mt-auto"><svg class="w-4 h-4 text-white/20 group-hover:text-white/60 transition-all group-hover:translate-x-1 transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg></div>
        </a>
        <a href="video-projects.html" class="group bg-black hover:bg-ink-3 transition-colors p-8 flex flex-col gap-5">
          <p class="text-white/15 text-xs font-mono uppercase tracking-widest">04</p>
          <h3 class="text-white/70 group-hover:text-white font-light text-xl transition-colors">Video Projects</h3>
          <p class="text-white/20 text-xs font-light leading-relaxed">FCP edits — reels, films &amp; B-roll.</p>
          <div class="mt-auto"><svg class="w-4 h-4 text-white/20 group-hover:text-white/60 transition-all group-hover:translate-x-1 transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg></div>
        </a>
      </div>
    </div>
  </section>

  <section id="gallery" class="py-20 bg-ink-2">
    <div class="max-w-7xl mx-auto px-5 sm:px-8">
      <div class="flex items-end justify-between mb-12 flex-wrap gap-4">
        <div>
          <p class="text-white/20 text-xs font-mono uppercase tracking-[0.3em] mb-3">Selected work</p>
          <h2 class="text-3xl font-light text-white">Gallery Highlights</h2>
        </div>
        <div class="flex gap-3">
          <button class="tab-btn active px-5 py-1.5 text-xs font-mono uppercase tracking-widest" data-tab="all">All</button>
          <button class="tab-btn px-5 py-1.5 text-xs font-mono uppercase tracking-widest" data-tab="drone">Drone</button>
          <button class="tab-btn px-5 py-1.5 text-xs font-mono uppercase tracking-widest" data-tab="framed">Framed</button>
          <button class="tab-btn px-5 py-1.5 text-xs font-mono uppercase tracking-widest" data-tab="events">Events</button>
        </div>
      </div>
      <div class="gallery-grid" id="highlights-grid"></div>
      <div class="text-center mt-14 pt-8 border-t border-white/[0.05]">
        <a href="drone-shots.html" class="btn-outline inline-flex items-center gap-3 px-8 py-3 rounded-full text-xs font-mono uppercase tracking-widest">
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
          <p class="text-white/20 text-xs font-mono uppercase tracking-[0.3em] mb-5">About</p>
          <h2 class="text-4xl font-light text-white mb-8 leading-snug">The<br/>Photographer.</h2>
          <p class="text-white/40 leading-relaxed mb-5 font-light text-sm">3rd year IT student and photo/video editor for the school yearbook. Nikon Z50 with Viltrox primes, covering everything from drone aerials to school publication events.</p>
          <p class="text-white/40 leading-relaxed font-light text-sm">Based in Bacolod City, Philippines. Editing in Lightroom Classic and Final Cut Pro on an M1 MacBook Air.</p>
        </div>
        <div class="fade-in space-y-2">
          <p class="text-white/20 text-xs font-mono uppercase tracking-[0.3em] mb-5">Gear</p>
          <div class="flex justify-between items-center py-4 border-b border-white/[0.06]"><span class="text-white/30 text-xs font-mono uppercase tracking-widest">Camera</span><span class="text-white/60 text-sm font-light">Nikon Z50</span></div>
          <div class="flex justify-between items-start py-4 border-b border-white/[0.06] gap-4"><span class="text-white/30 text-xs font-mono uppercase tracking-widest flex-shrink-0">Lenses</span><div class="text-right"><p class="text-white/60 text-sm font-light">Viltrox 25mm f/1.7 · 56mm f/1.7 · 85mm f/2</p><p class="text-white/40 text-xs font-light mt-0.5">Nikon 16-50mm VR · 50-250mm VR</p></div></div>
          <div class="flex justify-between items-center py-4 border-b border-white/[0.06]"><span class="text-white/30 text-xs font-mono uppercase tracking-widest">Editing</span><span class="text-white/60 text-sm font-light">Lightroom Classic · Final Cut Pro</span></div>
          <div class="flex justify-between items-center py-4 border-b border-white/[0.06]"><span class="text-white/30 text-xs font-mono uppercase tracking-widest">Machine</span><span class="text-white/60 text-sm font-light">M1 MacBook Air</span></div>
          <div class="flex justify-between items-center py-4"><span class="text-white/30 text-xs font-mono uppercase tracking-widest">Storage</span><span class="text-white/60 text-sm font-light text-right">T7 Shield 1TB · WD 2TB HDD</span></div>
        </div>
      </div>
    </div>
  </section>

  <section id="contact" class="py-20 bg-ink-2">
    <div class="max-w-2xl mx-auto px-5 sm:px-8">
      <div class="mb-12 fade-in">
        <p class="text-white/20 text-xs font-mono uppercase tracking-[0.3em] mb-3">Contact</p>
        <h2 class="text-4xl font-light text-white mb-3">Get in Touch.</h2>
        <p class="text-white/30 text-sm font-light">Event coverage, yearbook work, or just a collab.</p>
      </div>
      <form id="contact-form" onsubmit="handleSubmit(event)" class="space-y-5 fade-in">
        <div class="grid sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-white/20 text-xs font-mono uppercase tracking-widest mb-2">Name</label>
            <input type="text" placeholder="Your name" required class="w-full bg-ink-3 border border-white/[0.08] text-white/70 placeholder-white/15 rounded-sm px-4 py-3 text-sm font-light" />
          </div>
          <div>
            <label class="block text-white/20 text-xs font-mono uppercase tracking-widest mb-2">Email</label>
            <input type="email" placeholder="your@email.com" required class="w-full bg-ink-3 border border-white/[0.08] text-white/70 placeholder-white/15 rounded-sm px-4 py-3 text-sm font-light" />
          </div>
        </div>
        <div>
          <label class="block text-white/20 text-xs font-mono uppercase tracking-widest mb-2">Subject</label>
          <input type="text" placeholder="Event coverage, yearbook, collab..." class="w-full bg-ink-3 border border-white/[0.08] text-white/70 placeholder-white/15 rounded-sm px-4 py-3 text-sm font-light" />
        </div>
        <div>
          <label class="block text-white/20 text-xs font-mono uppercase tracking-widest mb-2">Message</label>
          <textarea rows="5" placeholder="Tell me about your project..." required class="w-full bg-ink-3 border border-white/[0.08] text-white/70 placeholder-white/15 rounded-sm px-4 py-3 text-sm resize-none font-light"></textarea>
        </div>
        <button type="submit" class="btn-white w-full py-3.5 rounded-sm text-sm font-semibold uppercase tracking-widest flex items-center justify-center gap-2">
          Send Message
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
        </button>
        <p id="form-success" class="text-white/40 text-xs text-center font-mono hidden">Message sent. I'll get back to you.</p>
      </form>
    </div>
  </section>
</div>

<script>
  const allPhotos = {all_highlights};
  {GALLERY_RENDER_JS}
  function renderHighlights(filter) {{
    const grid = document.getElementById('highlights-grid');
    grid.innerHTML = '';
    const filtered = filter==='all' ? allPhotos : allPhotos.filter(p=>p.cat===filter);
    filtered.forEach(p => grid.appendChild(buildCard(p, filtered)));
  }}
  document.querySelectorAll('.tab-btn').forEach(btn=>{{
    btn.addEventListener('click',()=>{{
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderHighlights(btn.dataset.tab);
    }});
  }});
  function handleSubmit(e) {{
    e.preventDefault();
    document.getElementById('form-success').classList.remove('hidden');
    e.target.reset();
    setTimeout(()=>document.getElementById('form-success').classList.add('hidden'),5000);
  }}
  renderHighlights('all');
</script>
"""

with open("index.html","w",encoding="utf-8") as f:
    f.write(page_shell("Portfolio","home",index_body))
print("index.html ✓")

print("\nAll files:")
for fn in ['index.html','drone-shots.html','framed-moments.html','school-events.html','video-projects.html']:
    print(f"  {fn:<26} {os.path.getsize(fn):>7,} bytes")
