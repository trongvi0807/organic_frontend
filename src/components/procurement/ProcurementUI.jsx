import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { RefreshCw, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Select, Textarea } from '@/components/ui/field';
import { AdminForm } from '@/components/admin/AdminForm';
import { rejectionNote, rejectionReasons } from '@/lib/adminOperations';
import { Modal } from '@/components/ui/dialog';
import { ResourceState } from '@/components/common/ResourceState';
import { orderStatuses, receiptStatuses } from '@/lib/procurement';

export function Status({ value }) {
  const color = ['approved', 'confirmed', 'received'].includes(value) ? 'bg-[#e7f1e7] text-[#315c3f]' : ['pending_approval', 'partially_received'].includes(value) ? 'bg-[#faf0d9] text-[#89651e]' : ['rejected', 'cancelled'].includes(value) ? 'bg-[#faeae7] text-[#97504a]' : 'bg-stone-100 text-stone-600';
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${color}`}>{orderStatuses[value] || receiptStatuses[value] || value}</span>;
}
export function WorkflowHeader({ title, description, children }) {
  return <div className="admin-page-heading"><div><span className="eyebrow">VẬN HÀNH KHO · MỘC ORGANIC</span><h1>{title}<span className="heading-dot">.</span></h1><p>{description}</p></div>{children}</div>;
}
export function Refresh({ resource }) { return <Button size="sm" variant="outline" disabled={resource.loading} onClick={resource.reload}><RefreshCw size={14} />Tải lại</Button>; }
export function Notice({ children }) { return <div className="!mb-5 flex items-start gap-3 rounded-2xl bg-[#eff3ea] p-4 text-sm leading-6 text-[#48604a]"><PackageCheck size={19} className="mt-0.5 shrink-0" /><div>{children}</div></div>; }
export function DetailState({ resource, children }) { return <><ResourceState loading={resource.loading} error={resource.error} onRetry={resource.reload} />{!resource.loading && !resource.error && resource.data && children}</>; }
export function DecisionDialog({ action, busy, error, note, setNote, onClose, onConfirm }) {
  const required = ['reject', 'cancel'].includes(action?.type);
  const [reason, setReason] = useState(''), [validation, setValidation] = useState('');
  useEffect(() => { setReason(''); setValidation(''); }, [action]);
  return <Modal open={!!action} onOpenChange={(open) => { if (!open && !busy) onClose(); }} title={action?.title || 'Xác nhận'} description={action?.description}><AdminForm onSubmit={(event) => { event.preventDefault(); try { onConfirm(action?.type === 'reject' ? rejectionNote(reason, note) : ['approve', 'submit'].includes(action?.type) ? '' : note); } catch (e) { setValidation(e.message); } }}>
    {action?.type === 'reject' && <Field label="Lý do từ chối *"><Select required disabled={busy} value={reason} onChange={(e) => { setReason(e.target.value); setValidation(''); setNote(''); }}><option value="">Chọn lý do từ chối</option>{rejectionReasons.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</Select></Field>}
    {!['approve', 'submit'].includes(action?.type) && (action?.type !== 'reject' || reason === 'other') && <Field label={required ? 'Lý do cụ thể *' : 'Ghi chú (không bắt buộc)'}><Textarea value={note} onChange={(e) => setNote(e.target.value)} required={required} maxLength={4900} disabled={busy} /></Field>}
    {(validation || error) && <p role="alert" className="form-error">{validation || error}</p>}<div className="form-actions"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Quay lại</Button><Button type="submit" disabled={busy}>{busy ? 'Đang xử lý…' : 'Xác nhận'}</Button></div></AdminForm></Modal>;
}
export function DocumentMeta({ entries }) { return <dl className="!mb-5 grid grid-cols-1 gap-4 rounded-xl bg-[#f7f8f4] p-5 text-sm sm:grid-cols-2">{entries.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-stone-500">{label}</dt><dd className="!mt-1 break-words font-medium">{value || '—'}</dd></div>)}</dl>; }
export function InventoryLink({ variantId, children = 'Xem tồn kho' }) { return <Link className="text-sm underline underline-offset-4" to={`/admin/inventory${variantId ? `?variantId=${encodeURIComponent(variantId)}` : ''}`}>{children}</Link>; }

