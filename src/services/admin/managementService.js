import api, { unwrap } from '../api';
import { normalizePage, optional, validateUpload } from '@/lib/apiData';
import { requireBackend } from '../backendGuard';

const fields = {
  customers: ['customerId', 'fullName', 'phoneNumber', 'email', 'dateOfBirth', 'membershipStatus', 'registrationDate', 'rewardPoints', 'status', 'accountId'],
  suppliers: ['supplierCode', 'supplierName', 'taxCode', 'contactPerson', 'phoneNumber', 'email', 'address', 'status'],
  origins: ['originCode', 'originName', 'countryCode', 'country', 'region', 'producerName', 'address', 'description', 'supplierId', 'status'],
  certifications: ['certificateName', 'certificateNumber', 'issuingOrganization', 'issuedAt', 'expiresAt'],
};
export function managementPayload(module, values) {
  return Object.fromEntries(fields[module].map((key) => [key, key === 'rewardPoints' ? Number(values[key] ?? 0) : optional(values[key])]));
}
export function createManagementService(module) {
  const base = `/${module}`;
  return {
    async list(params) { requireBackend(); return normalizePage(unwrap(await api.get(base, { params }))); },
    async get(id) { requireBackend(); return unwrap(await api.get(`${base}/${id}`)); },
    async save(id, values) { requireBackend(); const payload = managementPayload(module, values); return unwrap(await (id ? api.put(`${base}/${id}`, payload) : api.post(base, payload))); },
    async archive(id) { requireBackend(); return unwrap(await api.delete(`${base}/${id}`)); },
    async products(id, params) { requireBackend(); return normalizePage(unwrap(await api.get(`${base}/${id}/products`, { params }))); },
  };
}
export const customerService = createManagementService('customers');
export const supplierService = createManagementService('suppliers');
export const originService = createManagementService('origins');
export const certificationService = {
  ...createManagementService('certifications'),
  async review(id, values) { requireBackend(); return unwrap(await api.patch(`/certifications/${id}/status`, { status: values.status, note: optional(values.note) })); },
  async restore(id) { requireBackend(); return unwrap(await api.post(`/certifications/${id}/restore`)); },
  async upload(id, file) { requireBackend(); validateUpload(file, true); const data = new FormData(); data.append('file', file); return unwrap(await api.post(`/certifications/${id}/document`, data, { headers: { 'Content-Type': undefined } })); },
  async deleteDocument(id) { requireBackend(); return unwrap(await api.delete(`/certifications/${id}/document`)); },
};
export const traceabilityService = {
  async list(params) { requireBackend(); return normalizePage(unwrap(await api.get('/products/traceability-options', { params }))); },
  async get(id) { requireBackend(); return unwrap(await api.get(`/products/${id}/traceability`)); },
  async setOrigin(id, originId) { requireBackend(); return unwrap(await api.put(`/products/${id}/origin`, { originId })); },
  async removeOrigin(id) { requireBackend(); return unwrap(await api.delete(`/products/${id}/origin`)); },
  async attach(id, certificateId) { requireBackend(); return unwrap(await api.put(`/products/${id}/certifications/${certificateId}`)); },
  async detach(id, certificateId) { requireBackend(); return unwrap(await api.delete(`/products/${id}/certifications/${certificateId}`)); },
};
