// Reproducible, attributed snapshot. No customer addresses or coordinates are sent.
import { mkdir, writeFile } from 'node:fs/promises';
const base = 'https://tinhthanhpho.com/data/';
async function get(file) { const r = await fetch(base + file); if (!r.ok) throw new Error(`${file}: ${r.status}`); return r.json(); }
const [provinces, wards, history, legacy, boundaries] = await Promise.all(['provinces.json', 'wards.json', 'ward-merge-history.json', 'provinces-legacy.json', 'provinces.geojson'].map(get));
const aliases = new Map();
for (const row of history.data) {
  const list = aliases.get(row.new_ward_code) || [];
  const oldProvince = legacy.data.find((p) => p.code === row.old_province_code);
  list.push([row.old_ward_name, row.old_district_name, oldProvince?.name || '', row.scope]);
  aliases.set(row.new_ward_code, list);
}
const data = { metadata: { ...wards.metadata, snapshot_date: new Date().toISOString().slice(0, 10), source: base, transformations: 'Reduced to codes/names and legacy aliases; boundaries unchanged.' },
  provinces: provinces.data.map((p) => ({ code: p.code, name: `${p.type} ${p.name}` })),
  wards: wards.data.map((w) => ({ code: w.code, provinceCode: w.province_code, name: `${w.type} ${w.name}`, aliases: [...new Map((aliases.get(w.code) || []).map((a) => [JSON.stringify(a), a])).values()] })) };
if (data.provinces.length !== 34 || data.wards.length !== 3321) throw new Error('Unexpected dataset size; review administrative changes before replacing snapshot.');
await mkdir('public/data/address', { recursive: true });
await writeFile('public/data/address/vietnam.json', JSON.stringify(data));
await writeFile('public/data/address/provinces.geojson', JSON.stringify(boundaries));
console.log(`Saved ${data.provinces.length} provinces, ${data.wards.length} wards. Version ${data.metadata.data_version}.`);
