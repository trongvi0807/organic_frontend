import { CalendarDays } from 'lucide-react';
import { dateText } from '@/lib/apiData';
import { currency } from '@/lib/utils';

export function SaleExpiry({ date, className = '' }) {
  return date ? <span className={`!my-2 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950 ${className}`}>
    <CalendarDays size={15} aria-hidden="true" />Hạn sử dụng: {dateText(date)}
  </span> : null;
}

export function SaleOptionPicker({ choices, selected, onChange, loading, error }) {
  return <fieldset className="!my-4 min-w-0 space-y-2"><legend className="!mb-2 text-sm font-semibold">Chọn hạn sử dụng</legend>
    {loading && !choices.length && <p role="status" className="text-xs text-stone-500">Đang kiểm tra hàng hiện có…</p>}
    {error && <p role="alert" className="text-xs text-amber-900">Chưa kiểm tra được hạn sử dụng. Vui lòng thử lại trước khi thêm hàng.</p>}
    {choices.map(option => <label key={option.selectionKey} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 ${selected?.selectionKey === option.selectionKey ? 'border-primary bg-sage' : 'border-line bg-white'}`}>
      <input type="radio" name={`expiry-${option.variantId}`} checked={selected?.selectionKey === option.selectionKey} onChange={() => onChange(option.selectionKey)} className="shrink-0 accent-primary" />
      <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2"><span><strong className="text-sm text-primary">{currency(option.price)}</strong>{option.price < option.regularPrice && <del className="!ml-2 text-xs text-stone-500">{currency(option.regularPrice)}</del>}<SaleExpiry date={option.expiryDate} />{option.combo && <small className="block text-xs text-primary">Thuộc combo “{option.promotionName}” · Cần mua đủ bộ để nhận giảm giá</small>}</span><small className="text-xs text-stone-500">Còn {option.availableQuantity}</small></span>
    </label>)}
    {!loading && !error && !choices.length && <p className="text-xs text-stone-500">Quy cách này hiện chưa có hàng có thể đặt.</p>}
    {!!choices.length && !selected && <p role="alert" className="text-xs text-amber-900">Lựa chọn trước đã hết hàng hoặc ngừng bán. Vui lòng chọn lại hạn sử dụng.</p>}
  </fieldset>;
}
