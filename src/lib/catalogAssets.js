const nullable = (value) => String(value ?? '').trim() || null;
function decimal(value, label, integer, fraction, minimum) {
  const text = String(value ?? '').trim();
  if (!new RegExp(`^\\d{1,${integer}}${fraction ? `(\\.\\d{1,${fraction}})?` : ''}$`).test(text) || Number(text) < minimum) throw new Error(`${label} không hợp lệ.`);
  return Number(text);
}
export function variantPayload(values) {
  const payload = {
    sku: String(values.sku || '').trim(), variantName: String(values.variantName || '').trim(),
    netQuantity: decimal(values.netQuantity, 'Khối lượng / dung tích', 9, 3, 0.001), unitId: String(values.unitId || '').trim(),
    sellingPrice: decimal(values.sellingPrice, 'Giá bán', 12, 2, 0.01),
    compareAtPrice: nullable(values.compareAtPrice) === null ? null : decimal(values.compareAtPrice, 'Giá gốc', 12, 2, 0.01),
    barcode: nullable(values.barcode), reorderLevel: nullable(values.reorderLevel) === null ? null : decimal(values.reorderLevel, 'Ngưỡng cảnh báo', 11, 0, 0),
    status: values.status || 'active',
  };
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(payload.sku) || !payload.variantName || payload.variantName.length > 150 || !payload.unitId || payload.unitId.length > 20 || (payload.barcode?.length || 0) > 100 || !['active','inactive'].includes(payload.status)) throw new Error('Kiểm tra SKU, tên quy cách, đơn vị và trạng thái.');
  if (payload.compareAtPrice !== null && payload.compareAtPrice < payload.sellingPrice) throw new Error('Giá gốc phải lớn hơn hoặc bằng giá bán.');
  return payload;
}
export function imagePayload(values) {
  const imageUrl = String(values.imageUrl || '').trim(), altText = nullable(values.altText);
  if (!imageUrl || imageUrl.length > 1000 || (altText?.length || 0) > 255) throw new Error('Kiểm tra đường dẫn và mô tả ảnh.');
  return { imageUrl, altText, sortOrder: decimal(values.sortOrder, 'Thứ tự ảnh', 10, 0, 0), isPrimary: values.isPrimary === true || values.isPrimary === 'on' };
}
