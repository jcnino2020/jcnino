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

// Named places in captions take precedence; camera GPS is a fallback.
function resolvePhotoLocation(photo) {
  const coordinates = photo?.gps || photo?.exif?.gps;
  if (coordinates && Number.isFinite(Number(coordinates.latitude)) && Number.isFinite(Number(coordinates.longitude))) {
    const lat = Number(coordinates.latitude), lon = Number(coordinates.longitude);
    return { lat, lon, label: lat.toFixed(6) + ', ' + lon.toFixed(6), source: 'gps' };
  }
  const description=String(photo?.desc||'');
  const named=photoNamedPlaces.find(place=>new RegExp(place.pattern,'i').test(description));
  if(named)return named.location ? {...named.location,label:named.label,source:'place'} : {label:named.label,query:named.label,source:'unresolved'};
  const describedArea=description.split('•').slice(1).map(s=>s.trim()).join(', ');
  if(/Boracay Island/.test(describedArea)&&photoDescriptionLocations[describedArea])return {...photoDescriptionLocations[describedArea],source:'place'};
  const gps=photo?.gps || photo?.exif?.gps;
  const lat=Number(gps?.latitude),lon=Number(gps?.longitude);
  if(gps && gps.latitude !== null && gps.longitude !== null && Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180) {
    return {lat,lon,label:String(photo.desc||'').split('•').slice(1).map(s=>s.trim()).join(', ')||'Photo location',source:'gps'};
  }
  const label=String(photo?.desc||'').split('•').slice(1).map(s=>s.trim()).join(', ');
  return photoDescriptionLocations[label] || (label.includes('Bacolod') ? photoDescriptionLocations['Bacolod City, Negros Occidental'] : null);
}
function photoLocation(photo) {
  if(photo?.locationVisibility==='hidden')return null;
  const manual=photo?.location;
  const valid=manual&&Number.isFinite(manual.lat)&&Number.isFinite(manual.lon)&&Math.abs(manual.lat)<=90&&Math.abs(manual.lon)<=180;
  if(photo?.locationVisibility==='approximate') {
    const point=photo.publicLocation || (valid?manual:resolvePhotoLocation(photo));
    return point&&Number.isFinite(point.lat)&&Number.isFinite(point.lon)?{lat:Number(point.lat.toFixed(2)),lon:Number(point.lon.toFixed(2)),label:'Approximate area',source:'approximate'}:null;
  }
  if(valid)return {...manual,label:manual.lat.toFixed(6)+', '+manual.lon.toFixed(6),source:'gps'};
  return resolvePhotoLocation(photo);
}
function photoLocationDetails(photo) {
  if(photo?.locationVisibility==='hidden')return '';
  const location=photoLocation(photo);
  const caption=String(photo?.desc||'').split('•').slice(1).map(s=>s.trim()).join(', ');
  if(!location || location.source==='unresolved') return (location?.query || caption) ? '<section class="photo-location"><h3>Location</h3><p>'+escapeGalleryText(location?.query || caption)+'</p><a href="https://www.google.com/maps/search/?api=1&amp;query='+encodeURIComponent(location?.query || caption)+'" target="_blank" rel="noopener noreferrer">Find on Google Maps ↗</a></section>' : '';
  const {lat,lon,label,source}=location;
  const detailed=source==='gps'||source==='place';
  const delta=detailed?.004:.04;
  const bbox=[Math.max(-180,lon-delta),Math.max(-90,lat-delta),Math.min(180,lon+delta),Math.min(90,lat+delta)].join(',');
  const link='https://www.google.com/maps/search/?api=1&amp;query='+encodeURIComponent(lat+','+lon);
  const src='https://www.openstreetmap.org/export/embed.html?bbox='+encodeURIComponent(bbox)+'&layer=mapnik&marker='+encodeURIComponent(lat+','+lon);
  return '<section class="photo-location" data-source="'+escapeGalleryText(source)+'" aria-label="Photo location"><h3>Location</h3><p class="photo-location-landmark" hidden></p><p>'+escapeGalleryText(label)+'</p><small>'+(source==='place'?'Named place · from description':source==='gps'?'From photo GPS':source==='approximate'?'Approximate area · precise coordinates hidden':'Approximate area · from description')+'</small><div class="photo-location-map" data-lat="'+lat+'" data-lon="'+lon+'" role="img" aria-label="Map showing photo location"></div><a href="'+link+'" target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a></section>';
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

// Named venues resolved once from OSM; USLS campus uses OSM way 53441363.
const photoNamedPlaces = [
  {
    "pattern": "lakawon",
    "label": "Lakawon Island",
    "location": {
      "lat": 11.0424396,
      "lon": 123.1999923,
      "label": "Lakawon Island",
      "source": "place"
    }
  },
  {
    "pattern": "usls coliseum",
    "label": "USLS Coliseum",
    "location": {
      "lat": 10.6786648,
      "lon": 122.9613261,
      "label": "USLS Coliseum",
      "source": "place"
    }
  },
  {
    "pattern": "university of st\\. la salle|usls",
    "label": "University of St. La Salle",
    "location": {
      "lat": 10.678417,
      "lon": 122.962484,
      "label": "University of St. La Salle",
      "source": "place"
    }
  },
  {
    "pattern": "bantug lake",
    "label": "Bantug Lake Ranch",
    "location": {
      "lat": 10.6709752,
      "lon": 123.0613453,
      "label": "Bantug Lake Ranch",
      "source": "place"
    }
  },
  {
    "pattern": "\\btops\\b",
    "label": "TOPS Cebu",
    "location": {
      "lat": 10.37061,
      "lon": 123.8708771,
      "label": "TOPS Cebu",
      "source": "place"
    }
  },
  {
    "pattern": "bocal.bocal",
    "label": "Bocal-Bocal Spring Resort",
    "location": null
  },
  {
    "pattern": "lucky chinatown",
    "label": "Lucky Chinatown",
    "location": {
      "lat": 14.6032191,
      "lon": 120.9735421,
      "label": "Lucky Chinatown",
      "source": "place"
    }
  },
  {
    "pattern": "gawahon",
    "label": "Gawahon Eco Park",
    "location": {
      "lat": 10.7948353,
      "lon": 123.1806881,
      "label": "Gawahon Eco Park",
      "source": "place"
    }
  },
  {
    "pattern": "bacolod plaza",
    "label": "Bacolod Public Plaza",
    "location": null
  },
  {
    "pattern": "capitol.*lagoon|capitol park",
    "label": "Capitol Park and Lagoon",
    "location": {
      "lat": 10.6760444,
      "lon": 122.9520961,
      "label": "Capitol Park and Lagoon",
      "source": "place"
    }
  },
  {
    "pattern": "government center",
    "label": "Bacolod City Government Center",
    "location": {
      "lat": 10.6588455,
      "lon": 122.9665837,
      "label": "Bacolod City Government Center",
      "source": "place"
    }
  },
  {
    "pattern": "magikland",
    "label": "Magikland",
    "location": {
      "lat": 10.7803653,
      "lon": 122.9727033,
      "label": "Magikland",
      "source": "place"
    }
  },
  {
    "pattern": "panaad",
    "label": "Panaad Stadium",
    "location": {
      "lat": 10.6255143,
      "lon": 122.9651265,
      "label": "Panaad Stadium",
      "source": "place"
    }
  },
  {
    "pattern": "akashi",
    "label": "Akashi Kaikyo Bridge",
    "location": {
      "lat": 34.6158982,
      "lon": 135.0201373,
      "label": "Akashi Kaikyo Bridge",
      "source": "place"
    }
  },
  {
    "pattern": "silay public plaza",
    "label": "Silay Public Plaza",
    "location": null
  },
  {
    "pattern": "l'fisher",
    "label": "L'Fisher Hotel",
    "location": {
      "lat": 10.6798822,
      "lon": 122.9540076,
      "label": "L'Fisher Hotel",
      "source": "place"
    }
  },
  {
    "pattern": "kinkaku",
    "label": "Kinkaku-ji",
    "location": {
      "lat": 35.0395293,
      "lon": 135.7295373,
      "label": "Kinkaku-ji",
      "source": "place"
    }
  },
  {
    "pattern": "tomongtong",
    "label": "Tomongtong Mangrove Eco-Trail",
    "location": {
      "lat": 10.8919777,
      "lon": 122.9536625,
      "label": "Tomongtong Mangrove Eco-Trail",
      "source": "place"
    }
  },
  {
    "pattern": "san diego pro",
    "label": "San Diego Pro-Cathedral",
    "location": {
      "lat": 10.8002287,
      "lon": 122.97586,
      "label": "San Diego Pro-Cathedral",
      "source": "place"
    }
  },
  {
    "pattern": "garden of eden",
    "label": "Eden Nature Park",
    "location": {
      "lat": 7.0282403,
      "lon": 125.401755,
      "label": "Eden Nature Park",
      "source": "place"
    }
  },
  {
    "pattern": "ikea",
    "label": "IKEA Pasay City",
    "location": {
      "lat": 14.5322977,
      "lon": 120.9828561,
      "label": "IKEA Pasay City",
      "source": "place"
    }
  },
  {
    "pattern": "citadines",
    "label": "Citadines Bacolod",
    "location": {
      "lat": 10.7014179,
      "lon": 122.9629502,
      "label": "Citadines Bacolod",
      "source": "place"
    }
  },
  {
    "pattern": "national museum exterior",
    "label": "National Museum Davao",
    "location": {
      "lat": 7.0702233,
      "lon": 125.6091628,
      "label": "National Museum Davao",
      "source": "place"
    }
  },
  {
    "pattern": "star city",
    "label": "Star City",
    "location": {
      "lat": 14.5557393,
      "lon": 120.98575,
      "label": "Star City",
      "source": "place"
    }
  },
  {
    "pattern": "moa sky",
    "label": "SM Mall of Asia",
    "location": {
      "lat": 14.5351818,
      "lon": 120.9815994,
      "label": "SM Mall of Asia",
      "source": "place"
    }
  },
  {
    "pattern": "sm north block|costumes display at sm",
    "label": "SM City Bacolod",
    "location": {
      "lat": 10.6722145,
      "lon": 122.9443594,
      "label": "SM City Bacolod",
      "source": "place"
    }
  },
  {
    "pattern": "mount fuji",
    "label": "Mount Fuji",
    "location": {
      "lat": 35.3628384,
      "lon": 138.7307677,
      "label": "Mount Fuji",
      "source": "place"
    }
  },
  {
    "pattern": "national museum of natural history",
    "label": "National Museum of Natural History",
    "location": {
      "lat": 14.583296,
      "lon": 120.9822763,
      "label": "National Museum of Natural History",
      "source": "place"
    }
  },
  {
    "pattern": "naia",
    "label": "Ninoy Aquino International Airport",
    "location": {
      "lat": 14.5122467,
      "lon": 121.0219223,
      "label": "Ninoy Aquino International Airport",
      "source": "place"
    }
  },
  {
    "pattern": "rooster cafe",
    "label": "Rooster Cafe Patag",
    "location": {
      "lat": 10.739693,
      "lon": 123.1046331,
      "label": "Rooster Cafe Patag",
      "source": "place"
    }
  }
];
