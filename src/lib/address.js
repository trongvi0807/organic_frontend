export const addressText = (text = '') => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase()
  .replace(/\btp\.?\s*/g, 'thanh pho ').replace(/\bhcm\b/g, 'ho chi minh').replace(/\bq[.\s]*(\d+)/g, 'quan $1')
  .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
const simpleName = (s) => addressText(s).replace(/\b(thanh pho|tinh|phuong|xa|thi tran|dac khu)\b/g, '').trim().replace(/\s+/g, ' ');
const contains = (text, phrase) => (` ${text} `).includes(` ${phrase} `);
export function prepareAddresses(data) {
  const provinces = data.provinces;
  const wards = data.wards.map((w) => {
    const province = provinces.find((p) => p.code === w.provinceCode);
    const aliases = w.aliases || [];
    return { ...w, province, title: `${w.name}, ${province.name}`, normalizedTitle: simpleName(`${w.name} ${province.name}`), normalizedName: simpleName(w.name), aliasNames: aliases.map((a) => simpleName(a[0])), districtKeys: aliases.map((a) => simpleName(a[1])),
      search: simpleName([w.name, province.name, ...aliases.flatMap(([ward, district, oldProvince]) => [ward, `quan ${district}`, `huyen ${district}`, district, oldProvince])].join(' ')) };
  });
  const districtNames = [...new Set(wards.flatMap((w) => w.districtKeys))].filter(Boolean).sort((a, b) => b.length - a.length);
  return { ...data, wards, districtNames };
}
export function searchAddresses(data, query, provinceCode = '', limit = 8) {
  const q = simpleName(query);
  if (q.length < 2) return [];
  // Province-only queries still offer wards; the province is never guessed from GPS proximity.
  const district = data.districtNames.find((name) => contains(q, `quan ${name}`) || contains(q, `huyen ${name}`));
  const tokens = q.split(' ');
  return data.wards.filter((w) => (!provinceCode || w.provinceCode === provinceCode) && (!district || w.districtKeys.includes(district)) && tokens.every((t, i) => contains(w.search, t) || (i === tokens.length - 1 && w.search.split(' ').some((word) => word.startsWith(t)))))
    .map((w) => ({ ...w, score: contains(q, w.normalizedName) ? 3 : w.aliasNames.some((name) => contains(q, name)) ? 2 : 1 }))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'vi')).slice(0, limit);
}
export function exactAddress(data, text) {
  const normalized = simpleName(text);
  const current = data.wards.filter((w) => w.normalizedTitle === normalized);
  if (current.length === 1) return current[0];
  const results = searchAddresses(data, text, '', 2);
  return results.length === 1 && (contains(normalized, results[0].normalizedName) || results[0].aliasNames.some((name) => contains(normalized, name))) ? results[0] : null;
}
export function formatShippingAddress(address, data) {
  const ward = data?.wards.find((w) => w.code === address.wardCode && w.provinceCode === address.provinceCode);
  if (!ward) throw new Error('Vui lòng chọn Tỉnh / Thành phố và Xã / Phường từ danh sách.');
  if (!address.street.trim()) throw new Error('Vui lòng nhập số nhà, tên đường hoặc thôn, xóm.');
  const result = `${address.street.trim()}, ${ward.name}, ${ward.province.name}`;
  if (result.length > 500) throw new Error('Địa chỉ tối đa 500 ký tự.');
  return result;
}
export function savedAddressToForm(saved, data) {
  const query = [saved.ward, saved.province].filter(Boolean).join(', ');
  const ward = exactAddress(data, query);
  return { provinceCode: ward?.provinceCode || '', wardCode: ward?.code || '', street: saved.streetAddress || '', search: query };
}
// GeoJSON [longitude, latitude], ray casting with polygon holes and multipolygons.
function inRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (((yi > y) !== (yj > y)) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export function pointInGeometry(point, geometry) {
  const polygons = geometry?.type === 'Polygon' ? [geometry.coordinates] : geometry?.type === 'MultiPolygon' ? geometry.coordinates : [];
  return polygons.some((rings) => inRing(point, rings[0]) && !rings.slice(1).some((ring) => inRing(point, ring)));
}
