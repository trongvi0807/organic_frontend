// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ user: { username: 'admin', fullName: 'Quản trị hiện tại', roles: ['ADMIN'] }, load: vi.fn(), returnGet: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/services/api', () => ({ DEMO_MODE: false }));
vi.mock('@/services/admin/dashboardService', () => ({ dashboardService: { snapshot: state.load, returnRequest: state.returnGet } }));
vi.mock('@/lib/apiData', async (original) => ({ ...await original(), today: () => '2026-10-28' }));
import AdminDashboardPage from './AdminDashboardPage';
import { createDashboardDemo } from '@/constants/demoDashboard';
let root, container;
const sample = () => createDashboardDemo('2026-10-28');
const snapshot = (demo = false) => ({ demo, loadedAt: '2026-10-28T08:00:00+07:00', sources: Object.fromEntries(Object.entries(sample()).map(([key, data]) => [key, { status: 'ready', data, label: key }])) });
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true; vi.clearAllMocks();
  state.user = { username: 'admin', fullName: 'Quản trị hiện tại', roles: ['ADMIN'] };
  state.load.mockImplementation((_user, { demo }) => Promise.resolve(snapshot(demo)));
  state.returnGet.mockImplementation(async (id) => { const row = sample().returns.find((item) => item.id === id); return { request: row, items: row.items, description: row.description }; });
  vi.stubGlobal('ResizeObserver', class { constructor(callback) { this.callback = callback; } observe(target) { this.callback([{ target, contentRect: { width: 640, height: 290 } }]); } unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    const label = this.tagName === 'SPAN', legend = this.classList.contains('recharts-legend-wrapper');
    const width = label ? (this.textContent?.length || 1) * 6 : 640, height = label ? 12 : legend ? 24 : 290;
    return { width, height, top: 0, left: 0, bottom: height, right: width, x: 0, y: 0, toJSON() {} };
  });
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const render = async () => { await act(async () => root.render(h(MemoryRouter, {}, h(AdminDashboardPage)))); };
const click = async (element) => { expect(element).toBeTruthy(); await act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true }))); };
const button = (text, parent = container) => [...parent.querySelectorAll('button')].find((item) => item.textContent.trim() === text);

it('renders actual Recharts SVGs, four KPI cards, business codes and operational sections', async () => {
  await render();
  expect(container.querySelector('.recharts-line-curve')).toBeTruthy(); expect(container.querySelector('.recharts-pie')).toBeTruthy();
  expect(container.textContent).toContain('Doanh thu đã thanh toán'); expect(container.textContent).toContain('Giao hàng thành công'); expect(container.textContent).toContain('Kho hàng cần chú ý'); expect(container.textContent).toContain('Hoạt động vận hành');
  expect(container.textContent).toContain('OM261028'); expect(container.textContent).toContain('PO-261028-1'); expect(container.textContent).not.toContain('demo-sale-'); expect(container.textContent).not.toContain('demo-employee-');
});
it('changes the reporting period and daily/weekly data without inventing another API', async () => {
  await render(); await click(button('30 ngày')); await click(container.querySelector('[aria-label="Xem bảng số liệu doanh thu"]'));
  const dataTable = [...container.querySelectorAll('table')].find((table) => table.caption?.textContent.includes('Doanh thu đã thanh toán'));
  expect(dataTable.querySelectorAll('tbody tr')).toHaveLength(30); expect(container.textContent).toContain('29-09-2026 – 28-10-2026');
  await click(button('Theo tuần')); expect(dataTable.querySelectorAll('tbody tr')).toHaveLength(5); expect(state.load).toHaveBeenCalledTimes(1);
});
it('opens a purchase snapshot using its business code with a working deep link to approvals', async () => {
  await render(); await click(button('PO-261028-1'));
  const dialog = document.querySelector('[role="dialog"]'); expect(dialog.textContent).toContain('Người lập'); expect(dialog.textContent).toContain('Nguyễn Minh Quân'); expect(dialog.textContent).not.toContain('demo-po-0');
  expect(dialog.querySelector('a').getAttribute('href')).toBe('/admin/order-approvals?documentId=demo-po-0'); expect(state.returnGet).not.toHaveBeenCalled();
});
it('reads full return details only when selected and never pretends a request is already refunded', async () => {
  await render(); await click([...container.querySelectorAll('button')].find((item) => item.textContent.startsWith('Đổi trả')));
  await click([...container.querySelectorAll('button')].find((item) => item.textContent.includes('DT-261028-1')));
  expect(state.returnGet).toHaveBeenCalledWith('demo-return-0');
  const dialog = document.querySelector('[role="dialog"]'); expect(dialog.textContent).toContain('Sản phẩm bị dập'); expect(dialog.textContent).toContain('chưa đồng nghĩa đã hoàn tiền'); expect(dialog.textContent).not.toContain('demo-return-0');
});
it('labels the sample explicitly and does not request live return details in sample mode', async () => {
  await render(); await click(button('Xem bản mẫu'));
  expect(container.textContent).toContain('Đây là dữ liệu mô phỏng'); await click([...container.querySelectorAll('button')].find((item) => item.textContent.startsWith('Đổi trả')));
  await click([...container.querySelectorAll('button')].find((item) => item.textContent.includes('DT-261028-1')));
  const dialog = document.querySelector('[role="dialog"]'); expect(dialog.textContent).toContain('Dữ liệu mô phỏng'); expect(dialog.querySelector('a')).toBeNull(); expect(state.returnGet).not.toHaveBeenCalled();
});
it('preserves sales charts when stock fails and shows missing stock data instead of zero warnings', async () => {
  const data = snapshot(); data.sources.stock = { status: 'error', data: [], label: 'Mức tồn kho' }; state.load.mockResolvedValue(data);
  await render(); expect(container.textContent).toContain('Dữ liệu chưa đầy đủ'); expect(container.querySelector('.recharts-line-curve')).toBeTruthy();
  const warningCard = [...container.querySelectorAll('[data-slot="card"]')].find((card) => card.textContent.includes('Cảnh báo kho & hạn dùng'));
  expect(warningCard.textContent).toContain('—'); expect(container.textContent).toContain('Chưa tải được dữ liệu');
});
