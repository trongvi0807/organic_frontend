import { useSearchParams } from 'react-router-dom';
import { FileText, Printer } from 'lucide-react';
import { businessForm, businessForms, formGroups } from '@/constants/businessForms';
import { useAuth } from '@/contexts/AuthContext';
import { useResource } from '@/hooks/useResource';
import { canReadFormSource, listFormSources, loadFormData } from '@/services/admin/businessFormService';
import { SearchSelect } from '@/components/admin/SearchSelect';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { ResourceState } from '@/components/common/ResourceState';
import BusinessFormDocument from '@/components/print/BusinessFormDocument';

export default function BusinessFormsPage() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const form = businessForm(params.get('form')) || businessForms[0];
  const sourceId = params.get('sourceId') || '', shipmentId = params.get('shipmentId') || '';
  const canRead = canReadFormSource(user, form.source);
  const sources = useResource(() => canRead ? listFormSources(form.source) : Promise.resolve([]), [form.source, canRead]);
  const document = useResource(() => sourceId && canRead ? loadFormData(form, sourceId, shipmentId) : Promise.resolve({ data: {}, warnings: [] }), [form.id, sourceId, shipmentId, canRead]);
  function update(key, value) { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); if (key === 'sourceId') next.delete('shipmentId'); setParams(next, { replace: true }); }
  function select(next) {
    const query = new URLSearchParams(); query.set('form', next.id);
    if (next.source === form.source && sourceId) query.set('sourceId', sourceId);
    setParams(query, { replace: true });
  }
  return <>
    <div className="admin-page-heading"><div><span className="eyebrow">HỒ SƠ NGHIỆP VỤ</span><h1>Biểu mẫu & bản in.</h1><p>16 mẫu theo tài liệu khóa luận. Chọn chứng từ nguồn hoặc in mẫu trống để điền tay.</p></div><Printer size={28} className="text-primary" /></div>
    <div className="business-form-workspace">
      <aside className="business-form-catalog" aria-label="Danh sách 16 biểu mẫu">{Object.entries(formGroups).map(([group, name]) => <section key={group}><h2>{name}</h2><div>{businessForms.filter((item) => item.group === group).map((item) => <button key={item.id} type="button" className={item.id === form.id ? 'active' : ''} aria-pressed={item.id === form.id} onClick={() => select(item)}><FileText size={15} /><span><small>{item.code}</small>{item.title}</span></button>)}</div></section>)}</aside>
      <div className="min-w-0 space-y-4">
        <section className="rounded-2xl border border-line bg-white p-4"><div className="flex flex-wrap items-end gap-3"><Field className="min-w-60 flex-1" label="Chứng từ / dữ liệu nguồn (không bắt buộc)"><SearchSelect aria-label="Chứng từ nguồn" disabled={!canRead || sources.loading} value={sourceId} placeholder="Chọn chứng từ, hoặc để trống để in mẫu giấy" options={sources.data || []} onChange={(value) => update('sourceId', value)} /></Field><Button variant="outline" onClick={() => update('sourceId', '')}>Dùng mẫu trống</Button></div>
          {!canRead && <p className="!mt-3 text-xs text-stone-500">Vai trò hiện tại có thể in mẫu trống. Dữ liệu nguồn của nhóm này yêu cầu quyền tương ứng.</p>}
          <ResourceState loading={sources.loading} error={sources.error} onRetry={sources.reload} />
          {!!document.data?.shipments?.length && document.data.shipments.length > 1 && <Field className="!mt-3" label="Chuyến giao hàng"><SearchSelect value={shipmentId} options={document.data.shipments.map((row) => ({ value: row.id, label: `${row.trackingCode || row.carrier} · ${row.driverName || row.status}` }))} onChange={(value) => update('shipmentId', value)} /></Field>}
          <p className="!mt-3 text-xs leading-6 text-stone-500">Thông tin chưa được ghi nhận được để trống. Chữ ký và con dấu thực hiện thủ công sau khi in.</p>
        </section>
        <ResourceState loading={document.loading} error={document.error} onRetry={document.reload} />
        {!document.loading && !document.error && <>{document.data?.warnings?.map((warning) => <p key={warning} className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900">{warning}</p>)}<BusinessFormDocument key={`${form.id}:${sourceId}`} formId={form.id} data={document.data?.data || {}} /></>}
      </div>
    </div>
  </>;
}
