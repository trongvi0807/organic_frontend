import api, { publicApi, unwrap } from '../api';

// Guest cookies are HttpOnly; the browser owns them. Staff accounts have no customer cart.
export function createCartService(authenticated) {
  const client = authenticated ? api : publicApi;
  const request = async (method, path = '', data) => unwrap(await client.request({ method, url: `/cart${path}`, data, withCredentials: true }));
  return {
    get: () => request('get'),
    add: (variantId, quantity) => request('post', '/items', { variantId, quantity }),
    quantity: (variantId, quantity) => request('patch', `/items/${encodeURIComponent(variantId)}`, { quantity }),
    remove: (variantId) => request('delete', `/items/${encodeURIComponent(variantId)}`),
    clear: () => request('delete'),
    merge: () => request('post', '/merge'),
  };
}
