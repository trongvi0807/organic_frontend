// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { useSaleChoice } from './useSaleChoice';

it('keeps the initially displayed date unavailable instead of substituting the next date after refresh', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'), root = createRoot(container);
  let result;
  function Probe({ options, variant }) {
    result = useSaleChoice({ quantities: { saleOptions: options } }, variant);
    return h('span', {}, result.selected?.selectionKey || 'unavailable');
  }
  const early = { variantId: 'v1', selectionKey: 'v1~2026-11-20~', availableQuantity: 1 };
  const late = { variantId: 'v1', selectionKey: 'v1~2026-11-25~', availableQuantity: 5 };
  const other = { variantId: 'v2', selectionKey: 'v2~2026-11-25~', availableQuantity: 3 };
  try {
    await act(async () => root.render(h(Probe, { options: [early, late], variant: 'v1' })));
    expect(result.selected.selectionKey).toBe(early.selectionKey);
    await act(async () => root.render(h(Probe, { options: [late], variant: 'v1' })));
    expect(result.selected).toBeNull();
    await act(async () => result.setKey(late.selectionKey));
    expect(result.selected.selectionKey).toBe(late.selectionKey);
    await act(async () => root.render(h(Probe, { options: [late, other], variant: 'v2' })));
    expect(result.selected.selectionKey).toBe(other.selectionKey);
  } finally { await act(async () => root.unmount()); }
});
