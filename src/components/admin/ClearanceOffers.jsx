import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { can } from '@/lib/permissions';
import { currency, errorMessage } from '@/lib/utils';
import { adminDate } from '@/lib/adminFormat';
import { useResource } from '@/hooks/useResource';
import { clearanceService } from '@/services/admin/clearanceService';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/dialog';
import { AdminForm, AdminDateInput } from './AdminForm';
import { ResourceState } from '@/components/common/ResourceState';
import { SaleExpiry } from '@/components/products/SaleOptionPicker';

const states = { draft: 'Bản nháp', pending_approval: 'Chờ duyệt', active: 'Đã duyệt', rejected: 'Từ chối', inactive: 'Đã ngừng', expired: 'Kết thúc' };
export function ClearanceOffers() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const initialBatch = params.get('expiryBatch');
  const [editor, setEditor] = useState(initialBatch ? {} : null), [detail, setDetail] = useState(null), [action, setAction] = useState(null);
  const [note, setNote] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const list = useResource(clearanceService.list, []);
  function closeEditor() { setEditor(null); if (initialBatch) setParams(old => { const next = new URLSearchParams(old); next.delete('expiryBatch'); return next; }, { replace: true }); }
  async function perform(event) {
    event.preventDefault(); if (busy) return; setBusy(true); setError('');
    try { await clearanceService.action(action.row, action.type, note); setAction(null); setDetail(null); list.reload(); toast.success('Đã cập nhật chương trình.'); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  function ask(row, type) { setAction({ row, type }); setNote(''); setError(''); }
  return <section className="admin-table-panel !mb-6" aria-label="Ưu đãi theo hạn dùng">
    <div className="table-panel-heading"><div><h2>Ưu đãi theo hạn dùng</h2><p className="text-xs leading-6 text-stone-500">Kiểm tra hàng, chọn mức giảm rồi gửi duyệt trước khi mở bán.</p></div>{can(user, 'promotion.write') && <Button onClick={() => setEditor({})}>Lập ưu đãi / combo</Button>}</div>
    <ResourceState loading={list.loading} error={list.error} onRetry={list.reload} />
    {!list.loading && !list.error && !list.data?.length && <p className="p-5 text-sm text-stone-500">Chưa có chương trình theo hạn dùng.</p>}
    {!!list.data?.length && <div className="table-scroll"><table className="data-table"><thead><tr><th>Chương trình</th><th>Giảm</th><th>Thời gian</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{list.data.map(row => <tr key={row.id}><td><strong>{row.name}</strong><small className="block text-stone-500">{row.code} · {row.promotionType === 'combo' ? 'Combo' : 'Ưu đãi sản phẩm'}</small></td><td>{row.discountPercent}%</td><td>{adminDate(row.startDate, true)}<small className="block">→ {adminDate(row.endDate, true)}</small></td><td><span className={`rounded-full px-3 py-1 text-xs ${row.status === 'pending_approval' ? 'bg-amber-50 text-amber-900' : 'bg-sage text-primary'}`}>{states[row.status] || row.status}</span></td><td><div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => setDetail(row)}>Xem</Button>{can(user, 'promotion.write') && ['draft', 'rejected'].includes(row.status) && <><Button size="sm" variant="outline" onClick={() => setEditor(row)}>Sửa</Button><Button size="sm" onClick={() => ask(row, 'submit')}>Gửi duyệt</Button></>}{can(user, 'promotion.approve') && row.status === 'pending_approval' && <><Button size="sm" onClick={() => { setDetail(row); ask(row, 'approve'); }}>Duyệt</Button><Button size="sm" variant="outline" onClick={() => ask(row, 'reject')}>Từ chối</Button></>}{can(user, 'promotion.write') && ['active', 'draft', 'pending_approval', 'rejected'].includes(row.status) && <Button size="sm" variant="outline" onClick={() => ask(row, 'stop')}>Ngừng</Button>}</div></td></tr>)}</tbody></table></div>}
    {editor && <ClearanceEditor key={editor.id || 'new'} item={editor} initialBatch={initialBatch} onClose={closeEditor} onSaved={() => { closeEditor(); list.reload(); }} />}
    <Modal open={!!detail && !action} title={detail?.name || 'Chi tiết chương trình'} onOpenChange={open => { if (!open) setDetail(null); }} className="!max-w-3xl">{detail && <><p className="text-sm">Giảm {detail.discountPercent}% · {states[detail.status]} · {adminDate(detail.startDate, true)} → {adminDate(detail.endDate, true)}</p><OfferLines items={detail.items} percent={detail.discountPercent} />{detail.approvedAt && <p className="!mt-4 text-sm">Đã duyệt lúc {adminDate(detail.approvedAt, true)}</p>}{detail.decisionNote && <p className="!mt-3 text-sm">{detail.decisionNote}</p>}</>}</Modal>
    <Modal open={!!action} title={action?.type === 'approve' ? 'Duyệt mở bán?' : action?.type === 'reject' ? 'Từ chối chương trình' : action?.type === 'stop' ? 'Ngừng chương trình?' : 'Gửi duyệt chương trình?'} onOpenChange={open => { if (!open && !busy) setAction(null); }} className="!max-w-3xl">{action && <AdminForm onSubmit={perform}><p className="!mb-4 text-sm font-semibold">{action.row.name} · Giảm {action.row.discountPercent}%</p><OfferLines items={action.row.items} percent={action.row.discountPercent} />{action.type === 'approve' && <p className="!mt-4 text-sm leading-6">Xác nhận hàng đủ điều kiện bán, đúng hạn sử dụng và số lượng. Hàng được dành cho chương trình sau khi duyệt.</p>}{action.type === 'stop' && <p className="!mt-4 text-sm leading-6">Ngừng nhận đơn mới và giải phóng phần chưa được khách đặt. Đơn đã đặt vẫn cần được xử lý theo hạn dùng đã chốt.</p>}{action.type === 'reject' && <Field label="Lý do từ chối *"><Textarea required maxLength={2000} value={note} onChange={e => setNote(e.target.value)} /></Field>}{error && <p role="alert" className="form-error">{error}</p>}<div className="form-actions"><Button type="button" variant="outline" disabled={busy} onClick={() => setAction(null)}>Đóng</Button><Button type="submit" disabled={busy}>{busy ? 'Đang xử lý…' : 'Xác nhận'}</Button></div></AdminForm>}</Modal>
  </section>;
}

function OfferLines({ items, percent }) {
  return <ul className="!mt-4 divide-y divide-line">{items.map(row => <li key={row.batchId} className="py-3 text-sm"><strong>{row.productName}</strong><span className="!ml-2 text-stone-500">{row.variantName}</span><SaleExpiry date={row.expiryDate} /><p>{row.quantity} gói/hộp · {row.requiredQuantity} mỗi bộ · Giá thường {currency(row.regularPrice)}{row.heldQuantity != null && ` · Còn dành cho chương trình ${row.heldQuantity}`}</p><OfferPrice row={row} percent={percent} /></li>)}</ul>;
}

function OfferPrice({ row, percent }) {
  const salePrice = Math.round(Number(row.regularPrice) * (1 - Number(percent || 0) / 100));
  const hasCost = row.purchasePrice != null && Number.isFinite(Number(row.purchasePrice));
  return <div className="!mt-2 rounded-lg bg-stone-50 p-3 text-xs leading-6">
    <p>Giá nhập của lô: {hasCost ? currency(row.purchasePrice) : 'Chưa có thông tin'} · Giá sau giảm: <strong className="text-primary">{currency(salePrice)}</strong>/gói, hộp</p>
    {hasCost && salePrice < Number(row.purchasePrice) && <p className="font-medium text-amber-900">Giá sau giảm thấp hơn giá nhập. Người duyệt cần xem xét trước khi mở bán.</p>}
  </div>;
}

function ClearanceEditor({ item, initialBatch, onClose, onSaved }) {
  const editing = !!item.id;
  const options = useResource(() => clearanceService.options(''), []);
  const [search, setSearch] = useState(''), [name, setName] = useState(item.name || ''), [type, setType] = useState(item.promotionType || 'product');
  const [percent, setPercent] = useState(String(item.discountPercent || '')), [start, setStart] = useState(item.startDate || ''), [end, setEnd] = useState(item.endDate || '');
  const [selected, setSelected] = useState(() => Object.fromEntries((item.items || []).map(row => [row.batchId, { ...row, checked: true }])));
  const [checked, setChecked] = useState(false), [review, setReview] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lines = (options.data || []).filter(row => selected[row.batchId]?.checked || !editing && row.batchId === initialBatch && !Object.hasOwn(selected, row.batchId)).map(row => ({ ...row, quantity: 1, requiredQuantity: 1, ...selected[row.batchId] }));
  const anchor = lines[0]?.productId;
  const recommendations = useResource(() => anchor ? clearanceService.crossSell(anchor) : Promise.resolve([]), [anchor]);
  const visible = (options.data || []).filter(row => `${row.productName} ${row.variantName}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));
  const upperEnd = lines.map(row => row.latestSaleEnd).filter(Boolean).sort()[0];
  function update(row, changes) { setReview(false); setSelected(old => ({ ...old, [row.batchId]: { quantity: 1, requiredQuantity: 1, ...old[row.batchId], ...changes } })); }
  async function save(event) {
    event.preventDefault(); if (busy) return; setError('');
    if (!lines.length) { setError('Vui lòng chọn hàng cho chương trình.'); return; }
    if (!checked) { setError('Vui lòng kiểm tra và xác nhận hàng đủ điều kiện bán.'); return; }
    if (!(Number(percent) >= 1 && Number(percent) <= 99) || !start || !end || end <= start || upperEnd && end > upperEnd) { setError('Kiểm tra mức giảm và thời gian bán; không vượt mốc ngừng nhận đơn.'); return; }
    if (!review) { setReview(true); return; }
    const payload = { name: name.trim(), promotionType: type, discountPercent: Number(percent), startDate: start, endDate: end, qualityConfirmed: checked, version: item.version ?? null,
      items: lines.map(row => ({ batchId: row.batchId, quantity: Number(row.quantity), requiredQuantity: type === 'combo' ? Number(row.requiredQuantity) : 1, expiresAt: row.expiresAt || null, sellUntilAt: row.sellUntilAt || null })) };
    setBusy(true);
    try { await (editing ? clearanceService.update(item.id, payload) : clearanceService.create(payload)); toast.success('Đã lưu bản nháp. Gửi duyệt để mở bán.'); onSaved(); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  return <Modal open title={editing ? 'Sửa ưu đãi theo hạn dùng' : 'Lập ưu đãi theo hạn dùng'} description="Chọn hàng và hạn sử dụng rõ ràng. Chương trình chỉ mở bán sau khi duyệt." className="!max-w-5xl" onOpenChange={open => { if (!open && !busy) onClose(); }}><AdminForm onSubmit={save}><fieldset disabled={busy} className="min-w-0 space-y-5">
    <ResourceState loading={options.loading} error={options.error} onRetry={options.reload} />
    {review ? <><h3 className="font-semibold">{name} · Giảm {percent}%</h3><p>{adminDate(start, true)} → {adminDate(end, true)}</p><OfferLines items={lines} percent={percent} /><p className="text-sm leading-6">Lưu bản nháp chưa thay đổi tồn. Khi được duyệt, số lượng đã chọn được dành cho chương trình.</p></> : <>
      <div className="form-grid"><Field label="Tên chương trình *"><Input required maxLength={200} value={name} onChange={e => setName(e.target.value)} /></Field><Field label="Hình thức"><Select value={type} onChange={e => setType(e.target.value)}><option value="product">Giảm giá một sản phẩm</option><option value="combo">Combo mua đủ bộ</option></Select></Field></div>
      <Field label="Tìm sản phẩm"><Input type="search" value={search} placeholder="Nhập tên sản phẩm hoặc quy cách…" onChange={e => setSearch(e.target.value)} /></Field>
      <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-line p-3">{visible.map(row => { const enabled = lines.some(line => line.batchId === row.batchId); return <label key={row.batchId} className={`flex items-start gap-3 rounded-xl p-3 ${enabled ? 'bg-sage' : 'hover:bg-stone-50'}`}><input type="checkbox" className="!mt-1 accent-primary" checked={enabled} onChange={e => update(row, { checked: e.target.checked })} /><span className="text-sm"><strong>{row.productName}</strong> · {row.variantName}{row.netQuantity && ` · ${row.netQuantity}${row.unitId || ''}`}<SaleExpiry date={row.expiryDate} /><small className="block text-stone-500">Còn trống {row.availableQuantity} · Giá thường {currency(row.regularPrice)}</small>{row.suggestion?.minPercent && <small className="block text-primary">Gợi ý giảm {row.suggestion.minPercent}–{row.suggestion.maxPercent}% sau kiểm tra</small>}</span></label>; })}{!options.loading && !visible.length && <p className="p-3 text-sm text-stone-500">Chưa có hàng phù hợp và còn đủ thời gian mở bán.</p>}</div>
      {type === 'combo' && anchor && <div className="rounded-xl bg-stone-50 p-4"><h3 className="!font-sans !text-sm font-semibold">Gợi ý mua kèm</h3>{recommendations.data?.length ? <div className="!mt-2 flex flex-wrap gap-2">{recommendations.data.map(row => <Button key={row.productId} size="sm" variant="outline" onClick={() => setSearch(row.productName)}>{row.productName} · {row.togetherOrders} đơn mua cùng</Button>)}</div> : <p className="text-xs leading-6 text-stone-500">{recommendations.loading ? 'Đang tìm gợi ý…' : 'Chưa đủ lịch sử mua chung. Bạn vẫn có thể chọn sản phẩm phía trên.'}</p>}</div>}
      {lines.map(row => <div key={row.batchId} className="rounded-xl border border-line p-4"><strong className="text-sm">{row.productName} · {row.variantName}</strong><SaleExpiry date={row.expiryDate} /><div className="!mt-3 grid gap-3 sm:grid-cols-2"><Field label="Số lượng dành cho chương trình *"><Input required type="number" min="1" max={row.availableQuantity} value={row.quantity} onChange={e => update(row, { quantity: e.target.value, checked: true })} /></Field>{type === 'combo' && <Field label="Số gói/hộp trong mỗi bộ *"><Input required type="number" min="1" max="99" value={row.requiredQuantity} onChange={e => update(row, { requiredQuantity: e.target.value, checked: true })} /></Field>}</div><details className="!my-3 rounded-lg bg-stone-50 p-3"><summary className="cursor-pointer text-xs font-medium">Giờ hết hạn và ngừng nhận đơn (nếu có)</summary><div className="!mt-3 grid gap-3 sm:grid-cols-2"><Field label="Giờ hết hạn trên nhãn"><AdminDateInput withTime value={row.expiresAt || ''} onChange={e => update(row, { expiresAt: e.target.value, checked: true })} /></Field><Field label="Ngừng nhận đơn sớm hơn"><AdminDateInput withTime value={row.sellUntilAt || ''} max={row.latestSaleEnd} onChange={e => update(row, { sellUntilAt: e.target.value, checked: true })} /></Field></div><p className="!mt-2 text-xs leading-6 text-stone-500">Chỉ nhập giờ hết hạn nếu có thông tin trên nhãn. Không tự kéo dài thời hạn bảo quản.</p></details><small className="block text-stone-500">Ngừng nhận đơn chậm nhất: {adminDate(row.latestSaleEnd, true)}</small><OfferPrice row={row} percent={percent} /></div>)}
      <div className="form-grid"><Field label="Phần trăm giảm *"><Input required type="number" min="1" max="99" step="0.01" value={percent} onChange={e => setPercent(e.target.value)} /></Field><div className="self-center text-sm leading-6 text-primary">{lines.length > 0 && Number(percent) > 0 && <>Giá {type === 'combo' ? 'mỗi bộ' : 'mỗi gói/hộp'} dự kiến: <strong>{currency([...new Map(lines.map(row => [row.variantId, row])).values()].reduce((sum, row) => sum + Number(row.regularPrice) * (type === 'combo' ? Number(row.requiredQuantity) : 1), 0) * (1 - Number(percent) / 100))}</strong></>}</div><Field label="Bắt đầu bán *"><AdminDateInput required withTime value={start} onChange={e => setStart(e.target.value)} /></Field><Field label="Ngừng nhận đơn *"><AdminDateInput required withTime value={end} max={upperEnd} onChange={e => setEnd(e.target.value)} /></Field></div>
      <label className="flex items-start gap-3 rounded-xl bg-sage p-4 text-sm leading-6"><input type="checkbox" required checked={checked} onChange={e => setChecked(e.target.checked)} className="!mt-1 accent-primary" />Tôi đã kiểm tra thực tế: hàng còn hạn, bảo quản đúng và đủ điều kiện bán.</label>
    </>}{error && <p role="alert" className="form-error">{error}</p>}<div className="form-actions"><Button type="button" variant="outline" disabled={busy} onClick={review ? () => setReview(false) : onClose}>{review ? 'Quay lại chỉnh sửa' : 'Đóng'}</Button><Button type="submit" disabled={busy || options.loading || !!options.error}>{busy ? 'Đang lưu…' : review ? 'Lưu bản nháp' : 'Xem lại chương trình'}</Button></div>
  </fieldset></AdminForm></Modal>;
}
