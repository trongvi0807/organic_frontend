import api, { unwrap } from '../api';
import { requireBackend } from '../backendGuard';

export const deliveryService = {
  async configuration() { requireBackend(); return unwrap(await api.get('/management/delivery/configuration')); },
  async saveConfiguration(values) { requireBackend(); return unwrap(await api.put('/management/delivery/configuration', values)); },
  async locations(search) { requireBackend(); return unwrap(await api.get('/management/delivery/locations', { params: { search } })); },
  async resolveMapLink(url) { requireBackend(); return unwrap(await api.post('/management/delivery/locations/resolve', { url }, { timeout: 15000 })); },
};
