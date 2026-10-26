export const cartItemKey = (item) => item.cartKey || item.id;
export const quantityLimit = (item) => item.serverCart ? item.available === false ? 0 : Math.min(item.maxQuantity || 999, Number.isInteger(item.availableQuantity) ? Math.max(0,item.availableQuantity) : 999) : Math.max(0, Math.min(99, Math.floor(Number(item.stock ?? 99)) || 0));
export const canPurchase = (item) => quantityLimit(item) > 0 && Number.isFinite(Number(item.minPrice)) && Number(item.minPrice) > 0 && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= quantityLimit(item);
export const selectedCartItems = (items) => items.filter((item) => item.selected !== false && canPurchase(item));
export function parseCartQuantity(value, limit = 999) {
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) throw new Error('Số lượng phải là số nguyên lớn hơn 0.');
  if (Number(value) > limit) throw new Error(`Bạn chỉ có thể mua tối đa ${limit} sản phẩm cho quy cách này.`);
  return Number(value);
}

// Preview offers only. Replace with server validation before accepting real orders.
export const PREVIEW_PROMOTIONS = [
  { code: 'MOC10', minimum: 200000, percent: 10, maximum: 50000, description: 'Giảm 10%, tối đa 50.000đ, cho đơn từ 200.000đ' },
  { code: 'XANH30', minimum: 300000, amount: 30000, description: 'Giảm 30.000đ cho đơn từ 300.000đ' },
];

export function cartTotals(items, code = '') {
  const selected = selectedCartItems(items);
  const subtotal = selected.reduce((sum, item) => sum + Math.round(Number(item.minPrice) * item.quantity), 0);
  const normalizedCode = String(code).trim().toUpperCase();
  const offer = PREVIEW_PROMOTIONS.find((item) => item.code === normalizedCode);
  let promoError = '';
  if (normalizedCode && !offer) promoError = 'Mã ưu đãi không hợp lệ. Vui lòng kiểm tra lại.';
  else if (offer && !selected.length) promoError = 'Hãy chọn sản phẩm trước khi áp dụng mã.';
  else if (offer && subtotal < offer.minimum) promoError = `Đơn hàng đã chọn chưa đạt mức tối thiểu ${offer.minimum.toLocaleString('vi-VN')}đ.`;
  const discount = offer && !promoError ? Math.min(subtotal, offer.amount ?? Math.min(Math.round(subtotal * offer.percent / 100), offer.maximum)) : 0;
  return { selected, subtotal, discount, total: Math.max(0, subtotal - discount), quantity: selected.reduce((sum, item) => sum + item.quantity, 0), promoError, offer: offer && !promoError ? offer : null };
}

export function changeCartQuantity(items, key, amount) {
  if (!Number.isInteger(amount)) return items;
  return items.map((item) => cartItemKey(item) === key && quantityLimit(item) > 0
    ? { ...item, quantity: Math.max(1, Math.min(item.quantity + amount, quantityLimit(item))) } : item);
}

export function selectCartItem(items, key, selected) {
  return items.map((item) => cartItemKey(item) === key ? { ...item, selected: canPurchase(item) && selected } : item);
}

export function selectAllCartItems(items, selected) {
  return items.map((item) => ({ ...item, selected: canPurchase(item) && selected }));
}
