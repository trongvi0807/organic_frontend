// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { useSaleChoice } from './useSaleChoice';

it('shows one current offer and returns to ordinary stock when it is gone', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'), root = createRoot(container);
  let result;
  function Probe({ options, variant }) {
    result = useSaleChoice({ quantities: { saleOptions: options } }, variant);
    return h('span', {}, result.selected?.selectionKey || 'unavailable');
  }
  const early = { variantId: 'v1', expiryDate: '2026-11-20', promotionId: 'offer', price: 7000, selectionKey: 'v1~2026-11-20~offer', availableQuantity: 1 };
  const late = { variantId: 'v1', expiryDate: null, price: 10000, selectionKey: 'v1', availableQuantity: 5 };
  const other = { variantId: 'v2', expiryDate: null, selectionKey: 'v2', availableQuantity: 3 };
  try {
    await act(async () => root.render(h(Probe, { options: [early, late], variant: 'v1' })));
    expect(result.selected.selectionKey).toBe(early.selectionKey);
    await act(async () => root.render(h(Probe, { options: [late], variant: 'v1' })));
    expect(result.selected.selectionKey).toBe(late.selectionKey);
    expect(result.selected.expiryDate).toBeNull();
    await act(async () => root.render(h(Probe, { options: [late, other], variant: 'v2' })));
    expect(result.selected.selectionKey).toBe(other.selectionKey);
  } finally { await act(async () => root.unmount()); }
});
