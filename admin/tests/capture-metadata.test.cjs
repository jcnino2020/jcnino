const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const context={module:{exports:{}},exports:{},console,TextDecoder,Uint8Array,ArrayBuffer,DataView};
context.exports=context.module.exports;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../vendor/exif-reader.js'),'utf8'),context);
context.ExifReader=context.module.exports;
vm.runInContext(fs.readFileSync(path.join(__dirname,'../capture-metadata.js'),'utf8'),context);
// Synthetic camera tags; not assertions about the source photograph.
const tiff=Buffer.alloc(512);tiff.write('II');tiff.writeUInt16LE(42,2);tiff.writeUInt32LE(8,4);
let nextData=160;
function ascii(offset,tag,value){const bytes=Buffer.from(value+'\0');tiff.writeUInt16LE(tag,offset);tiff.writeUInt16LE(2,offset+2);tiff.writeUInt32LE(bytes.length,offset+4);if(bytes.length<=4)bytes.copy(tiff,offset+8);else{tiff.writeUInt32LE(nextData,offset+8);bytes.copy(tiff,nextData);nextData+=bytes.length;}}
function rational(offset,tag,n,d){tiff.writeUInt16LE(tag,offset);tiff.writeUInt16LE(5,offset+2);tiff.writeUInt32LE(1,offset+4);tiff.writeUInt32LE(nextData,offset+8);tiff.writeUInt32LE(n,nextData);tiff.writeUInt32LE(d,nextData+4);nextData+=8;}
tiff.writeUInt16LE(3,8);ascii(10,0x010f,'NIKON CORPORATION');ascii(22,0x0110,'NIKON Z 50');tiff.writeUInt16LE(0x8769,34);tiff.writeUInt16LE(4,36);tiff.writeUInt32LE(1,38);tiff.writeUInt32LE(50,42);
tiff.writeUInt16LE(6,50);ascii(52,0x9003,'2026:07:16 14:35:22');rational(64,0x829d,17,10);rational(76,0x829a,1,500);tiff.writeUInt16LE(0x8827,88);tiff.writeUInt16LE(3,90);tiff.writeUInt32LE(1,92);tiff.writeUInt16LE(800,96);ascii(100,0xa434,'Synthetic test lens');rational(112,0x920a,25,1);
const payload=Buffer.concat([Buffer.from('Exif\0\0'),tiff.subarray(0,nextData)]);const app1=Buffer.alloc(4);app1[0]=0xff;app1[1]=0xe1;app1.writeUInt16BE(payload.length+2,2);
const source=fs.readFileSync(path.join(__dirname,'../../images/GH-01.jpg'));
const fixture=Buffer.concat([source.subarray(0,2),app1,payload,source.subarray(2)]);
const tags=context.ExifReader.load(fixture,{expanded:true});const result=context.captureFieldsFromTags(tags);
assert.equal(result.fields.camera,'Nikon Z50');assert.equal(result.fields.lens,'Synthetic test lens');assert.equal(result.fields.aperture,'f/1.7');assert.equal(result.fields.shutter,'1/500s');assert.equal(result.fields.iso,'800');assert.equal(result.fields.focalLength,'25 mm');assert.equal(result.fields.dateTaken,'2026-07-16 14:35:22');assert.equal(result.count,7);
assert.equal(context.captureFieldsFromTags({exif:{FocalLength:{value:[25,1]}}}).fields.lens,'','Never guess a lens from focal length');
assert.equal(context.captureFieldsFromTags({}).count,0,'Missing metadata stays blank');
const stripped=context.ExifReader.load(fs.readFileSync(path.join(__dirname,'../../images/optimized/800/GH-01-800.webp')),{expanded:true});assert.equal(context.captureFieldsFromTags(stripped).count,0);
fs.writeFileSync('/tmp/jc-synthetic-exif-test.jpg',fixture);
console.log('EXIF extraction, formatting, absent metadata and no lens guessing passed.');
// Nikon MakerNote lens spec is separate from the shooting focal length/aperture.
for(const little of [false,true]){
 const note=new Uint8Array(68);note.set([78,105,107,111,110,0,2,16,0,0]);const view=new DataView(note.buffer,10);
 view.setUint16(0,little?0x4949:0x4d4d);view.setUint16(2,42,little);view.setUint32(4,8,little);view.setUint16(8,1,little);view.setUint16(10,0x84,little);view.setUint16(12,5,little);view.setUint32(14,4,little);view.setUint32(18,26,little);
 [50,50,18,18].forEach((n,i)=>{view.setUint32(26+i*8,n,little);view.setUint32(30+i*8,i<2?1:10,little);});
 const tags={exif:{MakerNote:{value:Array.from(note)},FocalLength:{value:[50,1]},FNumber:{value:[28,10]}}};
 assert.equal(context.captureFieldsFromTags(tags).fields.lens,'50mm f/1.8');
 tags.exif.LensModel={description:'Explicit lens model'};assert.equal(context.captureFieldsFromTags(tags).fields.lens,'Explicit lens model');delete tags.exif.LensModel;
 view.setUint32(18,999999,little);tags.exif.MakerNote.value=Array.from(note);assert.equal(context.captureFieldsFromTags(tags).fields.lens,'','Malformed MakerNote must not throw or guess');
}
console.log('Nikon lens specifications, model precedence, both byte orders and malformed metadata passed.');
