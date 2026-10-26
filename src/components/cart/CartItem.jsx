import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useShop } from '@/contexts/ShopContext';
import { canPurchase, cartItemKey, parseCartQuantity, quantityLimit } from '@/lib/cart';
import { productHref } from '@/lib/productDetail';
import { currency } from '@/lib/utils';

export function CartItem({ item }) {
  const { setItemSelected, updateQuantity, setQuantity, removeFromCart, cartBusy } = useShop();
  const key = cartItemKey(item), available = canPurchase(item), limit = quantityLimit(item);
  const [draft, setDraft] = useState(String(item.quantity)), [error, setError] = useState('');
  useEffect(() => { setDraft(String(item.quantity)); setError(''); }, [item.quantity]);
  const invalid = (message) => { setError(message); toast.error(message, { position: 'top-left', id: 'cart-quantity' }); };
  async function commit() {
    try {
      const quantity = parseCartQuantity(draft, limit); setError('');
      if (quantity !== item.quantity) { const ok = await setQuantity(key, quantity); if (ok === false) { setDraft(String(item.quantity)); return; } }
      setDraft(String(quantity));
    } catch (e) { invalid(e.message); setDraft(String(item.quantity)); }
  }
  const actionClass = 'flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-sage disabled:opacity-35';
  return <li className="grid grid-cols-[18px_minmax(0,1fr)] gap-3 border-b border-line px-4 py-5 last:border-0 sm:gap-4 sm:px-6 sm:py-6">
    <input type="checkbox" checked={item.selected !== false && available} disabled={!available || cartBusy} onChange={(e) => setItemSelected(key, e.target.checked)} aria-label={`Chọn ${item.productName}, ${item.unit || ''}`} className="!mt-8 size-[18px] cursor-pointer rounded accent-primary" />
    <div className="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] gap-3 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-4">
      <Link to={productHref(item)} className="group block aspect-square overflow-hidden rounded-xl border border-line bg-cream"><img src={item.imageUrl || '/images/vegetables.jpg'} alt={item.productName} loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/vegetables.jpg'; }} className="size-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105" /></Link>
      <div className="min-w-0"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h2 className="text-sm font-semibold leading-6"><Link to={productHref(item)} className="break-words hover:!text-primary">{item.productName}</Link></h2><p className="!mt-1 text-xs text-stone-500">Phân loại: {item.unit || 'Tiêu chuẩn'}</p></div><button type="button" disabled={cartBusy} className="-mr-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-700" onClick={() => removeFromCart(key)} aria-label={`Xóa ${item.productName} khỏi giỏ`}><Trash2 size={17} /></button></div>
        {item.organicVerified && <span className="!mt-2 inline-flex items-center gap-1 text-[10px] text-[#69814e]"><Leaf size={11} /> Có chứng nhận hợp lệ</span>}
        <p className={`!mt-2 text-[11px] leading-5 ${item.availableQuantity === 0 ? 'text-amber-800' : 'text-stone-500'}`}>{Number.isInteger(item.availableQuantity) ? item.availableQuantity === 0 ? 'Hiện hết hàng' : `Có thể đặt: ${item.availableQuantity.toLocaleString('vi-VN')} ${item.unit || 'gói/hộp'}` : 'Số lượng có thể đặt sẽ được kiểm tra khi thanh toán.'}</p>
        <div className="!mt-3 flex flex-wrap items-center justify-between gap-3"><div><strong className="text-sm font-semibold tabular-nums text-primary">{currency(item.minPrice)}</strong>{item.quantity > 1 && <p className="!mt-0.5 text-[10px] text-stone-500">Thành tiền: {currency(item.minPrice * item.quantity)}</p>}</div>
          <div className="inline-flex h-9 items-center rounded-lg border border-line bg-white" role="group" aria-label={`Số lượng ${item.productName}`}><button type="button" className={actionClass} disabled={cartBusy || item.quantity <= 1 || limit === 0} onClick={() => updateQuantity(key, -1)} aria-label={`Giảm số lượng ${item.productName}`}><Minus size={13} /></button><input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={5} value={draft} disabled={cartBusy || limit === 0} aria-label={`Nhập số lượng ${item.productName}`} aria-invalid={!!error} aria-describedby={error ? `quantity-${item.variantId || item.id}` : undefined} className={`h-8 w-10 min-w-0 border-0 bg-transparent text-center !text-xs tabular-nums ${error ? 'text-red-700' : ''}`} onChange={(e) => { setDraft(e.target.value); setError(''); if (e.target.value && (!/^\d+$/.test(e.target.value) || Number(e.target.value) < 1)) invalid('Số lượng phải là số nguyên lớn hơn 0.'); }} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }} /><button type="button" className={actionClass} disabled={cartBusy || item.quantity >= limit} onClick={() => updateQuantity(key, 1)} aria-label={`Tăng số lượng ${item.productName}`}><Plus size={13} /></button></div>
        </div>
        {error && <p id={`quantity-${item.variantId || item.id}`} role="alert" className="!mt-2 text-[11px] text-red-700">{error}</p>}
        {!available && <p className="!mt-2 text-xs text-amber-800">{item.unavailableMessage || 'Sản phẩm hiện chưa thể thanh toán. Vui lòng kiểm tra lại số lượng.'}</p>}
      </div>
    </div>
  </li>;
}
