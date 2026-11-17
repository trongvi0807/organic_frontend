export const saleKey = (item) => item.selectionKey || (item.expiryDate
  ? `${item.variantId}~${item.expiryDate}~${item.salePromotionId || item.promotionId || ''}` : item.variantId);

export function saleChoices(availability, variantId) {
  return (availability?.saleOptions || []).filter(option => option.variantId === variantId && option.availableQuantity > 0);
}

export function saleFields(option) {
  return option ? { expiryDate: option.expiryDate, salePromotionId: option.promotionId || null, selectionKey: option.selectionKey } : {};
}

export function effectiveSale(choices, selectedKey) {
  return selectedKey ? choices.find(option => option.selectionKey === selectedKey) || null : choices[0] || null;
}
