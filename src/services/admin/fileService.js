import api, { getSession, unwrap } from '../api';
import { requireBackend } from '../backendGuard';

export const importPaths = {
  products: '/admin/products',
  purchase_orders: '/purchase-orders',
  goods_receipts: '/goods-receipts',
};
const base = (kind) => {
  if (!importPaths[kind]) throw new Error('Loại nhập Excel không hợp lệ.');
  return importPaths[kind];
};
export function validateImportFile(file) {
  if (!file || !/\.xlsx$/i.test(file.name)) throw new Error('Vui lòng chọn tệp Excel .xlsx.');
  if (!file.size) throw new Error('Tệp Excel đang trống.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Tệp Excel không được vượt quá 5 MB.');
}
export const excelImportService = {
  async preview(kind, file, context = {}) {
    requireBackend(); validateImportFile(file);
    const form = new FormData(); form.append('file', file); form.append('context', JSON.stringify(context));
    return unwrap(await api.post(`${base(kind)}/import/preview`, form, { headers: { 'Content-Type': undefined }, timeout: 60000 }));
  },
  async execute(kind, file, fileSha256, key, context = {}, contextSha256) {
    requireBackend(); validateImportFile(file);
    if (!/^[a-f0-9]{64}$/.test(fileSha256 || '') || !key) throw new Error('Hãy kiểm tra file trước khi xác nhận nhập.');
    const form = new FormData(); form.append('file', file); form.append('fileSha256', fileSha256);
    form.append('context', JSON.stringify(context));
    if (contextSha256) form.append('contextSha256', contextSha256);
    return unwrap(await api.post(`${base(kind)}/import`, form, { headers: { 'Content-Type': undefined, 'Idempotency-Key': key }, timeout: 120000 }));
  },
  template(kind, selection = {}) {
    const context = typeof selection === 'string' ? { purchaseOrderId: selection } : selection;
    if (kind === 'goods_receipts' && !context.purchaseOrderId) throw new Error('Chọn đơn mua đã duyệt trước khi tải mẫu phiếu nhập.');
    if (kind === 'purchase_orders' && !context.supplierId) throw new Error('Chọn nhà cung cấp trước khi tải mẫu đơn mua.');
    return downloadFile(`${base(kind)}/import-template`, `${kind}-template.xlsx`, {
      templateVersion: 'v2', ...(kind === 'goods_receipts' ? { purchaseOrderId: context.purchaseOrderId } : {}),
      ...(kind === 'purchase_orders' ? { supplierId: context.supplierId } : {}),
    });
  },
};

// Persist only the retry key/hash, scoped to the account, never the uploaded file or token.
const attemptSlot = (kind, sha) => `moc.import:${getSession()?.user?.id || getSession()?.user?.username || getSession()?.sessionId || 'session'}:${kind}:${sha}`;
export function importAttempt(kind, sha, value) {
  try {
    const slot = attemptSlot(kind, sha);
    if (value === null) sessionStorage.removeItem(slot);
    else if (value) sessionStorage.setItem(slot, JSON.stringify(value));
    else return JSON.parse(sessionStorage.getItem(slot)) || null;
  } catch { /* The in-memory key still supports retry when storage is unavailable. */ }
  return null;
}

export async function downloadFile(path, fallbackName, params) {
  requireBackend();
  let response;
  try { response = await api.get(path, { params, responseType: 'blob', timeout: 60000 }); }
  catch (error) {
    // Axios also returns error JSON as a Blob for these requests.
    if (typeof error.response?.data?.text === 'function') {
      try { error.response.data = JSON.parse(await error.response.data.text()); } catch { /* Keep HTTP status for the normal error mapper. */ }
    }
    throw error;
  }
  const disposition = response.headers?.['content-disposition'] || '';
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  let filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || fallbackName;
  if (encoded) { try { filename = decodeURIComponent(encoded); } catch { /* Use fallback. */ } }
  filename = (filename || fallbackName).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export const documentExportService = {
  purchase: (id) => downloadFile(`/purchase-orders/${encodeURIComponent(id)}/pdf`, 'don-mua.pdf'),
  receipt: (id) => downloadFile(`/goods-receipts/${encodeURIComponent(id)}/pdf`, 'phieu-nhap.pdf'),
  customerSale: (id) => downloadFile(`/orders/${encodeURIComponent(id)}/invoice`, 'phieu-ban-hang.pdf'),
  managementSale: (id) => downloadFile(`/management/orders/${encodeURIComponent(id)}/invoice`, 'phieu-ban-hang.pdf'),
};
