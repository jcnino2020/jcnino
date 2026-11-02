/* ExifReader 4.52.0 (vendored locally) reads files in the browser, before compression. */
// Nikon type-3 MakerNote tag 0x0084 contains four unsigned rationals:
// minimum/maximum lens focal length and maximum apertures (ExifTool Nikon Lens).
// This is the embedded lens specification, not a guess from capture settings.
function nikonLensSpecification(exif) {
  const raw=exif.MakerNote?.value;
  if(!raw || raw.length<18 || raw.length>5000000)return '';
  try {
    const bytes=Uint8Array.from(raw);
    if(![78,105,107,111,110,0].every((v,i)=>bytes[i]===v) || bytes[6]!==2)return '';
    const base=10;
    const view=new DataView(bytes.buffer,bytes.byteOffset+base,bytes.byteLength-base);
    const little=view.getUint16(0,false)===0x4949;
    if(!little && view.getUint16(0,false)!==0x4d4d)return '';
    if(view.getUint16(2,little)!==42)return '';
    const ifd=view.getUint32(4,little);
    if(ifd+2>view.byteLength)return '';
    const count=view.getUint16(ifd,little);
    if(count>512 || ifd+2+count*12>view.byteLength)return '';
    for(let i=0;i<count;i++) {
      const entry=ifd+2+i*12;
      if(view.getUint16(entry,little)!==0x84)continue;
      if(view.getUint16(entry+2,little)!==5 || view.getUint32(entry+4,little)!==4)return '';
      const offset=view.getUint32(entry+8,little);
      if(offset+32>view.byteLength)return '';
      const values=Array.from({length:4},(_,j)=>{
        const n=view.getUint32(offset+j*8,little),d=view.getUint32(offset+j*8+4,little);
        return d?n/d:NaN;
      });
      if(!values.every(v=>Number.isFinite(v)&&v>0))return '';
      const [min,max,wide,tele]=values;
      if(min>max || min>3000 || max>3000 || wide>128 || tele>128)return '';
      const format=n=>String(Number(n.toFixed(2)));
      return `${format(min)}${min===max?'':'–'+format(max)}mm f/${format(wide)}${wide===tele?'':'–'+format(tele)}`;
    }
  }catch{}
  return '';
}
function captureFieldsFromTags(groups) {
  const exif=groups.exif || {};
  const text=name=> {
    const tag=exif[name];
    if(!tag)return '';
    const value=tag.description ?? tag.value;
    return String(Array.isArray(value)?value[0] ?? '':value ?? '').replace(/\0/g,'').trim();
  };
  const number=name=> {
    let value=exif[name]?.value;
    if(Array.isArray(value)) {
      if(value.length===2 && value.every(v=>typeof v==='number'))value=value[1] ? value[0]/value[1] : NaN;
      else value=value[0];
    }
    const result=Number(value);
    return value!==undefined && Number.isFinite(result) && result>0 ? result : null;
  };
  const make=text('Make').replace(/\bCORPORATION\b/gi,'').trim();
  const model=text('Model');
  let camera=model && make && !model.toLowerCase().includes(make.toLowerCase()) ? `${make} ${model}` : model || make;
  camera=camera.replace(/\s+/g,' ').replace(/NIKON Z\s*50/i,'Nikon Z50');
  const aperture=number('FNumber');
  const exposure=number('ExposureTime');
  const focal=number('FocalLength');
  const iso=number('ISOSpeedRatings') || number('PhotographicSensitivity') || number('ISO');
  const date=text('DateTimeOriginal') || text('DateTimeDigitized') || text('DateTime');
  const match=date.match(/^(\d{4})[:\-](\d{2})[:\-](\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  const fullDate=match ? `${match[1]}-${match[2]}-${match[3]}${match[4]?` ${match[4]}:${match[5]}${match[6]?`:${match[6]}`:''}`:''}` : '';
  const round=value=>String(Number(value.toFixed(2)));
  // Prefer embedded lens information. Spark has no interchangeable lens and often
  // omits LensModel, so an exact DJI+FC1102 match can use its documented fixed lens.
  // https://www.dji.com/support/product/spark (25mm equivalent, f/2.6)
  const embeddedLens=text('LensModel') || nikonLensSpecification(exif);
  const sparkFixedLens=/^DJI$/i.test(make) && /^(?:DJI\s+)?FC1102$/i.test(model) ? 'DJI Spark fixed lens — 25mm equivalent f/2.6 (DJI specification)' : '';
  const fields={camera,lens:embeddedLens || sparkFixedLens,aperture:aperture?`f/${round(aperture)}`:'',shutter:exposure?(exposure<1?`1/${Math.round(1/exposure)}s`:`${round(exposure)}s`):'',iso:iso?String(iso):'',focalLength:focal?`${round(focal)} mm`:'',dateTaken:fullDate};
  return {fields,count:Object.values(fields).filter(Boolean).length,lensSource:embeddedLens?'embedded':sparkFixedLens?'manufacturer specification':''};
}
async function readUploadCaptureMetadata(file) {
  const bytes=await file.arrayBuffer();
  const groups=ExifReader.load(bytes,{expanded:true});
  return captureFieldsFromTags(groups);
}
