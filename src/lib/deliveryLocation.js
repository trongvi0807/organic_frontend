export function validLocation(latitude, longitude) {
  return latitude !== '' && longitude !== '' && latitude != null && longitude != null
    && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
    && Math.abs(Number(latitude)) <= 90 && Math.abs(Number(longitude)) <= 180;
}
export function parseMapLocation(input) {
  let text = String(input || '').trim();
  try { text = decodeURIComponent(text); } catch { /* Keep plain coordinates readable if URL encoding is invalid. */ }
  // Prefer the place marker over @latitude,longitude, which is only the map centre.
  const marker = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  const query = text.match(/[?&](?:q|query|destination)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)(?:[&#]|$)/);
  const plain = text.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
  const found = marker || query || plain;
  if (!found || !validLocation(found[1], found[2])) return null;
  return { latitude: Number(found[1]), longitude: Number(found[2]) };
}

export function isGoogleMapsLink(input) {
  try {
    const url = new URL(String(input).trim());
    return url.protocol === 'https:' && !url.username && !url.password && !url.port
      && ['maps.app.goo.gl', 'www.google.com', 'google.com', 'maps.google.com', 'www.google.com.vn', 'google.com.vn'].includes(url.hostname);
  } catch { return false; }
}
