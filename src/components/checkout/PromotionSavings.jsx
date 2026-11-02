import { currency } from '@/lib/utils';

export function promotionSavings(quote) {
  if (quote?.publicPromotionDiscount == null && quote?.voucherDiscount == null)
    return [['Khuyến mãi / voucher', quote?.promotionDiscount, quote?.promotionCode]];
  const rows = [['Mã khuyến mãi', quote.publicPromotionDiscount, quote.promotionCode]];
  if (quote.voucherCode || Number(quote.voucherDiscount) > 0) rows.push(['Voucher đổi điểm', quote.voucherDiscount, quote.voucherCode]);
  return rows;
}

export function PromotionSavings({ quote }) {
  return promotionSavings(quote).map(([label, amount, code]) => <div key={label} className="flex justify-between gap-3">
    <dt className="text-stone-500">{label}{code && <small className="!mt-1 block max-w-48 break-words text-[10px] text-[#819168]">{code}</small>}</dt>
    <dd className="whitespace-nowrap font-medium text-primary">{quote ? currency(-Math.abs(Number(amount || 0))) : '—'}</dd>
  </div>);
}
