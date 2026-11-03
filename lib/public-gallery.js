/* Location privacy applies to every unauthenticated gallery response. */
export function publicGallery(data){
 if(!data)return data;
 const result=structuredClone(data);
 if(Array.isArray(result.settings?.testimonials))result.settings.testimonials=result.settings.testimonials.filter(t=>t.permissionConfirmed===true&&t.published===true);
 for(const key of ['highlights','drone','framed','events'])for(const photo of result[key]||[]){
  delete photo.publicLocation;
  if(!['hidden','approximate'].includes(photo.locationVisibility))continue;
  const source=photo.location||{lat:photo.gps?.latitude,lon:photo.gps?.longitude};
  delete photo.gps;delete photo.location;
  if(photo.exif){delete photo.exif.gps;for(const name of Object.keys(photo.exif))if(/^GPS/i.test(name))delete photo.exif[name];}
  if(photo.locationVisibility==='approximate'&&Number.isFinite(source.lat)&&Number.isFinite(source.lon))photo.publicLocation={lat:Number(source.lat.toFixed(2)),lon:Number(source.lon.toFixed(2)),label:'Approximate area',source:'approximate'};
 }
 return result;
}
