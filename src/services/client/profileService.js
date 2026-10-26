import api, { unwrap } from '../api';
import { optional, validateUpload } from '@/lib/apiData';
import { requireBackend } from '../backendGuard';
import { AVATAR_UPLOAD_TIMEOUT_MS } from '@/lib/avatarUpload';

export function createProfileService(id = 'me') {
  const base = `/customers/${id}`;
  return {
    async get() { requireBackend(); return unwrap(await api.get(base)); },
    async save(values) {
      requireBackend();
      const payload = Object.fromEntries(['fullName', 'phoneNumber', 'email', 'dateOfBirth'].map((key) => [key, optional(values[key])]));
      return unwrap(await api.put(base, payload));
    },
    async uploadAvatar(file) {
      requireBackend(); validateUpload(file);
      if (!file.size) throw new Error('Ảnh đang rỗng. Vui lòng chọn một ảnh khác.');
      const data = new FormData(); data.append('file', file);
      // Let Axios/browser generate Content-Type and its multipart boundary.
      return unwrap(await api.post(`${base}/avatar`, data, { timeout: AVATAR_UPLOAD_TIMEOUT_MS, headers: { 'Content-Type': undefined } }));
    },
    async deleteAvatar() { requireBackend(); return unwrap(await api.delete(`${base}/avatar`)); },
    async saveAddress(addressId, values) {
      requireBackend();
      const payload = Object.fromEntries(['label', 'receiverName', 'receiverPhone', 'province', 'district', 'ward', 'streetAddress'].map((key) => [key, optional(values[key])]));
      payload.isDefault = values.isDefault === true || values.isDefault === 'on';
      return unwrap(await (addressId ? api.put(`${base}/addresses/${addressId}`, payload) : api.post(`${base}/addresses`, payload)));
    },
    async removeAddress(addressId) { requireBackend(); return unwrap(await api.delete(`${base}/addresses/${addressId}`)); },
  };
}
