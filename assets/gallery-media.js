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
    'L1D-20C': 'DJI Mavic 2 Pro',
    FC3582: 'DJI Mini 3 Pro',
    FC8482: 'DJI Mini 4 Pro',
    FC3411: 'DJI Air 2S',
    FC8282: 'DJI Air 3'
  };
  return names[model] || original;
}
