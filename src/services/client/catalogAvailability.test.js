import { afterEach, expect, it, vi } from 'vitest';
import { catalogService, invalidateProductAvailability } from './catalogService';

const mock = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('../api', () => ({ publicApi: { get: mock.get }, DEMO_MODE: false, unwrap: response => response.data }));
afterEach(() => { invalidateProductAvailability(); vi.clearAllMocks(); });

it('does not reuse or recache an old stock response after an inventory update', async () => {
  let resolveOld;
  mock.get.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
  const stale = catalogService.availability('p');
  await vi.waitFor(() => expect(mock.get).toHaveBeenCalledOnce());
  invalidateProductAvailability();
  const empty = { productId: 'p', availableQuantity: { v: 0 } };
  mock.get.mockResolvedValue({ data: empty });
  expect(await catalogService.availability('p')).toEqual(empty);
  resolveOld({ data: { productId: 'p', availableQuantity: { v: 1 } } });
  await stale;
  expect(await catalogService.availability('p')).toEqual(empty);
  expect(mock.get).toHaveBeenCalledTimes(2);
});
