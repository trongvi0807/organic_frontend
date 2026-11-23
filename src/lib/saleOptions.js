export const saleKey = (item) => item.selectionKey || (item.expiryDate
  ? `${item.variantId}~${item.expiryDate}~${item.salePromotionId || item.promotionId || ''}` : item.variantId);

export function saleChoices(availability, variantId) {
  return (availability?.saleOptions || []).filter(option => option.variantId === variantId && option.availableQuantity > 0);
}

export function saleFields(option) {
  return option ? { expiryDate: option.expiryDate, salePromotionId: option.promotionId || null, selectionKey: option.selectionKey } : {};
}

// Date-specific campaigns are one advertised offer, never a customer-facing list of lots.
export function currentSale(choices = []) {
  const direct = choices.filter(option => !option.combo && option.availableQuantity > 0);
  const campaign = direct.filter(option => option.promotionId).sort((a, b) =>
    String(a.expiryDate).localeCompare(String(b.expiryDate)) || Number(a.price) - Number(b.price) || a.selectionKey.localeCompare(b.selectionKey))[0];
  if (campaign) return campaign;
  const ordinary = direct.filter(option => !option.promotionId);
  if (!ordinary.length) return null;
  // Show the earliest sellable expiry, without turning ordinary stock into a dated purchase choice.
  const nearestExpiryDate = ordinary.map(option => option.nearestExpiryDate || option.expiryDate).filter(Boolean).sort()[0] || null;
  return { ...ordinary[0], expiryDate: null, promotionId: null, selectionKey: ordinary[0].variantId,
    nearestExpiryDate,
    availableQuantity: ordinary.reduce((sum, option) => sum + option.availableQuantity, 0) };
}

export function effectiveSale(choices, selectedKey) {
  return selectedKey ? choices.find(option => option.selectionKey === selectedKey) || null : choices[0] || null;
}
