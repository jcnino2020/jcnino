import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const context=vm.createContext({});vm.runInContext(fs.readFileSync('assets/gallery-media.js','utf8'),context);
const source=fs.readFileSync('assets/portfolio.js','utf8');vm.runInContext(source.slice(source.indexOf('function photoCameraDetails('),source.indexOf('function toggleLightboxDesc(')),context);
test('public capture details show published fields without inventing absent values or rendering markup',()=>{
 assert.equal(context.photoCameraDetails({}), '');assert.equal(context.photoCameraDetails({camera:'  ',iso:''}), '');
 const html=context.photoCameraDetails({camera:'Nikon D5100',lens:'50mm f/1.8',aperture:'f/2.8',shutter:'1/640s',iso:'100',focalLength:'50 mm',dateTaken:'2018-09-28 11:03:03'});
 for(const value of ['Nikon D5100','50mm f/1.8','f/2.8','1/640s','100','50 mm','2018-09-28 11:03:03'])assert.ok(html.includes(value));assert.equal((html.match(/<dt>/g)||[]).length,7);
 assert.ok(!context.photoCameraDetails({camera:'Nikon'}).includes('<dt>Lens</dt>'));assert.ok(!context.photoCameraDetails({lens:'<img src=x onerror=alert(1)>'}).includes('<img'));
});

test('verified DJI display aliases leave unknown models and saved EXIF unchanged',()=>{
 const photo={camera:'DJI FC1102'};const original=JSON.stringify(photo);
 assert.ok(context.photoCameraDetails(photo).includes('DJI Spark'));assert.equal(JSON.stringify(photo),original);
 assert.equal(context.cameraDisplayName('FC1102'),'DJI Spark');assert.equal(context.cameraDisplayName('dji fc1102'),'DJI Spark');
 assert.equal(context.cameraDisplayName('DJI FC3582'),'DJI Mini 3 Pro');assert.equal(context.cameraDisplayName('DJI FC8482'),'DJI Mini 4 Pro');
 assert.equal(context.cameraDisplayName('DJI FC9999'),'DJI FC9999');assert.equal(context.cameraDisplayName('Canon FC1102'),'Canon FC1102');assert.equal(context.cameraDisplayName('Nikon Z50'),'Nikon Z50');
});
