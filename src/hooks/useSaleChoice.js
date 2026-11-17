import { useEffect, useState } from 'react';
import { effectiveSale, saleChoices } from '@/lib/saleOptions';

export function useSaleChoice(availability, variantId) {
  const [choice, setChoice] = useState({ variantId, key: '' });
  const choices = saleChoices(availability.quantities, variantId);
  const firstKey = choices[0]?.selectionKey || '';
  // Remember the first displayed date too. Refreshes must never replace it silently.
  useEffect(() => {
    setChoice(current => current.variantId !== variantId
      ? { variantId, key: firstKey }
      : !current.key && firstKey ? { variantId, key: firstKey } : current);
  }, [variantId, firstKey]);
  const key = choice.variantId === variantId ? choice.key : '';
  return { choices, selected: effectiveSale(choices, key), setKey: key => setChoice({ variantId, key }),
    supported: Array.isArray(availability.quantities?.saleOptions) };
}
