import { CalendarDays } from 'lucide-react';
import { dateText } from '@/lib/apiData';

export function SaleExpiry({ date, label = 'Hạn sử dụng', className = '' }) {
  return date ? <span className={`!my-2 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950 ${className}`}>
    <CalendarDays size={15} aria-hidden="true" />{label}: {dateText(date)}
  </span> : null;
}

export function SaleOfferNotice({ choices = [], selected, loading, error }) {
  if (error) return <p role="alert" className="!my-3 text-xs text-amber-900">Chưa kiểm tra được lượng hàng hiện có. Vui lòng thử lại trước khi thêm hàng.</p>;
  if (loading && !choices.length) return <p role="status" className="!my-3 text-xs text-stone-500">Đang kiểm tra hàng hiện có…</p>;
  if (selected?.promotionId && !selected.combo) return <div className="!my-3">
    <SaleExpiry date={selected.expiryDate} />
    <p className="text-xs leading-5 text-stone-600">Giá ưu đãi áp dụng cho lượng hàng có hạn sử dụng trên.</p>
  </div>;
  if (selected?.nearestExpiryDate) return <div className="!my-3">
    <SaleExpiry date={selected.nearestExpiryDate} />
  </div>;
  if (!selected && choices.some(option => option.combo)) return <p className="!my-3 text-xs text-primary">Quy cách này hiện chỉ có trong combo. Xem chương trình mua kèm bên dưới.</p>;
  return null;
}
