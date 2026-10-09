const page = document.body.dataset.page || 'home';
const activePage = {
  programs: 'academics', basic: 'academics', graduate: 'academics',
  scholarships: 'admissions', services: 'campus', mission: 'campus',
  article: 'news', contact: 'about'
}[page] || page;
const pages = [
  ['about', 'About', 'about.html'],
  ['academics', 'Academics', 'academics.html'],
  ['admissions', 'Admissions', 'admissions.html'],
  ['campus', 'Campus life', 'campus-life.html'],
  ['research', 'Research', 'research.html'],
  ['news', 'News', 'news.html']
];
const navLinks = pages.map(([key, label, href]) =>
  `<a href="${href}"${activePage === key ? ' aria-current="page"' : ''}>${label}</a>`
).join('');

document.querySelector('#site-header').innerHTML = `
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="utility"><div class="shell"><span>La Salle Avenue, Bacolod City, Philippines</span><div class="utility-links"><a href="https://aims.usls.edu.ph/lasalle/" target="_blank" rel="noopener noreferrer">Student accounts</a><a href="https://www.usls.edu.ph/" target="_blank" rel="noopener noreferrer">Official USLS site ↗</a></div></div></div>
  <header class="site-header"><div class="shell header-inner">
    <a class="logo" href="index.html" aria-label="University of St. La Salle home"><img src="https://www.usls.edu.ph/assets/img/logo.svg" alt="University of St. La Salle Bacolod"></a>
    <nav class="primary-nav" aria-label="Primary">${navLinks}</nav>
    <div class="header-actions"><a class="header-apply" href="admissions.html">Apply to USLS <i data-lucide="arrow-right" aria-hidden="true"></i></a><button class="menu-toggle" id="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav"><i data-lucide="menu" aria-hidden="true"></i></button></div>
  </div><nav class="mobile-nav" id="mobile-nav" aria-label="Mobile" hidden><div class="shell">${navLinks}<a href="admissions.html">Apply to USLS</a></div></nav></header>`;

document.querySelector('#site-footer').innerHTML = `
  <footer class="site-footer"><div class="shell"><div class="footer-grid">
    <div class="footer-brand"><strong>University of<br>St. La Salle</strong><p>Live Your Passion, Create Better Futures.</p><p>La Salle Avenue, Bacolod City 6100<br>+63 34 434 6100</p></div>
    <div class="footer-column"><h2>Explore</h2><a href="about.html">About USLS</a><a href="programs.html">Colleges &amp; programs</a><a href="basic-education.html">Basic education</a><a href="graduate-studies.html">Professional study</a></div>
    <div class="footer-column"><h2>Student life</h2><a href="scholarships.html">Scholarships</a><a href="student-services.html">Student services</a><a href="mission.html">Mission &amp; development</a><a href="news.html">University news</a></div>
    <div class="footer-column"><h2>Connect</h2><a href="contact.html">Contact &amp; directory</a><a href="https://aims.usls.edu.ph/lasalle/applicants/index.php" target="_blank" rel="noopener noreferrer">Applicant account ↗</a><a href="https://www.usls.edu.ph/" target="_blank" rel="noopener noreferrer">Official USLS site ↗</a></div>
  </div><div class="footer-bottom"><span>Independent website redesign concept by JC Niñonuevo. For current requirements and official information, visit <a href="https://www.usls.edu.ph/" target="_blank" rel="noopener noreferrer">usls.edu.ph</a>.</span><span>Content checked 9 October 2026.</span></div></div></footer>`;

const menuButton = document.querySelector('#menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu() {
  mobileNav.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
}
menuButton.addEventListener('click', () => {
  const opening = mobileNav.hidden;
  mobileNav.hidden = !opening;
  menuButton.setAttribute('aria-expanded', String(opening));
  menuButton.setAttribute('aria-label', opening ? 'Close menu' : 'Open menu');
});
mobileNav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuButton.focus(); }
});

const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];
function activateTab(tab, focus = false) {
  tabs.forEach(item => {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
  });
  panels.forEach(panel => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
  if (focus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', event => {
    const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (offset) { event.preventDefault(); activateTab(tabs[(index + offset + tabs.length) % tabs.length], true); }
  });
});
if (window.lucide) window.lucide.createIcons();
