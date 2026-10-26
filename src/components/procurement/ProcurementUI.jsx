import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/dialog';
import { ResourceState } from '@/components/common/ResourceState';
import { orderStatuses, receiptStatuses } from '@/lib/procurement';

export function Status({ value }) {
  const color = ['approved', 'confirmed', 'received'].includes(value) ? 'bg-[#e7f1e7] text-[#315c3f]' : value === 'pending_approval' ? 'bg-[#faf0d9] text-[#89651e]' : ['rejected', 'cancelled'].includes(value) ? 'bg-[#faeae7] text-[#97504a]' : 'bg-stone-100 text-stone-600';
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${color}`}>{orderStatuses[value] || receiptStatuses[value] || value}</span>;
}
export function WorkflowHeader({ title, description, step, children }) {
  const steps = [['Đơn mua', 'purchase-orders'], ['Duyệt đơn', 'order-approvals'], ['Phiếu nhập', 'goods-receipts'], ['Duyệt nhập', 'receipt-approvals'], ['Tồn kho / lô', 'inventory'], ['Thông báo', 'notifications']];
  return <><div className="admin-page-heading"><div><span className="eyebrow">VẬN HÀNH KHO · MỘC ORGANIC</span><h1>{title}<span className="heading-dot">.</span></h1><p>{description}</p></div>{children}</div><div className="!mb-6 flex flex-wrap gap-x-5 gap-y-2 rounded-2xl border border-[#e5e8df] bg-white px-5 py-4 text-xs text-stone-500" aria-label="Quy trình nhập hàng">{steps.map(([label], index) => <span key={label} className={`flex items-center gap-2 ${index === step ? 'font-semibold text-[#264e38]' : ''}`}><span className={`flex size-5 items-center justify-center rounded-full ${index === step ? 'bg-[#264e38] text-white' : 'bg-stone-100'}`}>{index + 1}</span>{label}{index < 5 && <ArrowRight size={12} className="opacity-40" />}</span>)}</div></>;
}
export function Refresh({ resource }) { return <Button size="sm" variant="outline" disabled={resource.loading} onClick={resource.reload}><RefreshCw size={14} />Tải lại</Button>; }
export function Notice({ children }) { return <div className="!mb-5 flex items-start gap-3 rounded-2xl bg-[#eff3ea] p-4 text-sm leading-6 text-[#48604a]"><PackageCheck size={19} className="mt-0.5 shrink-0" /><div>{children}</div></div>; }
export function DetailState({ resource, children }) { return <><ResourceState loading={resource.loading} error={resource.error} onRetry={resource.reload} />{!resource.loading && !resource.error && resource.data && children}</>; }
export function DecisionDialog({ action, busy, error, note, setNote, onClose, onConfirm }) {
  const required = ['reject', 'cancel'].includes(action?.type);
  return <Modal open={!!action} onOpenChange={(open) => { if (!open && !busy) onClose(); }} title={action?.title || 'Xác nhận'} description={action?.description}><form onSubmit={(event) => { event.preventDefault(); onConfirm(); }}><Field label={required ? 'Lý do (bắt buộc)' : 'Ghi chú duyệt'}><Textarea value={note} onChange={(e) => setNote(e.target.value)} required={required} maxLength={5000} disabled={busy} /></Field>{error && <p role="alert" className="form-error">{error}</p>}<div className="form-actions"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Quay lại</Button><Button type="submit" disabled={busy}>{busy ? 'Đang xử lý…' : 'Xác nhận'}</Button></div></form></Modal>;
}
export function DocumentMeta({ entries }) { return <dl className="!mb-5 grid grid-cols-1 gap-4 rounded-xl bg-[#f7f8f4] p-5 text-sm sm:grid-cols-2">{entries.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-stone-500">{label}</dt><dd className="!mt-1 break-words font-medium">{value || '—'}</dd></div>)}</dl>; }
export function InventoryLink({ variantId, children = 'Xem tồn kho' }) { return <Link className="text-sm underline underline-offset-4" to={`/admin/inventory${variantId ? `?variantId=${encodeURIComponent(variantId)}` : ''}`}>{children}</Link>; }

