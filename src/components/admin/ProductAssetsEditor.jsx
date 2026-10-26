import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { productService } from '@/services/admin/productService';
import { useResource } from '@/hooks/useResource';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { ResourceState } from '@/components/common/ResourceState';
import { currency, errorMessage } from '@/lib/utils';
import { safeMediaUrl } from '@/lib/productDetail';

export function ProductAssetsEditor({ productId, onClose, onChanged }) {
  const detail = useResource(() => productService.get(productId), [productId]);
  const [tab, setTab] = useState('variants'), [draft, setDraft] = useState(null), [remove, setRemove] = useState(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function run(task) {
    if (busy) return;
    setBusy(true); setError('');
    try { await task(); setDraft(null); setRemove(null); detail.reload(); onChanged(); toast.success('Đã cập nhật sản phẩm.'); }
    catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  }
  function submit(event) {
    event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget));
    return run(() => tab === 'variants' ? productService.saveVariant(productId, draft.id, values) : productService.saveImage(productId, draft.id, values));
  }
  const variants = tab === 'variants', rows = detail.data?.[tab] || [];
  return <Modal open onOpenChange={(open) => { if (!open && !busy) onClose(); }} title={`Quy cách & ảnh · ${detail.data?.productName || 'Sản phẩm'}`} description="Giá nằm trong từng quy cách. Tồn kho được cập nhật qua phiếu nhập." className="!max-w-[900px]">
    <div className="!mb-5 flex flex-wrap gap-3">{[['variants','Quy cách & giá'],['images','Ảnh sản phẩm']].map(([key,label]) => <Button key={key} variant={tab === key ? 'default' : 'outline'} disabled={busy} onClick={() => { setTab(key); setDraft(null); setRemove(null); setError(''); }}>{label}</Button>)}</div>
    <ResourceState loading={detail.loading} error={detail.error} onRetry={detail.reload} />
    {detail.data && !detail.loading && !detail.error && <><ul className="divide-y divide-line">{rows.map((row) => <li key={row.id} className="flex items-center justify-between gap-3 py-4"><div className="min-w-0">{variants ? <><strong className="text-sm">{row.variantName}</strong><p className="!mt-1 text-xs text-stone-500">{row.sku} · {row.netQuantity} {row.unitId} · {row.status === 'active' ? 'Đang bán' : 'Tạm ẩn'}</p><p className="!mt-2 text-sm text-primary">{currency(row.sellingPrice)} {row.compareAtPrice > row.sellingPrice && <del className="!ml-2 text-xs text-stone-400">{currency(row.compareAtPrice)}</del>}</p></> : <div className="flex items-center gap-3">{safeMediaUrl(row.imageUrl) && <img className="size-16 rounded-lg object-cover" src={safeMediaUrl(row.imageUrl)} alt={row.altText || ''} />}<div><p className="break-all text-xs">{row.altText || 'Ảnh sản phẩm'}</p><p className="!mt-1 text-xs text-stone-500">Thứ tự {row.sortOrder}{row.isPrimary && ' · Ảnh chính'}</p></div></div>}</div><div className="flex shrink-0 gap-1"><Button size="sm" variant="ghost" disabled={busy} onClick={() => { setDraft(row); setRemove(null); setError(''); }} aria-label={`Sửa ${variants ? row.variantName : row.altText || 'ảnh'}`}><Pencil size={15} /></Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => { setRemove(row); setError(''); }} aria-label={`Xóa ${variants ? row.variantName : row.altText || 'ảnh'}`}><Trash2 size={15} /></Button></div></li>)}</ul>{!rows.length && <p className="py-5 text-sm text-stone-500">Chưa có {variants ? 'quy cách' : 'ảnh'}.</p>}
    {!draft && <Button variant="outline" disabled={busy} onClick={() => { setDraft({}); setError(''); }}><Plus size={16} />Thêm {variants ? 'quy cách' : 'URL ảnh'}</Button>}
    {draft && <form key={`${tab}:${draft.id || 'new'}`} onSubmit={submit} className="!mt-5 rounded-2xl border border-line bg-cream p-5"><fieldset disabled={busy} className="min-w-0 space-y-4"><h3 className="font-semibold">{draft.id ? 'Chỉnh sửa' : 'Thêm'} {variants ? 'quy cách' : 'ảnh sản phẩm'}</h3>{variants ? <><div className="grid gap-4 sm:grid-cols-2"><Field label="SKU *"><Input name="sku" defaultValue={draft.sku} required maxLength={80} pattern="[A-Za-z0-9][A-Za-z0-9_-]*" /></Field><Field label="Tên quy cách *"><Input name="variantName" defaultValue={draft.variantName} required maxLength={150} placeholder="Gói 500g" /></Field><Field label="Khối lượng / dung tích *"><Input name="netQuantity" type="number" min="0.001" step="0.001" required defaultValue={draft.netQuantity} /></Field><Field label="Mã đơn vị *" hint="Dùng đúng mã đơn vị đang có trong dữ liệu backend."><Input name="unitId" required maxLength={20} defaultValue={draft.unitId} placeholder="g, kg, ml…" /></Field><Field label="Giá bán (VND) *"><Input name="sellingPrice" type="number" min="0.01" step="0.01" required defaultValue={draft.sellingPrice} /></Field><Field label="Giá gốc (tùy chọn)"><Input name="compareAtPrice" type="number" min="0.01" step="0.01" defaultValue={draft.compareAtPrice} /></Field><Field label="Barcode"><Input name="barcode" maxLength={100} defaultValue={draft.barcode} /></Field><Field label="Ngưỡng cảnh báo tồn"><Input name="reorderLevel" type="number" min="0" step="1" defaultValue={draft.reorderLevel ?? 0} /></Field></div><Field label="Trạng thái"><Select name="status" defaultValue={draft.status || 'active'}><option value="active">Đang bán</option><option value="inactive">Tạm ẩn</option></Select></Field></> : <><Field label="URL ảnh *" hint="API nhận URL ảnh, không phải upload file."><Input name="imageUrl" required maxLength={1000} defaultValue={draft.imageUrl} /></Field><Field label="Mô tả ảnh"><Input name="altText" maxLength={255} defaultValue={draft.altText} /></Field><Field label="Thứ tự *"><Input name="sortOrder" type="number" required min="0" step="1" defaultValue={draft.sortOrder ?? 0} /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isPrimary" defaultChecked={draft.isPrimary} />Dùng làm ảnh chính</label></>}<div className="flex flex-wrap justify-end gap-3"><Button variant="outline" onClick={() => setDraft(null)}>Hủy chỉnh sửa</Button><Button type="submit">{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</Button></div></fieldset></form>}
    {remove && <div role="alertdialog" aria-label="Xác nhận xóa" className="!mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm">Xóa {variants ? remove.variantName : 'ảnh này'}? Backend sẽ kiểm tra dữ liệu liên quan trước khi xóa.</p><div className="!mt-3 flex gap-3"><Button variant="outline" disabled={busy} onClick={() => setRemove(null)}>Giữ lại</Button><Button disabled={busy} onClick={() => run(() => variants ? productService.removeVariant(productId, remove.id) : productService.removeImage(productId, remove.id))}>Xác nhận xóa</Button></div></div>}</>}
    {error && <p role="alert" className="form-error !mt-4">{error}</p>}
  </Modal>;
}
