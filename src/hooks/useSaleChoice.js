import { currentSale, saleChoices } from '@/lib/saleOptions';

export function useSaleChoice(availability, variantId) {
  const choices = saleChoices(availability.quantities, variantId);
  return { choices, selected: currentSale(choices),
    supported: Array.isArray(availability.quantities?.saleOptions) };
}
