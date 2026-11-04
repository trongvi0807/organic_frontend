import { CreditCard, PackageCheck, PackageOpen, Truck } from 'lucide-react';

export const orderNeedsPreparation = order => order.paymentMethod !== 'exchange' && ['confirmed', 'paid'].includes(order.status) && (order.paymentMethod === 'cod' || order.paymentStatus === 'paid');
export function matchesOrderWorklist(order, worklist) {
  if (worklist === 'ready') return orderNeedsPreparation(order);
  if (worklist === 'all') return true;
  return order.status === worklist && order.paymentMethod !== 'exchange';
}

const cards = [
  { id: 'ready', label: 'Cần chuẩn bị hàng', Icon: PackageCheck, color: 'border-amber-200 bg-amber-50 text-amber-900' },
  { id: 'preparing', label: 'Đang chuẩn bị / Chờ giao', Icon: PackageOpen, color: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
  { id: 'shipping', label: 'Đang giao hàng', Icon: Truck, color: 'border-blue-200 bg-blue-50 text-blue-900' },
  { id: 'pending_payment', label: 'Khách chưa thanh toán', Icon: CreditCard, color: 'border-slate-200 bg-slate-50 text-slate-700' },
];

export function OrderAttentionPanel({ orders, value, onChange }) {
  return <section aria-label="Công việc đơn hàng" className="!mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
    {cards.map(({ id, label, Icon, color }) => {
      const count = orders.filter(order => matchesOrderWorklist(order, id)).length;
      return <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(value === id ? 'all' : id)}
        className={`flex min-h-28 flex-col items-start justify-between gap-3 rounded-2xl border p-4 text-left transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${color} ${value === id ? 'ring-2 ring-emerald-700 ring-offset-2' : ''}`}>
        <span className="flex w-full items-center justify-between gap-2 text-xs font-medium"><span>{label}</span><Icon size={19} aria-hidden="true" /></span>
        <strong className="text-2xl tabular-nums">{count}<span className="ml-2 text-xs font-normal">đơn</span></strong>
        {id === 'pending_payment' && <span className="text-[10px]">Chưa chuẩn bị hoặc giao hàng</span>}
      </button>;
    })}
  </section>;
}
