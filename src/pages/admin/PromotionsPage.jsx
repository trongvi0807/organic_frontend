import { adminDate } from '@/lib/adminFormat';
import { AdminDateInput, AdminForm } from '@/components/admin/AdminForm';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useResource } from '@/hooks/useResource';
import { allPages } from '@/lib/apiData';
import { currency, errorMessage } from '@/lib/utils';
import { promotionPayload } from '@/lib/checkout';
import { cleanPromotionName, promotionIdentityErrors } from '@/lib/promotionRules';
import { promotionService } from '@/services/admin/orderService';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/dialog';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';

export default function PromotionsPage() {
  const [page, setPage] = useState(0), [editor, setEditor] = useState(null), [stop, setStop] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const list = useResource(() => promotionService.list({ page, size: 10 }), [page]);
  async function deactivate() { if (busy) return; setBusy(true); setError(''); try { await promotionService.deactivate(stop.id); setStop(null); list.reload(); toast.success('Đã ngừng nhận đơn mới với mã này.'); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); } }
  return <><div className="admin-page-heading"><div><span className="eyebrow">ƯU ĐÃI CỬA HÀNG</span><h1>Khuyến mãi.</h1><p>Quản lý sản phẩm áp dụng, thời hạn và số lượt sử dụng của từng ưu đãi.</p></div><Button onClick={() => setEditor({})}>Tạo mã ưu đãi</Button></div><section className="admin-table-panel"><div className="table-panel-heading"><h2>Danh sách chương trình</h2><Button variant="outline" size="sm" onClick={list.reload}>Tải lại</Button></div><ResourceState loading={list.loading} error={list.error} empty={!list.data?.items.length} onRetry={list.reload} />{!list.loading && !list.error && <div className="table-scroll"><table className="data-table"><thead><tr><th>Mã / tên</th><th>Giá trị giảm</th><th>Thời gian (giờ Việt Nam)</th><th>Lượt đã dùng / giới hạn</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{list.data?.items.map((p) => <tr key={p.id}><td><strong className="block">{p.promotionCode}</strong><small>{p.name}</small></td><td>{p.discountType === 'percentage' ? `${p.discountValue}%` : currency(p.discountValue)}<small className="block">Đơn từ {currency(p.minOrderValue)}</small></td><td>{adminDate(p.startDate, true)}<small className="block">→ {adminDate(p.endDate, true)}</small></td><td>{p.usageCount} / {p.usageLimit ?? 'Không giới hạn'}</td><td>{p.status}</td><td><div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => setEditor(p)}>Chi tiết / sửa</Button>{p.status !== 'inactive' && <Button variant="outline" size="sm" onClick={() => { setStop(p); setError(''); }}>Ngừng mã</Button>}</div></td></tr>)}</tbody></table></div>}<Pagination page={page} size={10} totalPages={list.data?.totalPages || 0} totalElements={list.data?.totalElements || 0} onChange={setPage} /></section>{editor && <PromotionForm key={editor.id || 'new'} item={editor} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); list.reload(); }} />}<Modal open={!!stop} onOpenChange={(open) => { if (!open && !busy) setStop(null); }} title="Ngừng mã khuyến mãi?" description="Đơn mới không dùng được mã. Đơn đã giữ mã vẫn giữ điều kiện đã chốt.">{error && <p role="alert" className="form-error">{error}</p>}<div className="form-actions"><Button variant="outline" disabled={busy} onClick={() => setStop(null)}>Giữ lại</Button><Button disabled={busy} onClick={deactivate}>Xác nhận ngừng</Button></div></Modal></>;
}
function PromotionForm({ item, onClose, onSaved }) {
  const [busy, setBusy] = useState(false);
  const detail = useResource(async () => {
    const [record, existing, suggestion] = await Promise.all([item.id ? promotionService.get(item.id) : Promise.resolve(item), allPages(promotionService.list), item.id ? Promise.resolve(null) : promotionService.nextCode()]);
    return { record, existing, suggestion };
  }, [item.id]);
  return <Modal open onOpenChange={(open) => { if (!open && !busy) onClose(); }} title={item.id ? 'Chi tiết chương trình ưu đãi' : 'Tạo mã ưu đãi'} description="Mã đã được dùng hoặc đang giữ chỉ được ngừng hoạt động; tạo mã mới để đổi điều kiện." className="!max-w-[850px]"><ResourceState loading={detail.loading} error={detail.error} onRetry={detail.reload} />{!detail.loading && !detail.error && <PromotionFields item={detail.data.record} initialRows={detail.data.existing} initialCode={detail.data.suggestion?.promotionCode} onSaved={onSaved} busy={busy} setBusy={setBusy} />}</Modal>;
}
function PromotionFields({ item, initialRows, initialCode, onSaved, busy, setBusy }) {
  const keys = ['promotionCode', 'name', 'description', 'discountType', 'discountValue', 'maxDiscountAmount', 'minOrderValue', 'startDate', 'endDate', 'usageLimit', 'perUserLimit', 'status', 'productIds', 'batchIds'];
  const [values, setValues] = useState(() => Object.fromEntries(keys.map((key) => [key, item[key] ?? ({ promotionCode: initialCode || '', discountType: 'percentage', minOrderValue: 0, status: 'draft', productIds: [], batchIds: [] }[key] ?? '')])));
  const [existing, setExisting] = useState(initialRows), [error, setError] = useState(''); const locked = useRef(false);
  // A new record's displayed code is only a preview; the server chooses the final code atomically.
  const identityErrors = promotionIdentityErrors(existing, { ...values, promotionCode: item.id ? values.promotionCode : '' }, item.id);
  const options = useResource(async () => { const [products, batches] = await Promise.all([allPages(promotionService.products), allPages(promotionService.batches)]); return { products, batches }; }, []);
  const field = (key, value) => setValues((old) => ({ ...old, [key]: value }));
  function toggle(key, id) { field(key, values[key].includes(id) ? values[key].filter((v) => v !== id) : [...values[key], id]); }
  async function save(event) {
    event.preventDefault(); if (locked.current) return; setError(''); locked.current = true; setBusy(true);
    try {
      const latest = await allPages(promotionService.list); setExisting(latest);
      const candidate = { ...values, name: cleanPromotionName(values.name), promotionCode: item.id ? item.promotionCode : values.promotionCode };
      setValues(candidate);
      const issues = promotionIdentityErrors(latest, { ...candidate, promotionCode: item.id ? candidate.promotionCode : '' }, item.id);
      if (Object.keys(issues).length) throw new Error(Object.values(issues)[0]);
      const saved = await promotionService.save(item.id, promotionPayload(candidate, { automaticCode: !item.id })); toast.success(`Đã lưu chương trình ${saved.promotionCode}.`); onSaved();
    } catch (err) {
      setError(errorMessage(err));
      if (err.response?.status === 409) {
        try {
          const [latest, suggestion] = await Promise.all([allPages(promotionService.list), item.id ? Promise.resolve(null) : promotionService.nextCode()]);
          setExisting(latest);
          if (suggestion) field('promotionCode', suggestion.promotionCode);
        } catch { /* Preserve the original save error; the user can close and reopen to refresh. */ }
      }
    }
    finally { locked.current = false; setBusy(false); }
  }
  return <AdminForm onSubmit={save}><fieldset disabled={busy || item.usageCount > 0} className="min-w-0 space-y-5"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Mã ưu đãi tự động" error={identityErrors.promotionCode} hint={item.id ? 'Mã đã lưu được giữ nguyên.' : 'Mã dự kiến từ hệ thống. Mã chính thức được cấp khi lưu và có thể thay đổi nếu có người khác tạo trước.'}><Input aria-label="Mã ưu đãi tự động" readOnly placeholder="Được cấp khi lưu" maxLength={50} value={values.promotionCode} /></Field><Field label="Tên ưu đãi *" error={identityErrors.name}><Input aria-label="Tên ưu đãi" required maxLength={200} value={values.name} onChange={(e) => { field('name', e.target.value); setError(''); }} /></Field><Field label="Hình thức giảm"><Select value={values.discountType} onChange={(e) => field('discountType', e.target.value)}><option value="percentage">Phần trăm</option><option value="fixed_amount">Số tiền cố định</option></Select></Field><Field label="Giá trị giảm"><Input type="number" required min="0.01" max={values.discountType === 'percentage' ? 100 : '999999999999.99'} step="0.01" value={values.discountValue} onChange={(e) => field('discountValue', e.target.value)} /></Field>{[['maxDiscountAmount', 'Giảm tối đa (₫, tùy chọn)', false, '0.01'], ['minOrderValue', 'Giá trị đơn tối thiểu (₫)', true, '0'], ['usageLimit', 'Tổng lượt tối đa (trống = không giới hạn)', false, '1'], ['perUserLimit', 'Lượt mỗi khách (trống = không giới hạn)', false, '1']].map(([key, label, required, min]) => <Field key={key} label={label}><Input type="number" required={required} min={min} max={key.includes('Limit') ? 2147483647 : '999999999999.99'} step={key.includes('Limit') ? '1' : '0.01'} value={values[key]} onChange={(e) => field(key, e.target.value)} /></Field>)}<Field label="Bắt đầu (giờ Việt Nam)"><AdminDateInput required withTime value={values.startDate} onChange={(e) => field('startDate', e.target.value)} /></Field><Field label="Kết thúc (giờ Việt Nam)"><AdminDateInput required withTime min={values.startDate || undefined} value={values.endDate} onChange={(e) => field('endDate', e.target.value)} /></Field><Field label="Trạng thái"><Select value={values.status} onChange={(e) => field('status', e.target.value)}><option value="draft">Nháp</option><option value="active">Hoạt động</option><option value="inactive">Ngừng hoạt động</option></Select></Field></div><Field label="Mô tả"><Textarea maxLength={5000} value={values.description} onChange={(e) => field('description', e.target.value)} /></Field><ResourceState loading={options.loading} error={options.error} onRetry={options.reload} />{options.data && ['productIds', 'batchIds'].map((key) => { const rows = key === 'productIds' ? options.data.products : options.data.batches; return <fieldset key={key} className="rounded-xl border border-line p-4"><legend className="px-2 text-sm">{key === 'productIds' ? 'Sản phẩm áp dụng' : 'Lô áp dụng (đã nhập, còn hạn)'}</legend><div className="max-h-52 space-y-2 overflow-y-auto">{rows.map((row) => <label key={row.id} className="flex items-start gap-3 py-2 text-xs"><input type="checkbox" className="accent-primary" checked={values[key].includes(row.id)} onChange={() => toggle(key, row.id)} />{key === 'productIds' ? row.productName : `${row.batchCode} · ${row.productName}`}</label>)}{values[key].filter((id) => !rows.some((r) => r.id === id)).map((id) => <label key={id} className="flex gap-3 py-2 text-xs"><input type="checkbox" checked onChange={() => toggle(key, id)} />Đã liên kết: {id} (ngoài danh sách hiện tại)</label>)}</div></fieldset>; })}<p className="text-xs leading-6 text-stone-500">Phạm vi sản phẩm HOẶC lô. Phần hàng trùng chỉ được giảm một lần. Mã hoạt động phải chọn ít nhất một phạm vi.</p><div className="form-actions"><Button type="submit" disabled={options.loading || !!options.error || !!identityErrors.name || !!identityErrors.promotionCode}>{busy ? 'Đang lưu…' : 'Lưu chương trình'}</Button></div></fieldset>{item.usageCount > 0 && <p className="!mt-4 text-sm text-amber-800">Mã đã dùng, chỉ có thể ngừng mã từ danh sách.</p>}{error && <p className="form-error" role="alert">{error}</p>}</AdminForm>;
}
