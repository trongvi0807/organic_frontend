import { useEffect, useId, useRef, useState } from 'react';
import { CheckCircle2, LoaderCircle, LocateFixed, MapPin, Search } from 'lucide-react';
import { Field, Input, Select } from '@/components/ui/field';
import { exactAddress, searchAddresses } from '@/lib/address';
import { addressAtCoordinates } from '@/services/client/addressService';

export function AddressForm({ data, value, onChange, disabled }) {
  const id = useId(), root = useRef(null), revision = useRef(0);
  const [query, setQuery] = useState(value.search || ''), [open, setOpen] = useState(false), [active, setActive] = useState(-1);
  const [locating, setLocating] = useState(false), [feedback, setFeedback] = useState(''), [failure, setFailure] = useState(false);
  const suggestions = data ? searchAddresses(data, query) : [];
  const wards = data?.wards.filter((w) => w.provinceCode === value.provinceCode) || [];
  const choose = (ward) => { revision.current++; onChange({ ...value, provinceCode: ward.provinceCode, wardCode: ward.code, search: ward.title }); setQuery(ward.title); setOpen(false); setActive(-1); setFailure(false); setFeedback('Đã chọn địa chỉ. Vui lòng kiểm tra lại Xã / Phường và bổ sung số nhà.'); };
  useEffect(() => { setQuery(value.search || ''); }, [value.search]);
  useEffect(() => {
    if (!data || !open || query.length < 3) return;
    const timeout = setTimeout(() => { const match = exactAddress(data, query); if (match) { onChange({ ...value, provinceCode: match.provinceCode, wardCode: match.code }); } }, 400);
    return () => clearTimeout(timeout);
  }, [query, open, data]);
  useEffect(() => { const close = (e) => { if (!root.current?.contains(e.target)) setOpen(false); }; document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close); }, []);
  useEffect(() => () => { revision.current++; }, []);
  function patch(next) { revision.current++; onChange({ ...value, ...next }); setFeedback(''); }
  async function locate() {
    if (locating) return;
    setFeedback(''); setFailure(false);
    if (!window.isSecureContext || !navigator.geolocation) { setFailure(true); setFeedback('Trình duyệt cần HTTPS hoặc localhost và quyền truy cập vị trí. Bạn vẫn có thể chọn địa chỉ thủ công.'); return; }
    const request = ++revision.current; setLocating(true);
    try {
      const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }));
      if (position.coords.accuracy > 1500) throw new Error('Vị trí chưa đủ chính xác. Vui lòng chọn Tỉnh và Xã thủ công.');
      const ward = await addressAtCoordinates(position.coords.latitude, position.coords.longitude);
      if (request === revision.current) choose(ward);
    } catch (e) {
      if (request === revision.current) { setFailure(true); setFeedback(e.code === 1 ? 'Bạn chưa cho phép truy cập vị trí. Hãy chọn địa chỉ thủ công hoặc cấp quyền rồi thử lại.' : e.code === 3 ? 'Định vị quá thời gian. Vui lòng thử lại hoặc chọn thủ công.' : e.message || 'Chưa lấy được vị trí. Vui lòng chọn địa chỉ thủ công.'); }
    } finally { setLocating(false); }
  }
  return <div className="space-y-4">
    <div ref={root} className="relative"><label htmlFor={`${id}-search`} className="!mb-2 block text-xs font-medium">Tìm nhanh địa chỉ</label><div className="relative"><Search size={16} className="absolute left-3.5 top-3.5 text-stone-400" /><Input id={`${id}-search`} role="combobox" aria-autocomplete="list" aria-expanded={open && !!query} aria-controls={`${id}-results`} aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined} autoComplete="off" placeholder="Ví dụ: Bến Nghé, Hồ Chí Minh hoặc Quận 1" className="!pl-10 !text-sm" value={query} disabled={disabled || !data} onFocus={() => setOpen(true)} onChange={(e) => { revision.current++; setQuery(e.target.value); setOpen(true); setActive(-1); }} onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, suggestions.length - 1)); } if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); } if (e.key === 'Enter' && open) { e.preventDefault(); if (suggestions[active]) choose(suggestions[active]); } }} /></div>
      {open && query.length >= 2 && <ul id={`${id}-results`} role="listbox" aria-label="Gợi ý địa chỉ hiện hành" className="absolute z-20 !mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-line bg-white p-1.5 shadow-lg">{suggestions.length ? suggestions.map((ward, i) => <li id={`${id}-${i}`} role="option" aria-selected={i === active} key={ward.code}><button type="button" tabIndex={-1} onClick={() => choose(ward)} className={`flex w-full gap-2 rounded-lg p-3 text-left !text-xs leading-5 hover:bg-sage ${i === active ? 'bg-sage' : ''}`}><MapPin size={15} className="!mt-0.5 shrink-0 text-[#78935b]" /><span><strong className="font-medium">{ward.name}</strong><small className="block text-stone-500">{ward.province.name}</small></span></button></li>) : <li className="p-3 text-xs leading-6 text-stone-500">Chưa tìm thấy. Thử tên Tỉnh / Thành phố đầy đủ hoặc chọn bên dưới.</li>}</ul>}
    </div>
    <button type="button" onClick={locate} disabled={locating || disabled || !data} className="flex min-h-10 items-center gap-2 rounded-lg text-xs font-medium text-primary hover:underline">{locating ? <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" /> : <LocateFixed size={16} />} {locating ? 'Đang xác định địa chỉ…' : 'Sử dụng vị trí hiện tại'}</button>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Tỉnh / Thành phố *"><Select required autoComplete="address-level1" aria-label="Tỉnh / Thành phố" value={value.provinceCode} disabled={disabled || !data} onChange={(e) => { patch({ provinceCode: e.target.value, wardCode: '', search: '' }); setQuery(''); }}><option value="">Chọn Tỉnh / Thành phố</option>{data?.provinces.map((p) => <option value={p.code} key={p.code}>{p.name}</option>)}</Select></Field><Field label="Xã / Phường / Thị trấn *"><Select required aria-label="Xã / Phường / Thị trấn" value={value.wardCode} disabled={disabled || !value.provinceCode} onChange={(e) => { patch({ wardCode: e.target.value, search: '' }); setQuery(''); }}><option value="">Chọn Xã / Phường</option>{wards.map((w) => <option value={w.code} key={w.code}>{w.name}</option>)}</Select></Field></div>
    <Field label="Số nhà, tên đường, thôn, xóm, tòa nhà *"><Input required autoComplete="address-line1" maxLength={350} placeholder="Ví dụ: 36 Trịnh Đình Trọng" value={value.street} disabled={disabled} onChange={(e) => patch({ street: e.target.value })} /></Field>
    {feedback && <p role={failure ? 'alert' : 'status'} className={`flex gap-2 text-xs leading-6 ${failure ? 'text-amber-800' : 'text-primary'}`}>{!failure && <CheckCircle2 size={15} className="!mt-1 shrink-0" />}{feedback}</p>}
    <p className="text-[10px] leading-5 text-stone-400">Dữ liệu: <a className="underline" href="https://tinhthanhpho.com/api-docs" target="_blank" rel="noreferrer">tinhthanhpho.com</a> · CC BY 4.0. Tên cũ chỉ dùng gợi ý; địa chỉ gửi theo Tỉnh và Xã hiện hành. GPS được xử lý trên thiết bị, không gửi tọa độ đến nhà cung cấp dữ liệu.</p>
  </div>;
}
