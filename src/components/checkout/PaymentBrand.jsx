import { Banknote, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const logos = { vnpay: '/images/payments/vnpay.png', stripe: '/images/payments/stripe.svg', paypal: '/images/payments/paypal.png', payos: '/images/payments/vietqr.png' };

export function PaymentBrand({ gateway, className }) {
  const logo = logos[gateway], Icon = gateway === 'cod' ? Banknote : CreditCard;
  return <span aria-hidden="true" className={cn('inline-flex h-14 w-20 shrink-0 items-center justify-center rounded-lg border border-line bg-white p-1.5', className)}>
    {logo ? <img src={logo} alt="" width={80} height={56} className="block max-h-full max-w-full object-contain" /> : <Icon size={23} className="text-primary" />}
  </span>;
}
