import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { deliveryService } from '@/services/admin/deliveryService';
import { useResource } from '@/hooks/useResource';
import { DeliveryLocationPicker } from '@/components/admin/DeliveryLocationPicker';
import { AdminForm } from '@/components/admin/AdminForm';
import { Field, Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { ResourceState } from '@/components/common/ResourceState';
import { validLocation } from '@/lib/deliveryLocation';
import { errorMessage } from '@/lib/utils';
import { DEFAULT_STORE_LOCATION } from '@/constants/store';

export default function DeliverySettingsPage() {
  const source = useResource(deliveryService.configuration, []);
  const [form, setForm] = useState({ ...DEFAULT_STORE_LOCATION }), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!source.data) return;
    const address = source.data.storeAddress || DEFAULT_STORE_LOCATION.address;
    const defaultAddress = address === DEFAULT_STORE_LOCATION.address;
    setForm({ address, latitude: source.data.latitude ?? (defaultAddress ? DEFAULT_STORE_LOCATION.latitude : null),
      longitude: source.data.longitude ?? (defaultAddress ? DEFAULT_STORE_LOCATION.longitude : null) });
  }, [source.data]);
  async function save(event) {
    event.preventDefault(); if (busy) return;
    if (!validLocation(form.latitude, form.longitude)) { setError('Chọn đúng điểm xuất phát trên bản đồ.'); return; }
    setBusy(true); setError('');
    try { await deliveryService.saveConfiguration(form); toast.success('Đã lưu vị trí cửa hàng.'); source.reload({ background: true }); }
    catch (failure) { setError(errorMessage(failure)); } finally { setBusy(false); }
  }
  return <><div className="admin-page-heading"><div><span className="eyebrow">HỆ THỐNG</span><h1>Cấu hình giao hàng</h1><p>Điểm xuất phát dùng để tính tuyến giao từ cửa hàng đến khách.</p></div></div><ResourceState loading={source.loading} error={source.error} onRetry={source.reload} />{!source.loading && !source.error && <section className="max-w-3xl rounded-2xl border border-line bg-white p-5 sm:p-7"><AdminForm onSubmit={save}><fieldset disabled={busy} className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sage p-4"><div><p className="text-sm font-medium text-primary">Cửa hàng Organicfood.vn · Quận 1</p><p className="!mt-1 text-xs leading-6 text-stone-500">{DEFAULT_STORE_LOCATION.address}</p></div><Button type="button" variant="outline" size="sm" onClick={() => { setForm({ ...DEFAULT_STORE_LOCATION }); setError(''); }}>Dùng cửa hàng này</Button></div>
    <Field label="Địa chỉ cửa hàng *"><Input required maxLength={250} value={form.address} onChange={event => setForm({ address: event.target.value, latitude: null, longitude: null })} /></Field>
    <DeliveryLocationPicker key={source.data?.storeAddress} label="Vị trí cửa hàng" address={form.address} latitude={form.latitude} longitude={form.longitude} onChange={point => setForm(old => ({ ...old, address: point.label || old.address, latitude: point.latitude, longitude: point.longitude }))} />
    <p className="text-xs leading-6 text-stone-500">Tính giờ đến dự kiến khi xác nhận đã lấy hàng, theo tuyến đường từ cửa hàng đến vị trí nhận đã chọn. Thời gian chưa bao gồm trung chuyển hoặc các điểm dừng của hãng.</p>{error && <p role="alert" className="form-error">{error}</p>}<div className="form-actions"><Button type="submit">{busy ? 'Đang lưu…' : 'Lưu điểm xuất phát'}</Button></div></fieldset></AdminForm></section>}</>;
}
