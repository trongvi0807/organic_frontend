// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useStockUpdates } from './useStockUpdates';
import { useProductAvailability } from './useProductAvailability';

const mocks = vi.hoisted(() => ({ invalidate: vi.fn(), availability: vi.fn() }));
vi.mock('@/services/api', () => ({ publicApi: { defaults: { baseURL: '/api/v1' } }, DEMO_MODE: false }));
vi.mock('@/services/client/catalogService', () => ({
  invalidateProductAvailability: mocks.invalidate,
  catalogService: { availability: mocks.availability },
}));

let container, root, streams, visibility;
const product = { id: 'p' };
class StockStream extends EventTarget {
  constructor(url) { super(); this.url = url; this.close = vi.fn(); streams.push(this); }
}
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers(); vi.clearAllMocks();
  streams = []; visibility = 'visible';
  vi.stubGlobal('EventSource', StockStream);
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount()); container.remove();
  vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks();
});
function Probe() {
  useStockUpdates();
  const stock = useProductAvailability(product, 'v');
  return createElement('span', {}, String(stock.quantity));
}
it('updates another shopper from one unit to zero after an order hold and restores it after release', async () => {
  mocks.availability.mockResolvedValue({ availableQuantity: { v: 1 } });
  await act(async () => root.render(createElement(Probe)));
  expect(container.textContent).toBe('1');
  expect(streams).toHaveLength(1);
  expect(streams[0].url).toBe('/api/v1/products/stock-events');
  mocks.availability.mockResolvedValue({ availableQuantity: { v: 0 } });
  await act(async () => {
    streams[0].dispatchEvent(new Event('stock-changed'));
    streams[0].dispatchEvent(new Event('stock-changed'));
    vi.advanceTimersByTime(100);
  });
  expect(container.textContent).toBe('0');
  expect(mocks.availability).toHaveBeenCalledTimes(2);
  expect(mocks.availability).toHaveBeenLastCalledWith('p', { fresh: true });
  mocks.availability.mockResolvedValue({ availableQuantity: { v: 1 } });
  await act(async () => { streams[0].dispatchEvent(new Event('stock-changed')); vi.advanceTimersByTime(100); });
  expect(container.textContent).toBe('1');
});
it('closes while hidden, refreshes after reconnect and cleans up on leaving the storefront', async () => {
  mocks.availability.mockResolvedValue({ availableQuantity: { v: 1 } });
  await act(async () => root.render(createElement(Probe)));
  await act(async () => { visibility = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); });
  expect(streams[0].close).toHaveBeenCalledOnce();
  await act(async () => { visibility = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
  expect(streams).toHaveLength(2);
  await act(async () => { streams[1].dispatchEvent(new Event('open')); vi.advanceTimersByTime(100); });
  expect(mocks.invalidate).toHaveBeenCalledOnce();
  await act(async () => root.render(null));
  expect(streams[1].close).toHaveBeenCalledOnce();
});
