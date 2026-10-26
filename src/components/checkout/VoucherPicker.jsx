import { useEffect, useState } from 'react';
import { Check, ChevronRight, TicketPercent, X } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { purchaseButton } from './PurchaseFrame';
import { currency, errorMessage } from '@/lib/utils';

export function VoucherPicker({ code, onApply, promotions = [], disabled, hint, loading }) {
  const [open, setOpen] = useState(false), [draft, setDraft] = useState(code || ''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { setDraft(code || ''); }, [code]);
  async function apply(value) {
    setBusy(true); setError('');
    try { await onApply(value.trim().toUpperCase()); setOpen(false); } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  }
  return <><button type="button" disabled={disabled} onClick={() => { setError(''); setDraft(code || ''); setOpen(true); }} className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-dashed border-[#b2c3a1] bg-[#f7faf3] px-4 py-3 text-left"><TicketPercent size={20} className="shrink-0 text-[#6f8953]" /><span className="min-w-0 flex-1 text-xs"><strong className="block text-primary">{code ? `Mã đã chọn: ${code}` : 'Áp dụng mã giảm giá'}</strong>{hint && <small className="!mt-1 block font-normal leading-5 text-stone-500">{hint}</small>}</span><span className="flex items-center text-xs font-semibold text-primary">Chọn<ChevronRight size={15} /></span></button>
    <Modal open={open} onOpenChange={setOpen} title="Ưu đãi dành cho bạn" description="Chọn mã hoặc nhập mã giảm giá. Điều kiện được kiểm tra với đơn hàng."><div className="space-y-4"><div className="flex gap-2"><input aria-label="Mã giảm giá" autoComplete="off" maxLength={50} placeholder="Nhập mã giảm giá" value={draft} onChange={(e) => setDraft(e.target.value.toUpperCase())} className="input min-w-0 flex-1 !text-sm" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (draft.trim()) apply(draft); } }} /><button type="button" disabled={busy || !draft.trim()} className="rounded-xl bg-primary px-4 !text-xs !font-semibold !text-white" onClick={() => apply(draft)}>Áp dụng</button></div>{error && <p role="alert" className="text-xs leading-6 text-red-700">{error}</p>}{code && <button type="button" disabled={busy} onClick={() => apply('')} className="flex items-center gap-2 text-xs text-stone-500"><X size={14} />Gỡ mã {code}</button>}
      <div className="max-h-72 space-y-3 overflow-y-auto">{loading ? <p className="text-xs text-stone-500">Đang tải ưu đãi…</p> : promotions.length ? promotions.map((p) => <button key={p.id || p.promotionCode} type="button" disabled={busy} onClick={() => setDraft(p.promotionCode)} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left ${draft === p.promotionCode ? 'border-primary bg-sage' : 'border-line'}`}><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sage text-primary"><TicketPercent size={22} /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{p.promotionCode}</strong><span className="!mt-1 block text-xs leading-5 text-stone-500">{p.name || p.description}{p.minOrderValue > 0 && ` · Đơn từ ${currency(p.minOrderValue)}`}</span></span>{draft === p.promotionCode && <Check size={17} />}</button>) : <p className="rounded-xl bg-cream p-4 text-xs leading-6 text-stone-500">Chưa có mã gợi ý. Bạn vẫn có thể nhập mã đang có ở phía trên.</p>}</div>
      <button type="button" className={purchaseButton} disabled={busy || !draft.trim()} onClick={() => apply(draft)}>{busy ? 'Đang kiểm tra…' : 'Sử dụng mã này'}</button></div></Modal></>;
}
