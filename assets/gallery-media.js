/* Shared URL resolver: deployed photos keep their paths; new uploads use Blob variants. */
function galleryMediaURL(photo, width, fallback) {
  return photo?.variants?.[width] || photo?.url || fallback;
}

function escapeGalleryText(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
}

// Display aliases only; never rewrite the saved camera model or original EXIF.
// Model references: https://www.terraindrop.com/supported_cameras
// FC1102 is also documented in https://doi.org/10.3390/jmse8010052
function cameraDisplayName(value) {
  const original = String(value || '').trim();
  const model = original.toUpperCase().replace(/^DJI\s+/, '');
  const names = {
    FC1102: 'DJI Spark',
    FC7203: 'DJI Mini SE', // User-preferred label for this shared camera code.
    FC7303: 'DJI Mini 2',
    FC7503: 'DJI Mini 2 SE',
    FC7703: 'DJI Mini 4K',
    FC3682: 'DJI Mini 3',
    FC9313: 'DJI Mini 5 Pro',
    FC9670: 'DJI Lito 1',
    FC9589: 'DJI Lito X1',
    'L1D-20C': 'DJI Mavic 2 Pro',
    FC3582: 'DJI Mini 3 Pro',
    FC8482: 'DJI Mini 4 Pro',
    FC3411: 'DJI Air 2S',
    FC8282: 'DJI Air 3'
  };
  const fullNames = ['Mavic Mini','Mini SE','Mini 2','Mini 2 SE','Mini 3','Mini 3 Pro','Mini 4K','Mini 4 Pro','Mini 5 Pro','Lito 1','Lito X1'];
  const explicit = fullNames.find(name => name.toUpperCase() === model.replace(/\s+/g,' '));
  return names[model] ? `${names[model]} (${model})` : (explicit ? 'DJI ' + explicit : original);
}

// Additional code evidence (original EXIF / first-hand camera tests):
// FC7203 shared: https://air.unimi.it/retrieve/db757cc2-a483-4a1f-a1be-8daae2eec9f6/unpaywall-bitstream-1705428023_compressed.pdf
// FC7503: https://www.jetphotos.com/photo/11682904
// FC7703: https://commons.wikimedia.org/wiki/File:Dji_fly_20250220_141052_394_1740057106149_photo_optimized.jpg
// FC3682: https://www.jetphotos.com/photo/11660804
// FC9313: https://github.com/Sapphire-Rapids/DJI-RC2-Mini5Pro-Research/blob/main/docs/14_SOURCE_INDEX.md
// FC9670: https://www.helicomicro.com/2026/04/23/dji-lito-1-test/
// FC9589: https://www.helicomicro.com/2026/04/23/dji-lito-x1-test/

// Exact GPS takes precedence over cached, approximate description locations.
function photoLocation(photo) {
  const gps=photo?.gps || photo?.exif?.gps;
  const lat=Number(gps?.latitude),lon=Number(gps?.longitude);
  if(gps && gps.latitude !== null && gps.longitude !== null && Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180) {
    return {lat,lon,label:String(photo.desc||'').split('•').slice(1).map(s=>s.trim()).join(', ')||'Photo location',source:'gps'};
  }
  const label=String(photo?.desc||'').split('•').slice(1).map(s=>s.trim()).join(', ');
  return photoDescriptionLocations[label] || (label.includes('Bacolod') ? photoDescriptionLocations['Bacolod City, Negros Occidental'] : null);
}
function photoLocationDetails(photo) {
  const location=photoLocation(photo);
  const caption=String(photo?.desc||'').split('•').slice(1).map(s=>s.trim()).join(', ');
  if(!location) return caption ? '<section class="photo-location"><h3>Location</h3><p>'+escapeGalleryText(caption)+'</p><a href="https://www.openstreetmap.org/search?query='+encodeURIComponent(caption)+'" target="_blank" rel="noopener noreferrer">Find on OpenStreetMap ↗</a></section>' : '';
  const {lat,lon,label,source}=location;
  const delta=source==='gps'?.004:.04;
  const bbox=[Math.max(-180,lon-delta),Math.max(-90,lat-delta),Math.min(180,lon+delta),Math.min(90,lat+delta)].join(',');
  const link='https://www.openstreetmap.org/?mlat='+lat+'&mlon='+lon+'#map='+(source==='gps'?16:12)+'/'+lat+'/'+lon;
  const src='https://www.openstreetmap.org/export/embed.html?bbox='+encodeURIComponent(bbox)+'&layer=mapnik&marker='+encodeURIComponent(lat+','+lon);
  return '<section class="photo-location" aria-label="Photo location"><h3>Location</h3><p>'+escapeGalleryText(label)+'</p><small>'+(source==='gps'?'From photo GPS':'Approximate area · from description')+'</small><iframe title="OpenStreetMap photo location" loading="lazy" referrerpolicy="no-referrer" src="'+src+'"></iframe><a href="'+link+'" target="_blank" rel="noopener noreferrer">Open in OpenStreetMap ↗</a></section>';
}

// One-time cached OSM Nominatim lookup; no visitor geocoding requests.
const photoDescriptionLocations = {
  "Cadiz City, Negros Occidental": {
    "lat": 10.956652,
    "lon": 123.3057034,
    "label": "Cadiz City, Negros Occidental",
    "source": "description"
  },
  "University of St. La Salle, Bacolod City, Negros Occidental": null,
  "Bacolod City, Negros Occidental": {
    "lat": 10.6428793,
    "lon": 122.9302116,
    "label": "Bacolod City, Negros Occidental",
    "source": "description"
  },
  "Boracay Island, Aklan": {
    "lat": 11.9693692,
    "lon": 121.9227339,
    "label": "Boracay Island, Aklan",
    "source": "description"
  },
  "Cebu City, Cebu": {
    "lat": 10.3285605,
    "lon": 123.9008849,
    "label": "Cebu City, Cebu",
    "source": "description"
  },
  "USLS Coliseum, Bacolod City, Negros Occidental": null,
  "Metro Manila": {
    "lat": 14.5736108,
    "lon": 121.0329706,
    "label": "Metro Manila",
    "source": "description"
  },
  "Bocal-Bocal Spring Resort, Bacolod City, Negros Occidental": null,
  "Binondo, Manila": {
    "lat": 14.5999164,
    "lon": 120.9740253,
    "label": "Binondo, Manila",
    "source": "description"
  },
  "Don Salvador Benedicto, Negros Occidental": {
    "lat": 10.577077,
    "lon": 123.220367,
    "label": "Don Salvador Benedicto, Negros Occidental",
    "source": "description"
  },
  "Lacson Street, Bacolod City, Negros Occidental": null,
  "Gawahon Eco Park, Victorias City, Negros Occidental": {
    "lat": 10.7935754,
    "lon": 123.1832689,
    "label": "Gawahon Eco Park, Victorias City, Negros Occidental",
    "source": "description"
  },
  "Silay City, Negros Occidental": {
    "lat": 10.7994126,
    "lon": 122.9756149,
    "label": "Silay City, Negros Occidental",
    "source": "description"
  },
  "Kobe, Japan": {
    "lat": 34.6932379,
    "lon": 135.1943764,
    "label": "Kobe, Japan",
    "source": "description"
  },
  "Nabas, Aklan": {
    "lat": 11.828728,
    "lon": 122.0924043,
    "label": "Nabas, Aklan",
    "source": "description"
  },
  "Roxas City, Capiz": {
    "lat": 11.5831593,
    "lon": 122.7525555,
    "label": "Roxas City, Capiz",
    "source": "description"
  },
  "Murcia, Negros Occidental": {
    "lat": 10.6066483,
    "lon": 123.0404676,
    "label": "Murcia, Negros Occidental",
    "source": "description"
  },
  "San Carlos City, Negros Occidental": {
    "lat": 10.486048,
    "lon": 123.4190385,
    "label": "San Carlos City, Negros Occidental",
    "source": "description"
  },
  "Kyoto, Japan": {
    "lat": 35.0115754,
    "lon": 135.7681441,
    "label": "Kyoto, Japan",
    "source": "description"
  },
  "Davao City, Davao del Sur": {
    "lat": 7.0648306,
    "lon": 125.6080623,
    "label": "Davao City, Davao del Sur",
    "source": "description"
  },
  "Bago City, Negros Occidental": {
    "lat": 10.5376299,
    "lon": 122.8352802,
    "label": "Bago City, Negros Occidental",
    "source": "description"
  },
  "Enrique B. Magalona, Negros Occidental": {
    "lat": 10.8770717,
    "lon": 122.9814106,
    "label": "Enrique B. Magalona, Negros Occidental",
    "source": "description"
  },
  "Tokyo, Japan": {
    "lat": 35.6768601,
    "lon": 139.7638947,
    "label": "Tokyo, Japan",
    "source": "description"
  },
  "Pasay City, Metro Manila": {
    "lat": 14.5436995,
    "lon": 120.9946503,
    "label": "Pasay City, Metro Manila",
    "source": "description"
  },
  "Shizuoka, Japan": {
    "lat": 34.9751974,
    "lon": 138.3831697,
    "label": "Shizuoka, Japan",
    "source": "description"
  },
  "Manila, Metro Manila": {
    "lat": 14.5904492,
    "lon": 120.9803621,
    "label": "Manila, Metro Manila",
    "source": "description"
  }
};
