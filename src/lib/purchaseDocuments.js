export const purchaseUnits = ['gói', 'hộp', 'chai', 'túi', 'kg', 'g', 'lít', 'ml'];
export function purchaseProductChoices(rows = [], selectedIds = []) {
  const excluded = new Set(selectedIds);
  return rows.filter((row) => !excluded.has(row.variant.id)).map((row) => ({ ...row.variant, purchasedBefore: row.purchasedBefore, purchaseUnit: row.purchaseUnit }))
    .sort((a, b) => Number(b.purchasedBefore) - Number(a.purchasedBefore) || a.productName.localeCompare(b.productName, 'vi') || a.sku.localeCompare(b.sku));
}
export const packageUnit = (unit) => ['gói', 'hộp', 'chai', 'túi'].includes(unit);
export const purchaseUnit = (line) => line?.purchaseUnit || inferPurchaseUnit(line?.variant || line);
export function inferPurchaseUnit(variant = {}) {
  const name = String(variant.variantName || '').trim().toLowerCase();
  const pack = purchaseUnits.slice(0, 4).find((unit) => name.startsWith(unit));
  const measure = variant.unitId === 'l' ? 'lít' : variant.unitId;
  return pack || (purchaseUnits.includes(measure) ? measure : 'gói');
}
export const purchaseQuantity = (value) => Number(value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 3 });
export const purchaseMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} VNĐ`;
export function validPurchaseQuantity(value, unit = 'gói', zero = false) {
  return /^\d+(\.\d{1,3})?$/.test(String(value)) && Number.isFinite(Number(value))
    && Number(value) >= (zero ? 0 : 0.001) && Number(value) <= 99999999999.999
    && (!packageUnit(unit) || Number.isInteger(Number(value)));
}
export function numberInputDisplay(value) {
  if (value === '' || value == null) return '';
  const [whole, fraction] = String(value).split('.');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}${fraction != null ? `,${fraction}` : ''}`;
}
export function numberInputValue(text, scale = 3) {
  const value = text.replaceAll('.', '').replace(',', '.');
  return new RegExp(`^\\d*(?:\\.\\d{0,${scale}})?$`).test(value) ? value : null;
}
