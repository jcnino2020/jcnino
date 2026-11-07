// Shuffle once per page load, keeping any curated opening photos in place.
// Copy the array so saved gallery data and photo identities remain unchanged.
function shuffleGalleryPhotos(photos, fixedCount = 0) {
  const ordered = photos.slice();
  for (let i = ordered.length - 1; i > fixedCount; i--) {
    const j = fixedCount + Math.floor(Math.random() * (i - fixedCount + 1));
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
  }
  return ordered;
}
