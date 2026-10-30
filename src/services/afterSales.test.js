import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }, unwrap: (response) => response.data.data }));
vi.mock('./backendGuard', () => ({ requireBackend: vi.fn() }));
import api from './api';
import { feedbackService, returnService, returnWarehouseService, returnExecutionService } from './afterSalesService';
beforeEach(() => { vi.resetAllMocks(); Object.values(api).forEach((method) => method.mockResolvedValue({ data: { data: { content: [], totalPages: 0 } } })); });

it('uses different customer/staff list and assignment endpoints without granting customer identity fields', async () => {
  const customer = feedbackService(), staff = feedbackService(true);
  await customer.list({ page: 0 }); await staff.list({ unassigned: true });
  await staff.assign('f', 'employee-id', 'Bàn giao ca'); await staff.claim('f');
  expect(api.get).toHaveBeenCalledWith('/feedbacks/me', { params: { page: 0 } });
  expect(api.get).toHaveBeenCalledWith('/management/feedbacks', { params: { unassigned: true } });
  expect(api.patch).toHaveBeenCalledWith('/management/feedbacks/f/assignment', { employeeId: 'employee-id', note: 'Bàn giao ca' });
  expect(api.post).toHaveBeenCalledWith('/management/feedbacks/f/claim', undefined, undefined);
});
it('sends message attachments as multipart, uses the saved message ID, and lets the browser set the boundary', async () => {
  await feedbackService(true).upload('f', new Blob(['image'], { type: 'image/png' }), 'message');
  const [url, body, config] = api.post.mock.calls[0];
  expect(url).toBe('/management/feedbacks/f/media'); expect(body.get('messageId')).toBe('message');
  expect(body.get('file')).toBeTruthy(); expect(config.headers['Content-Type']).toBeUndefined();
});
it('keeps return creation idempotent and sends the exact proposal version when accepting', async () => {
  const customer = returnService(), body = { orderId: 'order', items: [{ orderDetailId: 'line', quantity: 1 }] };
  await customer.create(body, 'key'); await customer.action('r', 'accept', { proposalVersion: 4, note: 'Đồng ý' });
  expect(api.post).toHaveBeenCalledWith('/return-requests', body, { headers: { 'Idempotency-Key': 'key' } });
  expect(api.post).toHaveBeenCalledWith('/return-requests/r/accept', { proposalVersion: 4, note: 'Đồng ý' }, undefined);
  expect(() => customer.action('r', 'approve', {})).toThrow('không hợp lệ');
});
it('separates proposal actions from monetary execution endpoints', async () => {
  const staff = returnService(true), body = { expectedProposalVersion: 1, items: [] };
  await staff.preview('r', body); await staff.approve('r', body);
  expect(api.post).toHaveBeenCalledWith('/management/return-requests/r/preview-decision', body, undefined);
  expect(api.post).toHaveBeenCalledWith('/management/return-requests/r/approve', body, undefined);
  expect(() => staff.action('r', 'complete', {})).toThrow('không hợp lệ');
});

it('uses real execution endpoints, keeps payment idempotency and allows enough time for the provider', async () => {
  const body = { proposalVersion: 4, amount: 20000, refundMethod: 'original_payment' };
  await returnExecutionService.refund('r', body, 'stable-refund-key');
  await returnExecutionService.sync('r', 'refund');
  await returnExecutionService.complete('r', { proposalVersion: 4, note: 'Đã thực hiện đủ' }, 'finish-key');
  expect(api.post).toHaveBeenCalledWith('/management/return-requests/r/refunds', body, { headers: { 'Idempotency-Key': 'stable-refund-key' }, timeout: 60000 });
  expect(api.post).toHaveBeenCalledWith('/management/return-requests/r/refunds/refund/sync', undefined, { timeout: 60000 });
  expect(api.post).toHaveBeenCalledWith('/management/return-requests/r/complete', { proposalVersion: 4, note: 'Đã thực hiện đủ' }, { headers: { 'Idempotency-Key': 'finish-key' } });
});
it('keeps customer execution reads separate from staff and replacement shipment mutations', async () => {
  await returnService().execution('r'); await returnService(true).execution('r');
  const body = { proposalVersion: 4, shipment: { status: 'picked_up', note: 'Đã bàn giao' } };
  await returnExecutionService.shipmentStatus('r', 'shipment', body, 'shipment-key');
  expect(api.get).toHaveBeenCalledWith('/return-requests/r/execution', { params: undefined });
  expect(api.get).toHaveBeenCalledWith('/management/return-requests/r/execution', { params: undefined });
  expect(api.post).toHaveBeenCalledWith('/management/return-requests/r/replacement-order/shipments/shipment/status', body, { headers: { 'Idempotency-Key': 'shipment-key' } });
});
it('uses warehouse allocation/version contracts and customer read-only progress endpoints', async () => {
  const body = { expectedVersion: 9, quantity: 1, note: 'Đã đối chiếu' };
  await returnWarehouseService.action('receipt', 'restock', body, 'warehouse-key');
  await returnService().progress('r'); await returnService().receipts('r', { page: 2 });
  expect(api.post).toHaveBeenCalledWith('/management/return-receipts/items/receipt/restock', body, { headers: { 'Idempotency-Key': 'warehouse-key' } });
  expect(api.get).toHaveBeenCalledWith('/return-requests/r/warehouse-progress', { params: undefined });
  expect(api.get).toHaveBeenCalledWith('/return-requests/r/receipts', { params: { page: 2 } });
  expect(() => returnWarehouseService.action('r', 'refund', {}, 'key')).toThrow('không hợp lệ');
});
