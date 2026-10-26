import { useState } from 'react';
import { Check, Tag, X } from 'lucide-react';
import { useShop } from '@/contexts/ShopContext';
import { cartTotals, PREVIEW_PROMOTIONS } from '@/lib/cart';

export function PromoCode({ totals }) {
  const { cart, promoCode, setPromoCode } = useShop();
  const [draft, setDraft] = useState(promoCode);
  const [error, setError] = useState('');
  const message = error || totals.promoError;
  function apply(event) {
    event.preventDefault();
    const code = draft.trim().toUpperCase();
    if (!code) { setError('Vui lòng nhập mã ưu đãi.'); return; }
    const result = cartTotals(cart, code);
    setError(result.promoError);
    setPromoCode(result.promoError ? '' : code);
    setDraft(code);
  }
  return <div className="border-b border-line pb-6">
    <form onSubmit={apply} noValidate>
      <label htmlFor="cart-promo" className="!mb-3 flex items-center gap-2 text-sm font-medium"><Tag size={16} /> Mã ưu đãi</label>
      <div className="flex gap-2">
        <input id="cart-promo" value={draft} maxLength={32} onChange={(event) => { setDraft(event.target.value); setError(''); }}
          autoComplete="off" spellCheck={false} placeholder="Nhập mã của bạn" aria-invalid={Boolean(message)} aria-describedby={message ? 'promo-feedback' : 'promo-hint'}
          className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-3 !text-sm placeholder:text-stone-400 focus:border-primary" />
        <button type="submit" className="shrink-0 rounded-xl bg-sage px-4 !text-xs !font-semibold text-primary transition-colors hover:bg-[#dfe8d7]">Áp dụng</button>
      </div>
    </form>
    <div aria-live="polite" aria-atomic="true">
      {message && <p id="promo-feedback" className="!mt-3 text-xs leading-relaxed text-red-800">{message}</p>}
      {promoCode && <div className="!mt-3 flex items-center justify-between gap-2 rounded-xl bg-sage px-3 py-2 text-xs text-primary"><span className="flex items-center gap-1.5">{totals.offer && <Check size={14} />} {totals.offer ? 'Đã áp dụng' : 'Mã đang giữ'} {promoCode}</span><button type="button" className="flex size-8 items-center justify-center rounded-full hover:bg-white" aria-label="Gỡ mã ưu đãi" onClick={() => { setPromoCode(''); setDraft(''); setError(''); }}><X size={14} /></button></div>}
    </div>
    <details className="!mt-3 text-xs text-stone-500">
      <summary id="promo-hint" className="cursor-pointer py-1">Mã ưu đãi dùng thử</summary>
      <ul className="!mt-2 space-y-3 leading-relaxed">{PREVIEW_PROMOTIONS.map((offer) => <li key={offer.code}><button type="button" onClick={() => { setDraft(offer.code); setError(''); }} className="!mr-1 rounded border border-dashed border-[#a9b89b] px-2 py-1 font-semibold text-primary hover:bg-sage">{offer.code}</button> {offer.description}.</li>)}</ul>
      <p className="!mt-3">Các mã dùng thử chỉ dùng để xem trước, chưa áp dụng cho đơn hàng thật.</p>
    </details>
  </div>;
}
