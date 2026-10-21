import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('./api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }, publicApi: { get: vi.fn() }, DEMO_MODE: false, unwrap: (response) => response.data.data }));
import api, { publicApi } from './api';
import { managementPayload, customerService, supplierService, certificationService, traceabilityService } from './admin/managementService';
import { createProfileService } from './client/profileService';
import { homeService } from './client/homeService';
import { homeAdminService } from './admin/homeAdminService';
const response = (data) => ({ data: { data } });
beforeEach(() => { vi.clearAllMocks(); api.post.mockResolvedValue(response({})); api.put.mockResolvedValue(response({})); api.patch.mockResolvedValue(response({})); api.delete.mockResolvedValue(response({})); });

describe('Management request contracts', () => {
  it('sends search/status/page unchanged and reads content pagination', async () => {
    api.get.mockResolvedValue(response({ content: [{ id: 'c' }], totalElements: 1, totalPages: 1 }));
    const params = { search: 'An', status: 'ACTIVE', page: 0, size: 8 };
    expect((await customerService.list(params)).items).toEqual([{ id: 'c' }]);
    expect(api.get).toHaveBeenCalledWith('/customers', { params });
  });
  it('preserves account linkage on a full customer edit', async () => {
    await customerService.save('c', { customerId: 'KH1', fullName: ' An ', phoneNumber: '0901234567', email: '', dateOfBirth: '', membershipStatus: 'REGULAR', registrationDate: '2026-10-20', rewardPoints: '0', status: 'ACTIVE', accountId: 'account-id' });
    expect(api.put).toHaveBeenCalledWith('/customers/c', expect.objectContaining({ accountId: 'account-id', fullName: 'An', rewardPoints: 0, email: null, dateOfBirth: null, status: 'ACTIVE' }));
  });
  it('converts empty optional supplier phones to null', async () => {
    await supplierService.save(null, { supplierCode: 'NCC', supplierName: 'Nông trại', phoneNumber: '', email: '', status: 'active' });
    expect(api.post).toHaveBeenCalledWith('/suppliers', expect.objectContaining({ phoneNumber: null, email: null, status: 'active' }));
  });
  it('never includes approval/document fields in certificate metadata', () => {
    expect(managementPayload('certifications', { certificateName: 'Organic', certificateNumber: 'CERT1', issuingOrganization: 'Org', issuedAt: '2026-01-01', expiresAt: '', status: 'verified', documentUrl: 'evil', reviewedBy: 'other' })).toEqual({ certificateName: 'Organic', certificateNumber: 'CERT1', issuingOrganization: 'Org', issuedAt: '2026-01-01', expiresAt: null });
  });
  it('sends certificate review only via the dedicated endpoint', async () => {
    await certificationService.review('cert', { status: 'revoked', note: ' Sai hồ sơ ', reviewedBy: 'other' });
    expect(api.patch).toHaveBeenCalledWith('/certifications/cert/status', { status: 'revoked', note: 'Sai hồ sơ' });
  });
  it('uploads a document as file FormData without a fixed boundary header', async () => {
    await certificationService.upload('cert', new File(['proof'], 'proof.pdf', { type: 'application/pdf' }));
    const [path, form, config] = api.post.mock.calls[0];
    expect(path).toBe('/certifications/cert/document');
    expect(form.get('file').name).toBe('proof.pdf');
    expect(config.headers['Content-Type']).toBeUndefined();
  });
  it('keeps origin and certificate assignment endpoints distinct', async () => {
    await traceabilityService.setOrigin('p', 'o');
    await traceabilityService.attach('p', 'c');
    await traceabilityService.detach('p', 'c');
    expect(api.put).toHaveBeenCalledWith('/products/p/origin', { originId: 'o' });
    expect(api.put).toHaveBeenCalledWith('/products/p/certifications/c');
    expect(api.delete).toHaveBeenCalledWith('/products/p/certifications/c');
  });
  it('self-service profile cannot alter points, roles, status or account binding', async () => {
    await createProfileService().save({ fullName: 'An', phoneNumber: '0901234567', email: '', dateOfBirth: '', rewardPoints: 9999, accountId: 'other', roles: ['ADMIN'], status: 'ACTIVE' });
    expect(api.put).toHaveBeenCalledWith('/customers/me', { fullName: 'An', phoneNumber: '0901234567', email: null, dateOfBirth: null });
  });
  it('uses the authenticated identity for own addresses and serializes default correctly', async () => {
    await createProfileService().saveAddress(null, { label: 'Nhà', receiverName: 'An', receiverPhone: '0901234567', province: 'HCM', district: 'Q1', ward: 'P1', streetAddress: '1 Đường A', isDefault: 'on', customerId: 'other' });
    expect(api.post).toHaveBeenCalledWith('/customers/me/addresses', expect.objectContaining({ isDefault: true }));
    expect(api.post.mock.calls[0][1]).not.toHaveProperty('customerId');
  });
  it('loads Home through the public transport and adapts product names', async () => {
    publicApi.get.mockResolvedValue(response({ content: { siteName: 'Shop' }, featuredProducts: [{ id: 'p', name: 'Cà rốt', minPrice: 28000, organicVerified: true }] }));
    const home = await homeService.get();
    expect(publicApi.get).toHaveBeenCalledWith('/home');
    expect(api.get).not.toHaveBeenCalled();
    expect(home.featuredProducts[0].productName).toBe('Cà rốt');
    expect(home.content.faqs).toEqual([]);
    expect(home.origins).toEqual([]);
  });
  it('preserves false and zero when updating featured merchandising', async () => {
    await homeAdminService.featured('p', false, '0');
    expect(api.patch).toHaveBeenCalledWith('/admin/home/products/p/featured', { featured: false, featuredOrder: 0 });
  });
});
