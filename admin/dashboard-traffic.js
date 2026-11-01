const host = document.querySelector('#dashboard-traffic');
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = v => Number(v || 0).toLocaleString();
const date = v => new Date(v).toLocaleString('en-PH', {timeZone:'Asia/Manila', dateStyle:'medium', timeStyle:'short'});
let range = '7d', page = 1, link = '', search = '', ticket = 0, initialized = false;
const ranges = [['today','Today'],['24h','Last 24 hours'],['7d','Last 7 days'],['30d','Last 30 days'],['90d','Last 90 days'],['all','All time']];
function chart(data) {
  const rows = new Map((data.daily || []).map(r => [r.day,r]));
  const start = new Date(data.from || (data.daily?.[0]?.day ? data.daily[0].day+'T00:00:00+08:00' : data.to));
  const end = new Date(data.to); const days = [];
  const key = d => new Date(d.getTime()+8*3600000).toISOString().slice(0,10);
  for (let d = new Date(start); key(d) <= key(end); d = new Date(d.getTime()+86400000)) days.push(rows.get(key(d)) || {day:key(d), views:0, visitors:0});
  const max = Math.max(2,...days.map(r=>r.views));
  const points = days.map((r,i)=>[48+i*808/Math.max(1,days.length-1),220-r.views/max*180]);
  const path = points.map(([x,y],i)=>(i?'L':'M')+x+','+y).join(' ');
  return `<section class="traffic-chart"><div class="traffic-section-heading"><h3>Page views over time</h3><span>Daily · Asia/Manila</span></div>${data.totalViews ? `<svg viewBox="0 0 880 258" role="img" aria-label="Daily page views. Exact counts in the data table below.">${[0,.5,1].map(v=>`<line x1="48" x2="856" y1="${220-v*180}" y2="${220-v*180}" stroke="var(--border)"/><text x="38" y="${225-v*180}" text-anchor="end">${num(Math.round(v*max))}</text>`).join('')}<path d="${path}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round"/>${points.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${days.length>60?2:4}" fill="var(--accent)"><title>${esc(days[i].day)}: ${num(days[i].views)} views</title></circle>`).join('')}<text x="48" y="250">${esc(days[0]?.day)}</text><text x="856" y="250" text-anchor="end">${esc(days.at(-1)?.day)}</text></svg><details><summary>View daily traffic data</summary><div class="traffic-table-scroll"><table><thead><tr><th>Date</th><th>Page views</th><th>Browser sessions</th></tr></thead><tbody>${days.map(r=>`<tr><td>${r.day}</td><td>${num(r.views)}</td><td>${num(r.visitors)}</td></tr>`).join('')}</tbody></table></div></details>`:'<p class="traffic-empty">No page views recorded in this period. Public page visits will appear here.</p>'}</section>`;
}
function ranking(title, rows, total, label, clickable = false) {
 return `<section class="traffic-ranking"><h3>${title}</h3>${rows.length?'<ol>'+rows.map(r=>`<li><div>${clickable?`<button type="button" data-traffic-link="${esc(r.page_url)}">${esc(r[label])}</button>`:`<span>${esc(r[label])}</span>`}<span>${num(r.c)} <small>· ${total?Math.round(r.c/total*100):0}%</small></span></div><progress max="${Math.max(1,total)}" value="${Number(r.c)||0}" aria-label="${esc(r[label])}: ${num(r.c)} views"></progress></li>`).join('')+'</ol>':'<p class="traffic-empty">No matching traffic.</p>'}</section>`;
}
async function load() {
 const logOpen=Boolean(host.querySelector('.traffic-log')?.open);
 const id = ++ticket; const result=host.querySelector('[data-traffic-results]'); result.setAttribute('aria-busy','true');
 result.innerHTML='<p class="traffic-empty" role="status">Loading visitor analytics…</p>';
 host.querySelectorAll('[data-traffic-range]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.trafficRange===range)));
 try {
  const query = new URLSearchParams({range,page:String(page),limit:'20',link,search});
  const response=await fetch('/api/analytics?'+query,{headers:{Authorization:'Bearer '+(sessionStorage.getItem('pm_auth')||'')},cache:'no-store'});
  const data=await response.json(); if(!response.ok||!data.success) throw Error(data.error||'Traffic could not be loaded.'); if(id!==ticket)return;
  const select=host.querySelector('[name=link]'); select.innerHTML='<option value="">All pages</option>'+(data.allLinks||[]).map(r=>`<option value="${esc(r.page_url)}">${esc(r.page_url)}</option>`).join(''); select.value=link;
  result.innerHTML=`<p class="traffic-period">${data.from?esc(date(data.from)):'First recorded visit'} – ${esc(date(data.to))} · Asia/Manila${data.source==='local'?' · Local preview data':''}</p><dl class="traffic-metrics">${[['Page views',num(data.totalViews)],['Browser sessions',num(data.uniqueVisitors)],['Mobile & tablet',num(data.mobilePct)+'%'],['Top country',data.topCountry==='N/A'?'Not available':data.topCountry]].map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>${chart(data)}<div class="traffic-ranking-grid">${ranking('Most visited pages',data.topPages||[],data.totalViews,'page_url',true)}${ranking('Visitor locations',(data.topLocations||[]).map(r=>({...r,label:[r.city,r.country].filter(Boolean).join(', ')})),data.totalViews,'label')}${ranking('Operating systems',data.topOS||[],data.totalViews,'os')}${ranking('Browsers',data.topBrowsers||[],data.totalViews,'browser')}</div><details class="traffic-log" ${logOpen?'open':''}><summary>Visitor page-view log <span>${num(data.totalLogsCount)} matching views</span></summary><div class="traffic-table-scroll" tabindex="0" role="region" aria-label="Visitor page-view log"><table><thead><tr><th>Time</th><th>Page</th><th>IP / network</th><th>Location</th><th>Device / browser</th></tr></thead><tbody>${data.logs.length?data.logs.map(l=>`<tr><td>${esc(date(l.createdAt))}</td><td>${esc(l.pageUrl)}</td><td>${esc(l.ipAddress||'Not available')}<small>${esc(l.isp)}</small></td><td>${esc([l.city,l.country].filter(Boolean).join(', '))}</td><td>${esc([l.deviceType,l.os,l.browser].filter(Boolean).join(' · '))}<small>${esc(l.screenResolution)}</small></td></tr>`).join(''):'<tr><td colspan="5">No page views match these filters.</td></tr>'}</tbody></table></div><div class="traffic-pagination"><button class="btn btn-secondary" data-traffic-prev ${page===1?'disabled':''}>Previous visits</button><span>Page ${page}</span><button class="btn btn-secondary" data-traffic-next ${page*20>=data.totalLogsCount?'disabled':''}>Next visits</button></div></details><p class="traffic-note">Browser sessions estimate visits, not unique people. Locations are approximate; VPNs and shared networks affect accuracy. Admin pages are excluded.</p>`;
 } catch(error) {if(id===ticket)result.innerHTML=`<p role="status" class="traffic-empty">${esc(error.message)}</p><button class="btn btn-secondary" data-traffic-retry>Retry analytics</button>`;}
 finally {if(id===ticket)result.removeAttribute('aria-busy');}
}
function mount() {
 if(!host||!sessionStorage.getItem('pm_auth'))return;
 if(initialized)return; initialized=true;
 host.innerHTML=`<div class="traffic-section-heading"><div><h2>Visitor & page traffic</h2><p>See how people find and explore your portfolio.</p></div><button class="btn btn-secondary" data-traffic-refresh>Refresh analytics</button></div><div class="traffic-range" role="group" aria-label="Traffic time range">${ranges.map(([k,v])=>`<button type="button" data-traffic-range="${k}" aria-pressed="${range===k}">${v}</button>`).join('')}</div><form class="traffic-filters"><label>Page<select class="input-select" name="link" aria-label="Traffic page"><option value="">All pages</option></select></label><label class="traffic-search">Search traffic<input class="input-text" type="search" name="search" maxlength="200" placeholder="IP, location, page, OS, browser or ISP"></label><button class="btn btn-primary">Filter traffic</button><button class="btn btn-secondary" type="button" data-traffic-clear>Clear</button></form><div data-traffic-results aria-live="polite"></div>`;
 host.querySelector('form').onsubmit=e=>{e.preventDefault();link=e.currentTarget.elements.link.value;search=e.currentTarget.elements.search.value.trim();page=1;void load();};
 host.onclick=e=>{const b=e.target.closest('button');if(!b)return; if(b.dataset.trafficRange){range=b.dataset.trafficRange;page=1;}else if(b.hasAttribute('data-traffic-link')){link=b.dataset.trafficLink;page=1;}else if(b.hasAttribute('data-traffic-clear')){link='';search='';page=1;host.querySelector('form').reset();}else if(b.hasAttribute('data-traffic-prev'))page=Math.max(1,page-1);else if(b.hasAttribute('data-traffic-next'))page++;else if(!b.hasAttribute('data-traffic-retry')&&!b.hasAttribute('data-traffic-refresh'))return;void load();};
 void load();
}
window.addEventListener('studio-overview',mount);mount();
