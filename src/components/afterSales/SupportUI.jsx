import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/field';
import { adminDate } from '@/lib/adminFormat';
import { errorMessage } from '@/lib/utils';
import { historyActions, returnStates, supportHistoryText, validateSupportFiles } from '@/lib/afterSales';
import '@/styles/customer-orders.css';

export const supportPanel = 'min-w-0 rounded-2xl border border-emerald-900/10 bg-white p-5 sm:p-6';
export function SupportBadge({ value, labels }) {
  const color = ['resolved', 'completed', 'passed', 'succeeded', 'delivered'].includes(value) ? 'bg-emerald-50 text-emerald-800' : ['rejected', 'cancelled', 'failed'].includes(value) ? 'bg-red-50 text-red-800' : value === 'closed' ? 'bg-stone-100 text-stone-600' : 'bg-amber-50 text-amber-900';
  return <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${color}`}>{labels[value] || 'Chờ cập nhật'}</span>;
}
export function SupportError({ children }) { return children ? <p className="rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-800" role="alert">{children}</p> : null; }
export function SupportNoteDialog({ title, description, children, maxLength = 5000, onSubmit, onClose, submitLabel = 'Xác nhận' }) {
  const [note, setNote] = useState(''), [touched, setTouched] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false);
  async function submit(e) {
    e.preventDefault(); setTouched(true); if (!note.trim() || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await onSubmit(note.trim()); onClose(); }
    catch (err) { setError(errorMessage(err)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Modal open title={title} description={description} onOpenChange={(open) => { if (!open && !lock.current) onClose(); }}><form onSubmit={submit} noValidate className="space-y-4"><fieldset disabled={busy} className="space-y-4">{children}<Field label="Nội dung xác nhận *" error={touched && !note.trim() ? 'Vui lòng nhập nội dung xác nhận.' : ''}><Textarea value={note} maxLength={maxLength} onChange={(e) => { setNote(e.target.value); setTouched(true); }} required /></Field></fieldset><SupportError>{error}</SupportError><div className="flex justify-end gap-3"><Button variant="outline" onClick={onClose} disabled={busy}>Đóng</Button><Button type="submit" disabled={busy}>{busy ? 'Đang lưu…' : submitLabel}</Button></div></form></Modal>;
}
export function EvidenceList({ items = [], onRemove, disabled }) {
  const [error, setError] = useState(''), [deleting, setDeleting] = useState('');
  async function remove(item) {
    if (deleting || disabled) return;
    setDeleting(item.id); setError('');
    try { await onRemove(item); toast.success('Đã xóa tệp.', { position: 'top-left' }); } catch (err) { setError(errorMessage(err)); }
    finally { setDeleting(''); }
  }
  return <><div className="flex flex-wrap gap-3">{items.map((item) => <div key={item.id} className="w-36 overflow-hidden rounded-xl border border-line bg-white">{item.mediaType === 'video' ? <video src={item.mediaUrl} poster={item.thumbnailUrl || undefined} controls preload="metadata" className="h-28 w-full object-contain" /> : <a href={item.mediaUrl} target="_blank" rel="noreferrer"><img src={item.thumbnailUrl || item.mediaUrl} alt={item.originalFilename || 'Ảnh bằng chứng'} loading="lazy" className="h-28 w-full object-cover" /></a>}<p className="truncate p-2 text-[11px] text-stone-500" title={item.originalFilename}>{item.originalFilename || 'Tệp đính kèm'}</p>{item.canDelete && onRemove && <button type="button" disabled={disabled || !!deleting} className="w-full border-t border-line p-2 text-xs text-red-700" onClick={() => remove(item)}>{deleting === item.id ? 'Đang xóa…' : 'Xóa tệp'}</button>}</div>)}</div><SupportError>{error}</SupportError></>;
}
export function SupportFiles({ files, onChange, disabled }) {
  const [error, setError] = useState('');
  return <div className="space-y-2"><label className="block text-sm font-medium">Ảnh / video đính kèm<input type="file" multiple disabled={disabled} accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className="!mt-2 block w-full text-xs" onChange={(e) => {
    const next = [...e.target.files], issue = validateSupportFiles(next); setError(issue);
    if (!issue) onChange(next); e.target.value = '';
  }} /></label><p className="text-xs leading-6 text-stone-500">Tối đa 5 ảnh (5 MB/ảnh) và 1 video (50 MB).</p>{files.map((file, i) => <div className="flex items-center justify-between gap-2 text-xs" key={`${file.name}-${i}`}><span className="truncate">{file.name}</span><button type="button" disabled={disabled} className="shrink-0 text-red-700" onClick={() => onChange(files.filter((_, index) => i !== index))}>Bỏ tệp</button></div>)}<SupportError>{error}</SupportError></div>;
}
export function SupportHistory({ items = [] }) {
  return <ol className="space-y-4">{items.map((item) => <li key={item.id} className="border-l-2 border-emerald-100 pl-4"><div className="flex flex-wrap justify-between gap-2 text-sm"><strong>{historyActions[item.action] || (item.newStatus ? returnStates[item.newStatus] : '') || 'Cập nhật hồ sơ'}</strong><time className="text-xs text-stone-500">{adminDate(item.createdAt, true)}</time></div><p className="!mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-stone-600">{supportHistoryText(item.note)}</p>{item.newStatus && <p className="!mt-1 text-xs text-stone-400">{returnStates[item.newStatus] || 'Đã ghi nhận'}</p>}</li>)}</ol>;
}
