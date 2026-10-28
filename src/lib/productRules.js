import { searchText } from './adminFormat';
import { nextRecordCode } from './recordCodes';
export const defaultProductRules = { codePrefix: 'SP', defaultUnit: 'kg', defaultQuantity: 1, defaultPackage: 'Gói', units: ['g', 'kg', 'ml', 'l'], packages: ['Gói', 'Hộp', 'Túi', 'Chai'] };
const key = 'moc.admin.product-rules.v2';
export function readProductRules() {
  try {
    const saved = localStorage.getItem(key);
    const legacy = !saved && localStorage.getItem('moc.admin.product-rules.v1');
    return checkedRules({ ...defaultProductRules, ...JSON.parse(saved || legacy || '{}'), ...(!saved ? { codePrefix: 'SP' } : {}) });
  } catch { return { ...defaultProductRules }; }
}
function checkedRules(rules) {
  if (!/^[A-Z][A-Z0-9_-]{0,9}$/.test(rules.codePrefix) || !Array.isArray(rules.units) || !rules.units.length || rules.units.some((u) => !/^[A-Za-z0-9_-]{1,20}$/.test(u)) || !Array.isArray(rules.packages) || !rules.packages.length || rules.packages.some((p) => typeof p !== 'string' || !p.trim() || p.length > 40) || !rules.packages.includes(rules.defaultPackage) || !rules.units.includes(rules.defaultUnit) || !/^\d{1,9}(\.\d{1,3})?$/.test(String(rules.defaultQuantity)) || Number(rules.defaultQuantity) < .001) throw new Error('Kiểm tra tiền tố mã, đơn vị và khối lượng mặc định.');
  return Object.fromEntries(Object.keys(defaultProductRules).map((field) => [field, field === 'defaultQuantity' ? Number(rules[field]) : rules[field]]));
}
export function saveProductRules(rules) { localStorage.setItem(key, JSON.stringify(checkedRules(rules))); }
export function generateProductCode(category, rules = defaultProductRules, rows = []) {
  if (!category?.id) return '';
  return nextRecordCode(rows, 'productCode', rules.codePrefix);
}
export const duplicateProduct = (rows, values, id) => rows.find((row) => (!id || row.id !== id) && (searchText(row.productCode) === searchText(values.productCode) || searchText(row.productName).replace(/\s+/g, ' ') === searchText(values.productName).replace(/\s+/g, ' ')));
export function receiptLineErrors(line, day) {
  const errors = {};
  const received = Number(line.quantityReceived), rejected = Number(line.quantityRejected);
  const integer = (v) => v !== '' && Number.isSafeInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 99999999999;
  if (!integer(line.quantityReceived)) errors.quantityReceived = 'Số đạt phải là số nguyên không âm.';
  if (!integer(line.quantityRejected)) errors.quantityRejected = 'Số loại phải là số nguyên không âm.';
  const capacity = Number(line.quantityAvailableToReceive ?? line.quantityOrdered);
  if (received + rejected > capacity) errors.quantityReceived = 'Tổng số đạt và số loại không được vượt số còn được nhận của đơn mua.';
  if (received < capacity && !line.discrepancyReason?.trim()) errors.discrepancyReason = 'Bổ sung lý do thiếu hàng hoặc loại hàng.';
  if (received > 0) {
    if (!line.batchCode?.trim()) errors.batchCode = 'Vui lòng nhập mã lô.';
    if (!line.expiryDate || line.expiryDate < day) errors.expiryDate = 'Chọn hạn dùng hợp lệ, không được trước hôm nay.';
    if (line.manufactureDate && (line.manufactureDate > day || line.manufactureDate > line.expiryDate)) errors.manufactureDate = 'Ngày sản xuất không được trong tương lai hoặc sau hạn dùng.';
  }
  return errors;
}
