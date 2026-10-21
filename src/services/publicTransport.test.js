import { afterEach, describe, expect, it, vi } from 'vitest';
import api, { publicApi, SESSION_KEY } from './api';

afterEach(() => vi.unstubAllGlobals());
describe('Public Home remains independent of authentication', () => {
  it('does not attach the private bearer token to public requests', async () => {
    vi.stubGlobal('sessionStorage', { getItem: () => JSON.stringify({ accessToken: 'test-token' }) });
    const adapter = vi.fn(async (config) => ({ data: {}, status: 200, statusText: 'OK', headers: {}, config }));
    await api.get('/customers', { adapter });
    await publicApi.get('/home', { adapter });
    expect(adapter.mock.calls[0][0].headers.Authorization).toBe('Bearer test-token');
    expect(adapter.mock.calls[1][0].headers.Authorization).toBeUndefined();
  });
  it('does not clear an existing session when a public endpoint fails', async () => {
    const remove = vi.fn(), dispatch = vi.fn();
    vi.stubGlobal('sessionStorage', { getItem: () => JSON.stringify({ accessToken: 'test-token' }), removeItem: remove });
    vi.stubGlobal('window', { dispatchEvent: dispatch });
    const adapter = async (config) => { throw { response: { status: 401 }, config }; };
    await expect(publicApi.get('/home', { adapter })).rejects.toBeDefined();
    expect(remove).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
    await expect(api.get('/customers', { adapter })).rejects.toBeDefined();
    expect(remove).toHaveBeenCalledWith(SESSION_KEY);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
