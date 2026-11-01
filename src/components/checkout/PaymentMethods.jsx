import { paymentNames } from '@/lib/checkout';
import { PaymentBrand } from './PaymentBrand';

function paymentDescription(key, fulfillment) {
  if (key === 'cod') return fulfillment === 'pickup' ? 'Thanh toán khi đến nhận hàng theo lịch đã xác nhận' : 'Thanh toán khi nhận được hàng';
  if (key === 'payos') return 'Quét VietQR trên payOS · Tự cập nhật khi nhận đủ tiền';
  if (key === 'vnpay') return 'Thanh toán qua ngân hàng / ví trên VNPay';
  return 'Xác nhận giao dịch tại cổng thanh toán bảo mật';
}

export function PaymentMethods({ methods, value, onChange, disabled, fulfillment }) {
  return <fieldset disabled={disabled} aria-label="Chọn phương thức thanh toán">
    <div className="divide-y divide-line">{Object.entries(paymentNames).map(([key, label]) => <label key={key} className={`flex min-h-20 cursor-pointer items-center gap-3 px-1 py-4 text-xs ${!methods[key] ? 'opacity-45' : ''}`}>
      <PaymentBrand gateway={key} className={value === key ? 'border-emerald-300 ring-2 ring-emerald-50' : ''} />
      <span className="min-w-0 flex-1"><strong className="block text-xs font-semibold leading-5">{key === 'cod' && fulfillment === 'pickup' ? 'Thanh toán tại cửa hàng' : label}</strong><small className="!mt-1 block text-[10px] leading-5 text-stone-500">{!methods[key] ? 'Hiện chưa khả dụng' : paymentDescription(key, fulfillment)}</small></span>
      <input type="radio" name="payment-method" required value={key} checked={value === key} disabled={!methods[key]} onChange={() => onChange(key)} className="size-4 shrink-0 accent-primary" />
    </label>)}</div>
  </fieldset>;
}
