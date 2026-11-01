const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors=['#295f4d','#456e9f','#91631b','#80608f','#a75442','#647a6e'];
export function breakdownChart(title,rows,pie=false){
 const total=rows.reduce((s,r)=>s+r.value,0),max=Math.max(1,...rows.map(r=>r.value));let angle=0;
 const slices=rows.map((r,i)=>{const from=angle;angle+=r.value/total*360;return `${colors[i%colors.length]} ${from}deg ${angle}deg`;});
 return `<section class="report-chart"><h3>${esc(title)}</h3><p>Recorded page views in the selected period.</p>${total?`${pie?`<div class="report-pie" role="img" aria-label="${esc(title)}. Exact values in the legend and table." style="background:conic-gradient(${slices.join(',')})"></div>`:''}<ol class="report-chart-legend">${rows.map((r,i)=>`<li><div><span><i style="background:${colors[i%colors.length]}"></i>${esc(r.label)}</span><strong>${r.value.toLocaleString()}</strong></div>${pie?'':`<progress max="${max}" value="${r.value}" aria-label="${esc(r.label)}: ${r.value} views"></progress>`}</li>`).join('')}</ol><details><summary>View ${esc(title.toLowerCase())} data</summary><table><thead><tr><th>Category</th><th>Page views</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.label)}</td><td>${r.value.toLocaleString()}</td></tr>`).join('')}</tbody></table></details>`:'<p class="traffic-empty">No activity recorded in this period.</p>'}</section>`;
}
export function statistics(data,trend){
 return `<div class="report-chart-grid"><section class="report-chart report-chart-wide">${trend}</section>${breakdownChart('Most viewed pages',(data.topPages||[]).slice(0,10).map(r=>({label:r.page_url,value:r.c})))}${breakdownChart('Browser breakdown',(data.topBrowsers||[]).map(r=>({label:r.browser,value:r.c})),true)}${breakdownChart('Operating systems',(data.topOS||[]).map(r=>({label:r.os,value:r.c})))}${breakdownChart('Visitor locations',(data.topLocations||[]).map(r=>({label:[r.city,r.country].filter(Boolean).join(', '),value:r.c})),true)}</div>`;
}
export async function mediaReport(){
 const responses=await Promise.all(['/api/views','/api/likes'].map(async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('Media engagement is unavailable. Refresh to retry.');return r.json();}));
 const [views,likes]=responses;
 const rows=['highlights','drone','framed','events','videos','videos2'].flatMap(category=>(window.galleryData?.[category]||[]).map(item=>{const key=category.startsWith('videos')?item.title:item.file;return {title:item.desc||item.title||item.file,category,views:Number(views[key]||0),likes:Number(likes[key]||0)};})).sort((a,b)=>b.views-a.views);
 return `<div class="traffic-table-scroll report-media-table" tabindex="0" role="region" aria-label="Media engagement"><table><thead><tr><th>Media</th><th>Collection</th><th>Views</th><th>Appreciations</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.title)}</td><td>${esc(r.category)}</td><td>${r.views.toLocaleString()}</td><td>${r.likes.toLocaleString()}</td></tr>`).join('')||'<tr><td colspan="4">No published media.</td></tr>'}</tbody></table></div>`;
}
