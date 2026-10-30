export const DEFAULT_SHELF_LIFE_DAYS = 10;

export function addReceiptDays(day, days = DEFAULT_SHELF_LIFE_DAYS) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || '')) return '';
  const date = new Date(`${day}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) return '';
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function receiptOriginText(origin) {
  if (!origin) return '';
  const seen = new Set();
  return [origin.originName, origin.producerName, origin.region, origin.country]
    .map((value) => String(value || '').trim()).filter((value) => {
      const key = value.toLocaleLowerCase('vi-VN');
      if (!value || seen.has(key)) return false;
      seen.add(key); return true;
    }).join(' · ').slice(0, 500);
}

export function changeReceiptLine(item, field, value) {
  if (field === 'manufactureDate') return { ...item, manufactureDate: value,
    ...(item.expiryDateAutomatic ? { expiryDate: addReceiptDays(value) } : {}) };
  if (field === 'expiryDate') return { ...item, expiryDate: value, expiryDateAutomatic: false };
  if (field === 'originDescription') return { ...item, originDescription: value, originEdited: true };
  return { ...item, [field]: value };
}

export function applyReceiptOrigins(items, byProductId) {
  let changed = false;
  const next = items.map((item) => {
    const id = item.variant?.productId;
    if (item.originEdited || !id || !Object.hasOwn(byProductId, id) || item.originDescription === byProductId[id]) return item;
    changed = true; return { ...item, originDescription: byProductId[id] };
  });
  return changed ? next : items;
}
