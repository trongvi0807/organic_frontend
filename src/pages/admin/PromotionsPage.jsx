import { PromotionDiscountFields } from '@/components/admin/PromotionDiscountFields';
import { PromotionProductPicker } from '@/components/admin/PromotionProductPicker';
import { PromotionRedemptionFields } from '@/components/admin/PromotionRedemptionFields';
import { adminDate } from '@/lib/adminFormat';
import { AdminDateInput, AdminForm } from '@/components/admin/AdminForm';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useResource } from '@/hooks/useResource';
import { allPages } from '@/lib/apiData';
import { currency, errorMessage } from '@/lib/utils';
import { promotionPayload } from '@/lib/checkout';
import { automaticPromotionMaximum, cleanPromotionName, promotionIdentityErrors } from '@/lib/promotionRules';
import { promotionService } from '@/services/admin/orderService';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/dialog';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';

export default function PromotionsPage() {
  const [page, setPage] = useState(0), [editor, setEditor] = useState(null), [stop, setStop] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const list = useResource(() => promotionService.list({ page, size: 10 }), [page]);
  async function deactivate() { if (busy) return; setBusy(true); setError(''); try { await promotionService.deactivate(stop.id); setStop(null); list.reload(); toast.success('Đã ngừng chương trình. Quyền lợi đã cấp được giữ theo điều kiện đã chốt.'); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); } }
  return <><div className="admin-page-heading"><div><span className="eyebrow">ƯU ĐÃI CỬA HÀNG</span><h1>Khuyến mãi.</h1><p>Quản lý sản phẩm áp dụng, thời hạn và số lượt sử dụng của từng ưu đãi.</p></div><Button onClick={() => setEditor({})}>Tạo mã ưu đãi</Button></div><section className="admin-table-panel"><div className="table-panel-heading"><h2>Danh sách chương trình</h2><Button variant="outline" size="sm" onClick={list.reload}>Tải lại</Button></div><ResourceState loading={list.loading} error={list.error} empty={!list.data?.items.length} onRetry={list.reload} />{!list.loading && !list.error && <div className="table-scroll"><table className="data-table"><thead><tr><th>Mã / tên</th><th>Giá trị giảm</th><th>Thời gian (giờ Việt Nam)</th><th>Lượt đã dùng / giới hạn</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{list.data?.items.map((p) => <tr key={p.id}><td><strong className="block">{p.promotionCode}</strong><small>{p.name}</small>{p.pointsCost && <small className="block text-primary">Đổi {p.pointsCost} điểm · Hạn dùng {p.voucherValidDays} ngày</small>}</td><td>{p.discountType === 'percentage' ? `${p.discountValue}%` : currency(p.discountValue)}<small className="block">Đơn từ {currency(p.minOrderValue)}</small></td><td>{adminDate(p.startDate, true)}<small className="block">→ {adminDate(p.endDate, true)}</small></td><td>{p.usageCount} / {p.usageLimit ?? 'Không giới hạn'}</td><td>{p.status}</td><td><div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => setEditor(p)}>Chi tiết / sửa</Button>{p.status !== 'inactive' && <Button variant="outline" size="sm" onClick={() => { setStop(p); setError(''); }}>Ngừng mã</Button>}</div></td></tr>)}</tbody></table></div>}<Pagination page={page} size={10} totalPages={list.data?.totalPages || 0} totalElements={list.data?.totalElements || 0} onChange={setPage} /></section>{editor && <PromotionForm key={editor.id || 'new'} item={editor} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); list.reload(); }} />}<Modal open={!!stop} onOpenChange={(open) => { if (!open && !busy) setStop(null); }} title="Ngừng mã khuyến mãi?" description={stop?.pointsCost ? 'Ngừng cho khách đổi thêm. Voucher đã cấp vẫn sử dụng được đến hạn theo điều kiện đã chốt.' : 'Đơn mới không dùng được mã. Đơn đã giữ mã vẫn giữ điều kiện đã chốt.'}>{error && <p role="alert" className="form-error">{error}</p>}<div className="form-actions"><Button variant="outline" disabled={busy} onClick={() => setStop(null)}>Giữ lại</Button><Button disabled={busy} onClick={deactivate}>Xác nhận ngừng</Button></div></Modal></>;
}
function PromotionForm({ item, onClose, onSaved }) {
  const [busy, setBusy] = useState(false);
  const detail = useResource(async () => {
    const [record, existing, suggestion] = await Promise.all([item.id ? promotionService.get(item.id) : Promise.resolve(item), allPages(promotionService.list), item.id ? Promise.resolve(null) : promotionService.nextCode()]);
    return { record, existing, suggestion };
  }, [item.id]);
  return <Modal open onOpenChange={(open) => { if (!open && !busy) onClose(); }} title={item.id ? 'Chi tiết chương trình ưu đãi' : 'Tạo mã ưu đãi'} className="!max-w-[850px]"><ResourceState loading={detail.loading} error={detail.error} onRetry={detail.reload} />{!detail.loading && !detail.error && <PromotionFields item={detail.data.record} initialRows={detail.data.existing} initialCode={detail.data.suggestion?.promotionCode} onSaved={onSaved} busy={busy} setBusy={setBusy} />}</Modal>;
}
function PromotionFields({ item, initialRows, initialCode, onSaved, busy, setBusy }) {
  const keys = ['promotionCode', 'name', 'description', 'discountType', 'discountValue', 'maxDiscountAmount', 'minOrderValue', 'startDate', 'endDate', 'usageLimit', 'perUserLimit', 'status', 'productIds', 'batchIds', 'pointsCost', 'voucherValidDays'];
  const [values, setValues] = useState(() => ({ ...Object.fromEntries(keys.map((key) => [key, item[key] ?? ({ promotionCode: initialCode || '', discountType: 'percentage', minOrderValue: 0, status: 'draft', productIds: [] }[key] ?? '')])), batchIds: [] }));
  const [existing, setExisting] = useState(initialRows), [error, setError] = useState(''); const locked = useRef(false);
  // This calculation input is not a promotion rule and must not be sent to the API.
  const [referenceAmount, setReferenceAmount] = useState('');
  const [discountEdited, setDiscountEdited] = useState(false);
  const requireReference = values.discountType === 'percentage' && (!item.id || discountEdited);
  // A new record's displayed code is only a preview; the server chooses the final code atomically.
  const identityErrors = promotionIdentityErrors(existing, { ...values, promotionCode: item.id ? values.promotionCode : '' }, item.id);
  const options = useResource(async () => ({ products: await allPages(promotionService.products) }), []);
  function field(key, value) {
    const changesDiscount = key === 'discountType' || key === 'discountValue';
    if (changesDiscount) setDiscountEdited(true);
    setValues((old) => {
      const next = { ...old, [key]: value };
      if (changesDiscount) next.maxDiscountAmount = automaticPromotionMaximum(referenceAmount, next);
      return next;
    });
    setError('');
  }
  function changeReference(value) {
    setReferenceAmount(value);
    setDiscountEdited(true);
    setValues((old) => ({ ...old, maxDiscountAmount: automaticPromotionMaximum(value, old) }));
    setError('');
  }
  async function save(event) {
    event.preventDefault(); if (locked.current) return; setError(''); locked.current = true; setBusy(true);
    try {
      if (requireReference && !(Number(referenceAmount) > 0)) throw new Error('Vui lòng nhập giá trị hàng làm mốc ở bước 2 để tính mức giảm tối đa.');
      if (requireReference && !(Number(values.maxDiscountAmount) > 0)) throw new Error('Vui lòng kiểm tra giá trị hàng và tỷ lệ giảm ở bước 2. Mức giảm phải từ 1₫ sau khi làm tròn.');
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
  return <AdminForm onSubmit={save}>
    <fieldset disabled={busy || item.usageCount > 0} className="min-w-0 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mã ưu đãi tự động" error={identityErrors.promotionCode}>
          <Input aria-label="Mã ưu đãi tự động" readOnly placeholder="Được cấp khi lưu" maxLength={50} value={values.promotionCode} />
        </Field>
        <Field label="Tên ưu đãi *" error={identityErrors.name}>
          <Input aria-label="Tên ưu đãi" required maxLength={200} value={values.name} onChange={(event) => field('name', event.target.value)} />
        </Field>
        <Field label="Hình thức giảm" className="sm:col-span-2">
          <Select value={values.discountType} onChange={(event) => field('discountType', event.target.value)}>
            <option value="percentage">Phần trăm</option>
            <option value="fixed_amount">Số tiền cố định</option>
          </Select>
        </Field>
      </div>

      <p className="rounded-xl bg-[#F7FAF5] px-4 py-3 text-sm leading-6 text-[#1B4D2E]">
        Điền lần lượt từ bước 1 đến bước 4 bên dưới. Các ô có dấu * là bắt buộc.
      </p>

      <PromotionStep number="1" title="Chọn sản phẩm áp dụng" description="Tìm và đánh dấu những sản phẩm được hưởng ưu đãi. Có thể chọn tất cả nếu áp dụng toàn cửa hàng.">
        <ResourceState loading={options.loading} error={options.error} onRetry={options.reload} />
        {!!item.batchIds?.length && <p className="rounded-xl bg-amber-50 p-4 text-xs leading-6 text-amber-800">Chương trình này có điều kiện áp dụng cũ. Khi chỉnh sửa, hãy chọn lại các sản phẩm; sau khi lưu, ưu đãi sẽ áp dụng theo sản phẩm bạn chọn.</p>}
        {options.data && <PromotionProductPicker products={options.data.products} selectedIds={values.productIds} onChange={(ids) => field('productIds', ids)} />}
      </PromotionStep>

      <PromotionStep number="2" title="Thiết lập mức giảm" description={values.discountType === 'percentage'
        ? 'Nhập giá trị hàng làm mốc trước, sau đó nhập tỷ lệ giảm. Mức giảm tối đa được điền tự động, không cần tính tay.'
        : 'Nhập số tiền muốn giảm. Hệ thống tự điền mức giảm tối đa bằng số tiền này.'}>
        <PromotionDiscountFields values={values} referenceAmount={referenceAmount} requireReference={requireReference}
          onReferenceChange={changeReference} onChange={field} />
      </PromotionStep>

      <PromotionStep number="3" title="Điều kiện và thời gian áp dụng" description="Đặt điều kiện mua hàng, số lượt sử dụng và khoảng thời gian khách có thể dùng ưu đãi.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Giá trị đơn tối thiểu (₫) *" className="sm:col-span-2" hint="Nhập 0 nếu không yêu cầu giá trị đơn tối thiểu. Ví dụ: 100000 nghĩa là đơn từ 100.000₫ mới được dùng.">
            <Input required type="number" min="0" max="999999999999.99" step="0.01" value={values.minOrderValue} onChange={(event) => field('minOrderValue', event.target.value)} />
          </Field>
          <Field label="Tổng lượt sử dụng tối đa" hint="Giới hạn cho toàn bộ khách hàng. Để trống nếu không giới hạn.">
            <Input type="number" min="1" max="2147483647" step="1" placeholder="Không giới hạn" value={values.usageLimit} onChange={(event) => field('usageLimit', event.target.value)} />
          </Field>
          <Field label="Lượt tối đa cho mỗi khách" hint="Giới hạn riêng từng khách hàng. Ví dụ: 1 nghĩa là mỗi khách chỉ dùng một lần.">
            <Input type="number" min="1" max="2147483647" step="1" placeholder="Không giới hạn" value={values.perUserLimit} onChange={(event) => field('perUserLimit', event.target.value)} />
          </Field>
          <Field label="Bắt đầu (giờ Việt Nam) *">
            <AdminDateInput required withTime value={values.startDate} onChange={(event) => field('startDate', event.target.value)} />
          </Field>
          <Field label="Kết thúc (giờ Việt Nam) *" hint="Chọn sau thời điểm bắt đầu.">
            <AdminDateInput required withTime min={values.startDate || undefined} value={values.endDate} onChange={(event) => field('endDate', event.target.value)} />
          </Field>
        </div>
      </PromotionStep>

      <PromotionStep number="4" title="Cách nhận ưu đãi và lưu" description="Chọn cách khách nhận ưu đãi, kiểm tra thông tin rồi lưu. Chọn Bản nháp nếu chưa muốn cho khách sử dụng.">
        <PromotionRedemptionFields values={values} onChange={field} />
        <Field label="Mô tả (tùy chọn)">
          <Textarea maxLength={5000} placeholder="Thông tin bổ sung cho chương trình ưu đãi…" value={values.description} onChange={(event) => field('description', event.target.value)} />
        </Field>
        <Field label="Trạng thái" hint="Hoạt động: khách được dùng trong thời gian đã chọn. Bản nháp: lưu để hoàn thiện sau.">
          <Select value={values.status} onChange={(event) => field('status', event.target.value)}>
            <option value="draft">Bản nháp</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
          </Select>
        </Field>
        <p className="text-sm leading-6 text-[#1B4D2E]">
          Đã chọn {values.productIds.length} sản phẩm
          {Number(values.discountValue) > 0 && <> · Giảm {values.discountType === 'percentage' ? `${values.discountValue}%` : currency(Number(values.discountValue))}</>}
          {Number(values.maxDiscountAmount) > 0 && <> · Tối đa {currency(Number(values.maxDiscountAmount))}</>}
        </p>
        <div className="form-actions">
          <Button type="submit" disabled={options.loading || !!options.error || !!identityErrors.name || !!identityErrors.promotionCode}>
            {busy ? 'Đang lưu…' : values.status === 'draft' ? 'Lưu bản nháp' : 'Lưu chương trình'}
          </Button>
        </div>
      </PromotionStep>
    </fieldset>
    {item.usageCount > 0 && <p className="!mt-4 text-sm text-amber-800">Mã đã dùng, chỉ có thể ngừng mã từ danh sách.</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </AdminForm>;
}

function PromotionStep({ number, title, description, children }) {
  return <section aria-label={`Bước ${number}: ${title}`} className="min-w-0 rounded-2xl border border-[#d8e4d3] bg-white p-4 sm:p-5">
    <div className="!mb-5 flex items-start gap-3">
      <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e7f0e3] text-sm font-semibold text-[#1B4D2E]">{number}</span>
      <div className="min-w-0">
        <h3 className="!mb-1 text-base font-semibold text-[#1B4D2E]">{title}</h3>
        <p className="text-xs leading-6 text-stone-500">{description}</p>
      </div>
    </div>
    <div className="space-y-4">{children}</div>
  </section>;
}
