const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf('    let referenceExifRequest = 0;'),html.indexOf('    async function extractExifForActiveDrawerItem()'));
const fields=new Map();const document={getElementById(id){if(!fields.has(id))fields.set(id,{value:'existing',textContent:'',disabled:false});return fields.get(id);}};
const item={file:'original.jpg',url:'https://example.test/original.webp',variants:{800:'https://example.test/800.webp'},camera:'Existing camera'};
const before=JSON.stringify(item);const pendingReplaceBlob={unchanged:true};
let result={fields:{camera:'Nikon Z50',iso:'800',lens:''},count:2};
const context=vm.createContext({document,activeEditIndex:0,currentCategory:'highlights',localData:{highlights:[item]},pendingReplaceBlob,readUploadCaptureMetadata:async()=>result});vm.runInContext(source,context);
(async()=>{
 const event={target:{files:[{name:'reference.jpg'}],value:'selected'}};await context.importReferenceExif(event);
 assert.equal(document.getElementById('edit-camera').value,'Nikon Z50');assert.equal(document.getElementById('edit-iso').value,'800');assert.equal(document.getElementById('edit-lens').value,'existing');assert.equal(JSON.stringify(item),before,'Import must not alter the saved image or metadata before Apply');assert.equal(context.pendingReplaceBlob,pendingReplaceBlob,'Reference must not become a replacement image');assert.equal(event.target.value,'');assert.equal(document.getElementById('reference-exif-button').disabled,false);
 result={fields:{},count:0};await context.importReferenceExif(event);assert.equal(document.getElementById('edit-camera').value,'Nikon Z50');assert.match(document.getElementById('reference-exif-status').textContent,/No supported camera tags/);
 console.log('Reference EXIF fills fields without replacing or modifying the gallery image.');
})().catch(error=>{console.error(error);process.exitCode=1;});
