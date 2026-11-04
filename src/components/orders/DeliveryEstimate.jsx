import { Clock3, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { orderDateTime } from '@/lib/customerOrders';
import { deliveryCountdown, deliveryDeadline, deliveryEstimateText, hasRouteEstimate } from '@/lib/deliveryEstimate';

function DeliveryCountdown({ arrivalAt }) {
  const [now, setNow] = useState(Date.now);
  const deadline = deliveryDeadline(arrivalAt);
  const remaining = deliveryCountdown(deadline, now);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = setInterval(update, 1000);
    document.addEventListener('visibilitychange', update);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, [arrivalAt]);
  if (!remaining) return null;
  return <div className="!mt-3 rounded-xl bg-white/80 p-3">
    <p className="text-xs text-stone-500">{remaining.seconds > 0 ? 'Thời gian còn lại dự kiến' : 'Đã đến giờ giao dự kiến'}</p>
    {remaining.seconds > 0 ? <p className="!mt-1 font-mono text-3xl font-semibold tabular-nums text-emerald-900" aria-label={`Còn ${remaining.seconds} giây`}>{remaining.text}</p>
      : <p className="!mt-2 text-sm font-medium text-amber-800" role="status">Đang chờ nhân viên xác nhận kết quả giao hàng.</p>}
  </div>;
}

export function DeliveryEstimate({ shipment }) {
  if (!shipment || ['delivered', 'failed', 'returned', 'cancelled'].includes(shipment.status)) return null;
  const estimated = hasRouteEstimate(shipment);
  const minutes = shipment.routeDurationSeconds == null ? null : Math.ceil(shipment.routeDurationSeconds / 60);
  return <section className="!mt-4 space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-primary"><strong className="flex items-center gap-2"><Clock3 size={17} />{estimated ? `Dự kiến đến: ${orderDateTime(shipment.estimatedArrivalAt)}` : deliveryEstimateText(shipment)}</strong>
    {estimated && <><DeliveryCountdown arrivalAt={shipment.estimatedArrivalAt} /><p className="flex flex-wrap items-center gap-2 text-xs"><MapPin size={14} />{(Number(shipment.routeDistanceMeters) / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km · Khoảng {minutes} phút di chuyển</p><p className="text-[11px] leading-5 text-stone-500">Ước tính theo tuyến ô tô từ cửa hàng đến điểm nhận; chưa tính trung chuyển, giao thông trực tiếp hoặc các điểm dừng khác.</p><p className="text-[10px] text-stone-500">Dữ liệu tuyến đường: OpenRouteService · OpenStreetMap contributors.</p></>}
  </section>;
}
