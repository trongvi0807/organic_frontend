import { prepareAddresses, pointInGeometry } from '@/lib/address';
let cached;
const boundaries = new Map();
async function json(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000), credentials: 'omit' });
  if (!response.ok) throw new Error('Chưa tải được dữ liệu địa chỉ. Vui lòng thử lại hoặc chọn thủ công.');
  return response.json();
}
export function loadAddresses() {
  cached ||= json('/data/address/vietnam.json').then(prepareAddresses).catch((e) => { cached = null; throw e; });
  return cached;
}
function loadBoundary(url) {
  if (!boundaries.has(url)) boundaries.set(url, json(url).catch((e) => { boundaries.delete(url); throw e; }));
  return boundaries.get(url);
}
export async function addressAtCoordinates(latitude, longitude) {
  const [data, provinces] = await Promise.all([loadAddresses(), loadBoundary('/data/address/provinces.geojson')]);
  const point = [longitude, latitude];
  const province = provinces.features.find((f) => pointInGeometry(point, f.geometry));
  if (!province) throw new Error('Chưa xác định được Tỉnh / Thành phố tại vị trí này. Vui lòng chọn thủ công.');
  const runtime = typeof window === 'undefined' ? {} : window.__MOC_CONFIG__ || {};
  const base = runtime.VITE_ADDRESS_BOUNDARY_BASE_URL || import.meta.env.VITE_ADDRESS_BOUNDARY_BASE_URL || 'https://tinhthanhpho.com/data';
  // Only a province code leaves the browser. GPS coordinates are never sent to the data provider.
  const wards = await loadBoundary(`${base.replace(/\/$/, '')}/wards-${province.properties.code}.geojson`);
  const matches = wards.features.filter((f) => pointInGeometry(point, f.geometry));
  if (matches.length !== 1) throw new Error('Vị trí nằm gần ranh giới hoặc thiếu dữ liệu. Vui lòng chọn Xã / Phường thủ công.');
  const ward = data.wards.find((w) => w.code === matches[0].properties.code && w.provinceCode === province.properties.code);
  if (!ward) throw new Error('Dữ liệu ranh giới chưa khớp danh mục. Vui lòng chọn địa chỉ thủ công.');
  return ward;
}
