import { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { deliveryService } from '@/services/admin/deliveryService';
import { isGoogleMapsLink, parseMapLocation, validLocation } from '@/lib/deliveryLocation';
import { errorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';

export function DeliveryLocationPicker({ address = '', latitude, longitude, onChange, label = 'Vị trí nhận hàng' }) {
  const [query, setQuery] = useState(address), [results, setResults] = useState([]), [mapInput, setMapInput] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const valid = validLocation(latitude, longitude);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { setQuery(address); setResults([]); }, [address]);
  async function find() {
    if (busy) return;
    if (!query.trim()) { setError('Nhập địa chỉ cần tìm.'); return; }
    setBusy(true); setError('');
    try { const items = await deliveryService.locations(query.trim()); if (!mounted.current) return; setResults(items); if (!items.length) setError('Chưa tìm được địa chỉ. Bạn có thể dán vị trí từ bản đồ bên dưới.'); }
    catch (failure) { if (mounted.current) setError(errorMessage(failure)); } finally { if (mounted.current) setBusy(false); }
  }
  async function fromMap() {
    if (busy) return;
    const point = parseMapLocation(mapInput);
    if (point) { onChange(point); setError(''); setResults([]); return; }
    if (!isGoogleMapsLink(mapInput)) { setError('Dán liên kết chia sẻ Google Maps hoặc tọa độ dạng 10.790650, 106.697009.'); return; }
    setBusy(true); setError('');
    try {
      const location = await deliveryService.resolveMapLink(mapInput.trim());
      if (!mounted.current) return;
      if (!validLocation(location.latitude, location.longitude)) throw new Error('Chưa đọc được vị trí ghim trong liên kết. Vui lòng chọn lại địa điểm trên Google Maps.');
      onChange(location); setResults([]);
    } catch (failure) { if (mounted.current) setError(errorMessage(failure)); }
    finally { if (mounted.current) setBusy(false); }
  }
  return <div className="space-y-4 rounded-xl border border-line bg-[#F7FAF5] p-4"><Field label={label}><div className="flex gap-2"><Input disabled={busy} value={query} maxLength={250} aria-label="Địa chỉ tìm trên bản đồ" onChange={event => { setQuery(event.target.value); setResults([]); }} /><Button disabled={busy} variant="outline" onClick={find}><Search size={16} /><span className="sr-only">Tìm địa chỉ</span></Button></div></Field>
    {results.length > 0 && <ul className="divide-y divide-line rounded-xl bg-white">{results.map((location, i) => <li key={i}><button disabled={busy} type="button" className="flex w-full items-start gap-2 p-3 text-left text-sm hover:bg-sage" onClick={() => { onChange(location); setResults([]); setError(''); }}><MapPin size={16} className="shrink-0" />{location.label}</button></li>)}</ul>}
    <details><summary className="cursor-pointer text-xs font-medium text-primary">Dùng vị trí đã ghim trên bản đồ</summary><div className="!mt-3 space-y-3"><Input disabled={busy} aria-label="Tọa độ hoặc đường dẫn vị trí ghim" placeholder="Dán liên kết Google Maps hoặc tọa độ…" maxLength={3000} value={mapInput} onChange={event => setMapInput(event.target.value)} /><Button disabled={busy} size="sm" variant="outline" onClick={fromMap}>{busy ? 'Đang đọc vị trí…' : 'Chọn vị trí này'}</Button></div></details>
    {valid && <div className="space-y-3 rounded-xl border border-emerald-200 bg-white p-3">
      <p role="status" className="text-xs font-medium text-emerald-800">Đã chọn vị trí.</p>
      <p className="text-xs text-stone-600">Tọa độ: <span className="font-mono tabular-nums">{Number(latitude)}, {Number(longitude)}</span></p>
      <iframe key={`${latitude},${longitude}`} title={`${label} trên Google Maps`} loading="lazy" referrerPolicy="no-referrer" className="h-52 w-full rounded-lg border border-line" src={`https://www.google.com/maps?q=${encodeURIComponent(`${Number(latitude)},${Number(longitude)}`)}&z=16&output=embed`} />
      <a className="inline-flex items-center gap-1.5 text-xs font-medium underline" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${Number(latitude)},${Number(longitude)}`}><MapPin size={14} />Mở Google Maps để đối chiếu vị trí</a>
      <p className="text-[11px] leading-5 text-stone-500">Nếu bản đồ xem trước chưa tải được, bạn vẫn có thể mở liên kết trên để kiểm tra điểm nhận. Lựa chọn tọa độ vẫn được giữ nguyên.</p>
    </div>}
    {error && <p role="alert" className="form-error">{error}</p>}
  </div>;
}
