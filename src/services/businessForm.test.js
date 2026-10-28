import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./api', () => ({ default: { get: vi.fn() }, DEMO_MODE: false, unwrap: (response) => response.data.data }));
vi.mock('./admin/procurementService', () => ({ purchaseOrderService: { list: vi.fn(), get: vi.fn() }, goodsReceiptService: { list: vi.fn(), get: vi.fn() }, inventoryService: { batches: vi.fn(), batch: vi.fn() } }));
vi.mock('./admin/orderService', () => ({ orderService: { list: vi.fn(), get: vi.fn() } }));
vi.mock('./admin/purchasePrintService', () => ({ loadPurchasePrintContext: vi.fn(), loadPhysicalStock: vi.fn() }));
vi.mock('./admin/managementService', () => ({ traceabilityService: { get: vi.fn() } }));
import api from './api';
import { orderService } from './admin/orderService';
import { canReadFormSource, listFormSources, loadFormData } from './admin/businessFormService';
import { businessForm } from '@/constants/businessForms';
beforeEach(() => vi.clearAllMocks());
const response = (data) => ({ data: { data } });
it('loads feedback list/detail through the actual authenticated management endpoints', async () => {
  api.get.mockResolvedValueOnce(response({ content: [{ id: 'f', feedbackCode: 'FB-1', subject: 'Hỗ trợ' }], totalPages: 1 })).mockResolvedValueOnce(response({ feedback: { feedbackCode: 'FB-1' }, content: 'Hỗ trợ' }));
  expect(await listFormSources('feedback')).toEqual([{ value: 'f', label: 'FB-1 · Hỗ trợ' }]); expect((await loadFormData(businessForm('customer_feedback'), 'f')).data.documentNumber).toBe('FB-1');
  expect(api.get.mock.calls.map(([path]) => path)).toEqual(['/management/feedbacks', '/management/feedbacks/f']);
});
it('loads completed and pending return receipt requests and pages through actual receipt items', async () => {
  api.get.mockResolvedValueOnce(response({ content: [{ requestId: 'request-1', requestCode: 'RT-1', orderCode: 'DH-1' }], totalPages: 1 })).mockResolvedValueOnce(response({ request: { totals: { receivedQuantity: 2 } }, items: [] })).mockResolvedValueOnce(response({ content: [{ id: 'r1', receivedQuantity: 1 }], totalPages: 2 })).mockResolvedValueOnce(response({ content: [{ id: 'r2', receivedQuantity: 1 }], totalPages: 2 }));
  expect((await listFormSources('return_receipt'))[0].value).toBe('request-1'); expect(api.get.mock.calls[0][1].params.pendingOnly).toBe(false);
  const result = await loadFormData(businessForm('return_inspection'), 'request-1'); expect(result.data.items).toHaveLength(2); expect(api.get.mock.calls[3][1].params.page).toBe(1);
});
it('never silently selects the newest shipment if an order has several shipments', async () => {
  orderService.get.mockResolvedValue({ shipments: [{ id: 's1', driverName: 'Người 1' }, { id: 's2', driverName: 'Người 2' }], pricing: {} });
  expect((await loadFormData(businessForm('delivery_note'), 'order')).data.driverName).toBeUndefined(); expect((await loadFormData(businessForm('delivery_note'), 'order', 's1')).data.driverName).toBe('Người 1');
});
it('maps warehouse/sales source permissions without granting admin-only source access to other roles', () => {
  expect(canReadFormSource({ roles: ['WAREHOUSE_STAFF'] }, 'feedback')).toBe(false); expect(canReadFormSource({ roles: ['SALES_STAFF'] }, 'batch')).toBe(false); expect(canReadFormSource({ roles: ['ADMIN'] }, 'return')).toBe(true); expect(canReadFormSource({ roles: ['WAREHOUSE_STAFF'] }, 'return_receipt')).toBe(true);
});
