import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, MapPin } from 'lucide-react';
import { checkoutService } from '@/services/client/checkoutService';
import { isGoogleMapsLink, parseMapLocation } from '@/lib/deliveryLocation';
import { errorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';

export function CheckoutDeliveryLocation({ address, value, onChange }) {
  const [results, setResults] = useState([]), [busy, setBusy] = useState(false), [error, setError] = useState(''), [link, setLink] = useState('');
  const callback = useRef(onChange); callback.current = onChange;
  const owner = useRef(address); owner.current = address;
  useEffect(() => {
    let active = true;
    callback.current(null); setResults([]); setError(''); setLink('');
    if (!address) { setBusy(false); return; }
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        const items = await checkoutService.deliveryLocations(address);
        if (!active) return;
        setResults(items);
        const precise = items.filter(item => item.precise);
        if (precise.length === 1) callback.current({ ...precise[0], address });
        else if (!items.length) setError('Chưa tìm được số nhà này. Bạn kiểm tra lại địa chỉ hoặc dùng liên kết Google Maps bên dưới.');
      } catch (failure) { if (active) setError(errorMessage(failure)); }
      finally { if (active) setBusy(false); }
    }, 1000);
    return () => { active = false; clearTimeout(timer); };
  }, [address]);
  async function useLink() {
    if (busy) return;
    const selectedAddress = address;
    const point = parseMapLocation(link);
    if (point) { onChange({ ...point, address }); setError(''); return; }
    if (!isGoogleMapsLink(link)) { setError('Dán liên kết chia sẻ Google Maps hoặc tọa độ của điểm nhận.'); return; }
    setBusy(true); setError('');
    try {
      const result = await checkoutService.deliveryLocationFromMap(link.trim());
      if (owner.current === selectedAddress) onChange({ ...result, address: selectedAddress });
    } catch (failure) { if (owner.current === selectedAddress) setError(errorMessage(failure)); }
    finally { if (owner.current === selectedAddress) setBusy(false); }
  }
  if (!address) return null;
  const selected = value?.address === address;
  return <div className="!mt-4 space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs">
    <p role="status" className="flex items-center gap-2 text-emerald-900">{selected ? <CheckCircle2 size={16} /> : <MapPin size={16} />}{selected ? 'Đã xác định vị trí nhận hàng. Cửa hàng sẽ dùng vị trí này để tính giờ giao dự kiến.' : busy ? 'Đang tự xác định vị trí từ địa chỉ nhận hàng…' : 'Bạn chọn đúng vị trí nhận hàng trong các gợi ý bên dưới.'}</p>
    {!selected && !busy && results.length > 0 && <ul className="divide-y divide-emerald-100 rounded-lg bg-white">{results.map((item, index) => <li key={index}><button type="button" className="w-full p-3 text-left leading-6 hover:bg-emerald-50" onClick={() => { onChange({ ...item, address }); setError(''); }}>{item.label}</button></li>)}</ul>}
    {selected && <a className="inline-flex underline" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${value.latitude},${value.longitude}`}>Xem vị trí nhận trên bản đồ</a>}
    {error && <p role="alert" className="leading-6 text-amber-800">{error}</p>}
    <details><summary className="cursor-pointer font-medium text-emerald-900">{selected ? 'Điều chỉnh vị trí bằng Google Maps' : 'Dùng vị trí đã ghim trên Google Maps'}</summary><div className="!mt-3 flex flex-wrap gap-2"><Input aria-label="Liên kết Google Maps của điểm nhận" placeholder="Dán liên kết Google Maps hoặc tọa độ…" maxLength={3000} value={link} disabled={busy} onChange={event => setLink(event.target.value)} /><Button size="sm" variant="outline" disabled={busy} onClick={useLink}>Xác nhận vị trí nhận</Button></div></details>
  </div>;
}
