var LibraryToolsCore=(()=>{
 const fields=['camera','lens','focalLength','aperture','iso','shutter','dateTaken'];
 const missing=p=>fields.filter(k=>!String(p[k]||'').trim());
 const altIssue=p=>{const alt=String(p.alt||'').trim();if(!alt)return 'Missing image description';if(/^(portfolio photograph|professional photography|image|photo(?:graph)?)(?: by| of|\s*\d|$)/i.test(alt)||alt===p.file||alt.length<12)return 'Review generic or short description';return '';};
 function vector(pixels){const values=[];for(let i=0;i<pixels.length;i+=4)values.push(.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2]);const mean=values.reduce((a,b)=>a+b,0)/values.length;const norm=Math.hypot(...values.map(v=>v-mean));return norm<1?null:values.map(v=>(v-mean)/norm);}
 const similarity=(a,b)=>a&&b&&a.length===b.length?a.reduce((n,v,i)=>n+v*b[i],0):-1;
 function rank(vector,entries){const scores=entries.filter(e=>e.vector).map(e=>({...e,score:similarity(vector,e.vector)})).sort((a,b)=>b.score-a.score);return {scores,confident:!!scores[0]&&scores[0].score>=.985&&(!scores[1]||scores[0].score-scores[1].score>.04)};}
 function locationValid(value){return value&&Number.isFinite(value.lat)&&Number.isFinite(value.lon)&&Math.abs(value.lat)<=90&&Math.abs(value.lon)<=180;}
 function canUndo(current,after){return JSON.stringify(current)===JSON.stringify(after);}
 return {fields,missing,altIssue,vector,similarity,rank,locationValid,canUndo};
})();
