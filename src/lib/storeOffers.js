import { canPurchase } from './cart';
import { currency } from './utils';

export const offerActive = (offer, now = Date.now()) => Date.parse(offer.startsAt) <= now && now < Date.parse(offer.endsAt);
export const offerBenefit = offer => offer.discountType === 'percentage'
  ? `giảm ${Number(offer.discountValue).toLocaleString('vi-VN')}%`
  : `giảm ${currency(offer.discountValue)}${offer.promotionType === 'combo' ? ' mỗi bộ' : ''}`;
export const productKey = row => row.productId || row.id;

export function comboProgress(offer, rows) {
  const totals = new Map();
  rows.filter(row => row.selected !== false && canPurchase(row)).forEach(row => totals.set(productKey(row), (totals.get(productKey(row)) || 0) + row.quantity));
  const products = offer.products || [];
  return {
    related: products.some(p => (totals.get(p.productId) || 0) > 0),
    sets: products.length ? Math.min(...products.map(p => Math.floor((totals.get(p.productId) || 0) / p.requiredQuantity))) : 0,
    missing: products.map(p => ({ ...p, missingQuantity: Math.max(0, p.requiredQuantity - (totals.get(p.productId) || 0)) })).filter(p => p.missingQuantity > 0),
  };
}
export function offerVariant(product, choices = {}, rows = [], needed = product.requiredQuantity) {
  const variants = product.variants || [];
  const chosen = choices[product.productId];
  if (chosen) return variants.find(v => v.id === chosen);
  const capacity = v => Number(v.availableQuantity) - rows.filter(row => row.variantId === v.id).reduce((sum, row) => sum + row.quantity, 0);
  return variants.find(v => capacity(v) >= needed) || variants[0];
}
export function comboEstimate(offer, choices = {}) {
  const subtotal = offer.products.reduce((sum, p) => sum + Number(offerVariant(p, choices)?.price || 0) * p.requiredQuantity, 0);
  let discount = subtotal >= Number(offer.minOrderValue) ? offer.discountType === 'percentage'
    ? Math.round(subtotal * Number(offer.discountValue) / 100) : Number(offer.discountValue) : 0;
  if (offer.maxDiscountAmount != null) discount = Math.min(discount, Number(offer.maxDiscountAmount));
  discount = Math.max(0, Math.min(subtotal, discount));
  return { subtotal, discount, total: subtotal - discount };
}
export function comboAdditions(offer, rows, choices = {}, missingOnly = false) {
  const progress = comboProgress(offer, rows);
  const needs = missingOnly ? progress.missing.map(p => ({ ...p, requiredQuantity: p.missingQuantity })) : offer.products;
  return needs.map(p => {
    const variant = offerVariant(p, choices, rows, p.requiredQuantity);
    const existing = rows.filter(row => row.variantId === variant?.id).reduce((sum, row) => sum + row.quantity, 0);
    if (!variant || variant.availableQuantity < existing + p.requiredQuantity || existing + p.requiredQuantity > 999)
      throw new Error(`${p.productName}: chưa đủ hàng ở quy cách này. Hãy chọn quy cách khác hoặc điều chỉnh giỏ hàng.`);
    return { variantId: variant.id, quantity: p.requiredQuantity };
  });
}
