import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ResourceState } from '@/components/common/ResourceState';
import { SearchSelect } from '@/components/admin/SearchSelect';
import { Field } from '@/components/ui/field';
import { useResource } from '@/hooks/useResource';
import { businessForms, businessForm } from '@/constants/businessForms';
import { loadFormData } from '@/services/admin/businessFormService';
import BusinessFormDocument from './BusinessFormDocument';

export function BusinessFormPreview({ sourceId, formIds, onClose }) {
  const [id, setId] = useState(formIds[0]), [shipmentId, setShipmentId] = useState('');
  const form = businessForm(id);
  const document = useResource(() => loadFormData(form, sourceId, shipmentId), [id, sourceId, shipmentId]);
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn biểu mẫu nghiệp vụ">{businessForms.filter((item) => formIds.includes(item.id)).map((item) => <Button key={item.id} variant={id === item.id ? 'default' : 'outline'} aria-pressed={id === item.id} onClick={() => setId(item.id)}>{item.code} · {item.title}</Button>)}</div>
    <ResourceState loading={document.loading} error={document.error} onRetry={document.reload} />
    {!document.loading && !document.error && <>
      {(document.data?.shipments?.length || 0) > 1 && <Field label="Chọn chuyến giao hàng cần in"><SearchSelect value={shipmentId} onChange={setShipmentId} options={document.data.shipments.map((row) => ({ value: row.id, label: `${row.trackingCode || row.carrier} · ${row.driverName || row.status}` }))} /></Field>}
      {document.data?.warnings?.map((warning) => <p key={warning} className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900">{warning}</p>)}
      <BusinessFormDocument key={id} formId={id} data={document.data?.data} onClose={onClose} />
    </>}
  </div>;
}
