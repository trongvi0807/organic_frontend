// An unavailable response is unknown, never zero. Counts belong to a specific SKU.
export function availableVariantQuantity(availability, variantId) {
  if (!variantId || !availability?.availableQuantity || typeof availability.availableQuantity !== 'object') return null;
  const raw = availability.availableQuantity[variantId];
  if (raw === null || raw === undefined || raw === '') return null;
  const quantity = Number(raw);
  return Number.isSafeInteger(quantity) && quantity >= 0 ? quantity : null;
}

export function inlineAvailableQuantity(product, variantId) {
  if (variantId && product?.availableQuantity && typeof product.availableQuantity === 'object') {
    return availableVariantQuantity(product, variantId);
  }
  const variant = (product?.variants || []).find((item) => item.id === variantId);
  const raw = variant?.availableQuantity ?? (variantId === product?.defaultVariantId ? product?.stock : undefined);
  if (raw === null || raw === undefined || raw === '') return null;
  const quantity = Number(raw);
  return Number.isSafeInteger(quantity) && quantity >= 0 ? quantity : null;
}
