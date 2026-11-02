/* Shared Studio navigation: grouped desktop rail and thumb-reachable mobile sheets. */
function initStudioMobileNavigation() {
  const sidebar=document.querySelector('.admin-sidebar');
  const backdrop=document.getElementById('mobile-drawer-backdrop');
  if(!sidebar||!backdrop)return;
  const icon=paths=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const icons={overview:icon('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),library:icon('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2h10M3 16l5-5 4 4 3-3 6 6"/><circle cx="16" cy="9" r="1"/>'),analytics:icon('<path d="M4 20V10m8 10V4m8 16v-7"/>'),more:icon('<path d="M4 6h16M4 12h16M4 18h16"/>')};
  const nav=document.createElement('nav');nav.className='studio-mobile-nav';nav.setAttribute('aria-label','Studio navigation');
  nav.innerHTML=`<a href="/admin/index.html?cat=overview" data-mobile-destination="overview">${icons.overview}<span>Overview</span></a><button type="button" data-mobile-destination="library" aria-controls="studio-mobile-menu" aria-expanded="false">${icons.library}<span>Library</span></button><a href="/admin/analytics.html" data-mobile-destination="analytics">${icons.analytics}<span>Analytics</span></a><button type="button" data-mobile-destination="more" aria-controls="studio-mobile-menu" aria-expanded="false">${icons.more}<span>More</span></button>`;
  document.body.append(nav);
  sidebar.id='studio-mobile-menu';
  const marker=document.createComment('Desktop sidebar position');sidebar.before(marker);
  const sheetHeader=document.createElement('div');sheetHeader.className='mobile-sheet-header';sheetHeader.innerHTML='<div><h2 id="mobile-sheet-title">Library</h2><p id="mobile-sheet-description">Choose a collection to manage.</p></div><button type="button" class="btn-icon" aria-label="Close navigation">'+icon('<path d="m6 6 12 12M18 6 6 18"/>')+'</button>';
  sidebar.prepend(sheetHeader);
  const groups=[...sidebar.querySelectorAll('.sidebar-nav-group')];groups.forEach((group,i)=>group.dataset.mobileGroup=i===0?'library':'more');
  const actions=document.createElement('div');actions.className='mobile-sheet-actions';actions.innerHTML='<a href="/" target="_blank" rel="noopener" class="btn btn-secondary">View live website '+icon('<path d="M14 3h7v7M21 3l-9 9M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>')+'</a><button type="button" class="btn btn-secondary" data-mobile-lock>Lock workspace '+icon('<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>')+'</button>';
  sidebar.append(actions);
  // The desktop rail and mobile sheets use the same real links and live counts.
  const desktopNav=document.createElement('nav');desktopNav.className='desktop-workspace-nav';desktopNav.setAttribute('aria-label','Workspace sections');
  const overview=sidebar.querySelector('#tab-overview'),analytics=sidebar.querySelector('#tab-analytics');
  overview.classList.add('desktop-overview-link');analytics.classList.add('desktop-analytics-link');overview.setAttribute('aria-label','Overview');analytics.setAttribute('aria-label','Analytics');
  const chevron=icon('<path d="m9 5 7 7-7 7"/>');
  const makeSection=(key,label,symbol)=>{
    const button=document.createElement('button');button.type='button';button.className='desktop-section-toggle';button.dataset.desktopSection=key;
    button.setAttribute('aria-label',label);button.title=label;button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','desktop-'+key+'-links');button.innerHTML=`<span>${symbol}<span>${label}</span></span><span class="desktop-nav-chevron">${chevron}</span>`;
    const panel=document.createElement('div');panel.className='desktop-section-panel';panel.id='desktop-'+key+'-links';panel.dataset.desktopExpanded='false';
    button.onclick=()=>{if(sidebar.classList.contains('collapsed')&&!matchMedia('(max-width:768px)').matches)toggleSidebarCollapse();const expanded=button.getAttribute('aria-expanded')!=='true';if(expanded)desktopNav.querySelectorAll('.desktop-section-toggle').forEach(other=>{if(other!==button){other.setAttribute('aria-expanded','false');document.getElementById(other.getAttribute('aria-controls')).dataset.desktopExpanded='false';}});button.setAttribute('aria-expanded',String(expanded));panel.dataset.desktopExpanded=String(expanded);};
    return {button,panel};
  };
  const library=makeSection('library','Library',icons.library),more=makeSection('more','More',icons.more);
  desktopNav.append(overview,library.button,library.panel,analytics,more.button,more.panel);
  library.panel.append(groups[0]);
  groups.slice(1).forEach(group=>{if(group.querySelector('.nav-item'))more.panel.append(group);else group.remove();});
  sidebar.querySelector('.sidebar-header').after(desktopNav);
  let lastDesktopSection='';
  const mobile=matchMedia('(max-width:768px)');let opened=false,returnFocus=null;
  const main=document.querySelector('.admin-main'),header=document.querySelector('.admin-header');
  function sync(){
    let selected='overview';const path=location.pathname;
    if(path.includes('analytics'))selected='analytics';else if(/security|settings|backups/.test(path))selected='more';else if((new URLSearchParams(location.search).get('cat')||'overview')!=='overview')selected='library';
    [library,more].forEach((group,i)=>{const key=i===0?'library':'more';group.button.dataset.current=String(selected===key);});
    if(selected!==lastDesktopSection){
      if(selected==='library'||selected==='more'){
        const group=selected==='library'?library:more;const other=selected==='library'?more:library;other.button.setAttribute('aria-expanded','false');other.panel.dataset.desktopExpanded='false';group.button.setAttribute('aria-expanded','true');group.panel.dataset.desktopExpanded='true';
      }
      lastDesktopSection=selected;
    }
    nav.querySelectorAll('[data-mobile-destination]').forEach(item=>{const active=item.dataset.mobileDestination===selected;item.classList.toggle('is-current',active);if(active)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');});
    sidebar.querySelectorAll('.nav-item').forEach(item=>{if(item.classList.contains('active'))item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');});
  }
  function close(restore=true){
    if(!opened)return;opened=false;sidebar.classList.remove('mobile-open');backdrop.classList.remove('active');document.body.classList.remove('mobile-navigation-open');
    sidebar.removeAttribute('role');sidebar.removeAttribute('aria-modal');sidebar.removeAttribute('aria-labelledby');sidebar.removeAttribute('aria-describedby');
    marker.after(sidebar);main.inert=false;header.inert=false;nav.inert=false;nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-expanded','false'));
    if(restore&&returnFocus?.isConnected)returnFocus.focus({preventScroll:true});sync();
  }
  function open(section='library'){
    if(!mobile.matches)return;const type=section==='more'?'more':'library';
    if(opened&&sidebar.dataset.mobileSection===type){close();return;}
    returnFocus=document.activeElement;opened=true;sidebar.dataset.mobileSection=type;
    sheetHeader.querySelector('h2').textContent=type==='library'?'Your library':'Workspace tools';sheetHeader.querySelector('p').textContent=type==='library'?'Choose a collection to manage.':'Insights, settings, and site access.';
    document.body.append(sidebar);sidebar.classList.add('mobile-open');backdrop.classList.add('active');document.body.classList.add('mobile-navigation-open');
    sidebar.setAttribute('role','dialog');sidebar.setAttribute('aria-modal','true');sidebar.setAttribute('aria-labelledby','mobile-sheet-title');sidebar.setAttribute('aria-describedby','mobile-sheet-description');
    main.inert=true;header.inert=true;nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.mobileDestination===type)));nav.inert=true;
    sidebar.scrollTop=0;sheetHeader.querySelector('button').focus({preventScroll:true});
  }
  nav.addEventListener('click',e=>{const target=e.target.closest('[data-mobile-destination]');if(!target)return;const key=target.dataset.mobileDestination;if(key==='library'||key==='more')open(key);else if(key==='overview'&&typeof switchTab==='function'){e.preventDefault();switchTab('overview');sync();window.scrollTo({top:0,behavior:'instant'});}});
  sheetHeader.querySelector('button').onclick=()=>close();actions.querySelector('button').onclick=()=>{close(false);lockSession();};
  sidebar.addEventListener('click',e=>{if(e.target.closest('.nav-item'))close(false);});
  document.addEventListener('keydown',e=>{if(!opened)return;if(e.key==='Escape'){e.preventDefault();close();return;}if(e.key!=='Tab')return;const controls=[...sidebar.querySelectorAll('button:not(:disabled),a[href]')].filter(n=>n.getClientRects().length);const first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
  mobile.addEventListener('change',()=>close(false));
  new MutationObserver(sync).observe(sidebar,{subtree:true,attributes:true,attributeFilter:['class']});
  window.studioMobileNavigation={open,close,sync};sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initStudioMobileNavigation);else initStudioMobileNavigation();
