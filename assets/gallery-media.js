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
    FC7203: 'DJI Mavic Mini / Mini SE', // Both aircraft use this camera model.
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
  return names[model] || (explicit ? 'DJI ' + explicit : original);
}

// Additional code evidence (original EXIF / first-hand camera tests):
// FC7203 shared: https://air.unimi.it/retrieve/db757cc2-a483-4a1f-a1be-8daae2eec9f6/unpaywall-bitstream-1705428023_compressed.pdf
// FC7503: https://www.jetphotos.com/photo/11682904
// FC7703: https://commons.wikimedia.org/wiki/File:Dji_fly_20250220_141052_394_1740057106149_photo_optimized.jpg
// FC3682: https://www.jetphotos.com/photo/11660804
// FC9313: https://github.com/Sapphire-Rapids/DJI-RC2-Mini5Pro-Research/blob/main/docs/14_SOURCE_INDEX.md
// FC9670: https://www.helicomicro.com/2026/04/23/dji-lito-1-test/
// FC9589: https://www.helicomicro.com/2026/04/23/dji-lito-x1-test/
