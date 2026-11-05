import { useEffect, useRef, useState } from 'react';
import { RefreshCw, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useShop } from '@/contexts/ShopContext';
import { canPurchase, cartItemKey, selectedCartItems } from '@/lib/cart';
import { CartItem } from '@/components/cart/CartItem';
import { OrderSummary } from '@/components/cart/OrderSummary';
import { EmptyCart } from '@/components/cart/EmptyCart';
import { ClearCartDialog } from '@/components/cart/ClearCartDialog';
import { ResourceState } from '@/components/common/ResourceState';
import { PurchaseFrame, purchasePanel } from '@/components/checkout/PurchaseFrame';
import { DEMO_MODE } from '@/services/api';

export default function CartPage() {
  const { cart, setAllSelected, clearCart, cartLoading, cartBusy, cartError, cartMeta, cartAllowed, refreshCart } = useShop();
  const [confirmOpen, setConfirmOpen] = useState(false), selectAllRef = useRef(null);
  const selectedCount = selectedCartItems(cart).length, eligibleCount = cart.filter(canPurchase).length;
  const allSelected = eligibleCount > 0 && selectedCount === eligibleCount;
  useEffect(() => { if (selectAllRef.current) selectAllRef.current.indeterminate = selectedCount > 0 && !allSelected; }, [selectedCount, allSelected]);
  return <PurchaseFrame title="Giỏ hàng của bạn" description="Những lựa chọn tươi lành, sẵn sàng đến bên bạn.">
    {!cartAllowed && <p role="status" className="!mb-5 rounded-xl bg-sage p-4 text-sm">Giỏ hàng dành cho khách hàng. Vui lòng dùng tài khoản khách hoặc đăng xuất để mua với giỏ khách.</p>}
    <ResourceState loading={cartLoading && !cart.length} error={cartError} onRetry={() => refreshCart().catch(() => {})} />
    {cartMeta?.mergeStatus?.startsWith('PENDING_') && <p role="alert" className="!mb-5 rounded-xl bg-amber-50 p-4 text-xs leading-6">Chưa gộp được giỏ khách vì vượt giới hạn. Giảm số lượng hoặc xóa dòng trong giỏ tài khoản rồi tải lại. Hai giỏ vẫn được giữ nguyên.</p>}
    {!cartError && !cartLoading && cartAllowed && cart.length === 0 ? <EmptyCart /> : !!cart.length && <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_370px]" aria-busy={cartBusy}>
      <section aria-label="Sản phẩm trong giỏ hàng" className="min-w-0"><div className={purchasePanel}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 sm:px-6"><label className="flex min-h-10 cursor-pointer items-center gap-3 text-xs font-medium"><input ref={selectAllRef} type="checkbox" className="size-[18px] cursor-pointer accent-primary" checked={allSelected} disabled={!eligibleCount || cartBusy} onChange={(e) => setAllSelected(e.target.checked)} />Chọn tất cả <span className="font-normal text-stone-400">({selectedCount}/{cart.length})</span></label><div className="flex items-center gap-2">{!DEMO_MODE && <button type="button" aria-label="Tải lại giỏ hàng" title="Tải lại giỏ hàng" disabled={cartLoading || cartBusy} onClick={() => refreshCart().catch(() => {})} className="grid size-9 place-items-center rounded-lg text-stone-400 hover:bg-sage"><RefreshCw size={15} className={cartLoading ? 'animate-spin' : ''} /></button>}<button type="button" disabled={cartBusy} onClick={() => setConfirmOpen(true)} className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs text-stone-500 hover:bg-red-50 hover:text-red-700"><Trash2 size={14} />Xóa tất cả</button></div></div>
        <ul>{cart.map((item) => <CartItem key={cartItemKey(item)} item={item} />)}</ul>
      </div><div className="!mt-4 flex items-start gap-2 px-1 text-[11px] leading-6 text-stone-500"><ShoppingBag size={16} className="!mt-1 shrink-0 text-[#7d9565]" /><p>Chọn những sản phẩm bạn muốn mua. Các sản phẩm chưa chọn vẫn được giữ trong giỏ.</p></div></section>
      <OrderSummary />
    </div>}
    <ClearCartDialog open={confirmOpen} busy={cartBusy} onOpenChange={setConfirmOpen} onConfirm={async () => { const success = await clearCart(); if (success) { setConfirmOpen(false); if (DEMO_MODE) toast.success('Đã xóa toàn bộ giỏ hàng.'); } }} />
  </PurchaseFrame>;
}
