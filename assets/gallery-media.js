/* Shared URL resolver: deployed photos keep their paths; new uploads use Blob variants. */
function galleryMediaURL(photo, width, fallback) {
  return photo?.variants?.[width] || photo?.url || fallback;
}

function escapeGalleryText(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
}
