/* ExifReader 4.52.0 (vendored locally) reads files in the browser, before compression. */
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
  // Never guess a lens model from focal length, or fill missing data with camera presets.
  const fields={camera,lens:text('LensModel'),aperture:aperture?`f/${round(aperture)}`:'',shutter:exposure?(exposure<1?`1/${Math.round(1/exposure)}s`:`${round(exposure)}s`):'',iso:iso?String(iso):'',focalLength:focal?`${round(focal)} mm`:'',dateTaken:fullDate};
  return {fields,count:Object.values(fields).filter(Boolean).length};
}
async function readUploadCaptureMetadata(file) {
  const bytes=await file.arrayBuffer();
  const groups=ExifReader.load(bytes,{expanded:true});
  return captureFieldsFromTags(groups);
}
