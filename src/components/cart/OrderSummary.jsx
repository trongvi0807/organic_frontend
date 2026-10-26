import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, ShieldCheck } from 'lucide-react';
import { useShop } from '@/contexts/ShopContext';
import { useAuth } from '@/contexts/AuthContext';
import { useResource } from '@/hooks/useResource';
import { hasRole } from '@/lib/permissions';
import { cartTotals } from '@/lib/cart';
import { checkoutPayload } from '@/lib/checkout';
import { checkoutService } from '@/services/client/checkoutService';
import { createProfileService } from '@/services/client/profileService';
import { currency, errorMessage } from '@/lib/utils';
import { VoucherPicker } from '@/components/checkout/VoucherPicker';
import { purchaseButton, purchasePanel } from '@/components/checkout/PurchaseFrame';
import { DEMO_MODE } from '@/services/api';
import { RewardRedemption } from './RewardRedemption';
import { validateRewardPoints } from '@/lib/rewardPoints';

export function OrderSummary() {
  const { cart, promoCode, setPromoCode, rewardPoints, setRewardPoints, cartBusy, cartLoading, cartError } = useShop();
  const { user } = useAuth(), customer = hasRole(user, 'CUSTOMER');
  const totals = cartTotals(cart, DEMO_MODE ? promoCode : '');
  const [quoted, setQuoted] = useState(null), [error, setError] = useState(''), [checking, setChecking] = useState(false);
  const resources = useResource(async () => {
    if (!customer || DEMO_MODE) return { promotions: [], profile: null };
    const [promotions, profile] = await Promise.allSettled([checkoutService.promotions({ size: 20 }), createProfileService().get()]);
    return { promotions: promotions.status === 'fulfilled' ? promotions.value.items : [], profile: profile.status === 'fulfilled' ? profile.value : null };
  }, [user?.username]);
  const reward = useResource(() => customer && !DEMO_MODE ? checkoutService.rewards() : Promise.resolve(null), [user?.username]);
  let pointError = '';
  try { validateRewardPoints(rewardPoints, reward.data); } catch (e) { pointError = e.message; }
  function payload(code, points = rewardPoints) {
    const p = resources.data?.profile, a = p?.addresses?.find((a) => a.isDefault);
    if (!a) return null;
    try { return checkoutPayload({ receiverName: a.receiverName || p.fullName, receiverPhone: a.receiverPhone || p.phoneNumber, shippingAddress: [a.streetAddress, a.ward, a.province].filter(Boolean).join(', '), paymentMethod: 'cod', note: '', points: validateRewardPoints(points,reward.data), promotionCode: code }, totals.selected); } catch { return null; }
  }
  const signature = JSON.stringify({ rows: totals.selected.map(({ variantId, quantity, minPrice }) => [variantId, quantity, minPrice]), promoCode, rewardPoints, profile: resources.data?.profile?.id });
  useEffect(() => {
    let active = true; setQuoted(null); setError('');
    const body = payload(promoCode);
    if (DEMO_MODE || !customer || !body || !totals.selected.length || cartBusy || cartError) return;
    setChecking(true);
    const timer = setTimeout(() => checkoutService.preview(body).then((value) => { if (active) setQuoted({ signature, value }); }).catch((e) => { if (active) setError(errorMessage(e)); }).finally(() => { if (active) setChecking(false); }), 350);
    return () => { active = false; clearTimeout(timer); setChecking(false); };
  }, [signature, customer, cartBusy, cartError, resources.data, reward.data]);
  const quote = quoted?.signature === signature ? quoted.value : null;
  const discount = DEMO_MODE ? totals.discount : quote?.promotionDiscount || 0;
  const total = DEMO_MODE ? totals.total : quote?.totalAmount ?? totals.subtotal;
  const blocked = !totals.selected.length || cartBusy || cartLoading || !!cartError || !!pointError;
  async function apply(code) {
    if (DEMO_MODE) { const result = cartTotals(cart, code); if (result.promoError) throw new Error(result.promoError); }
    else { const body = payload(code); if (body && totals.selected.length) { const value = await checkoutService.preview(body); setQuoted({ signature: JSON.stringify({ rows: totals.selected.map(({ variantId, quantity, minPrice }) => [variantId, quantity, minPrice]), promoCode: code, rewardPoints, profile: resources.data?.profile?.id }), value }); } }
    setPromoCode(code); setError('');
  }
  async function applyPoints(amount) {
    const body = payload(promoCode, amount);
    if (body && totals.selected.length) await checkoutService.preview(body);
    setRewardPoints(amount); setError('');
  }
  return <><aside aria-label="Thông tin đơn hàng" className={`${purchasePanel} p-5 sm:p-6 lg:sticky lg:top-28`}>
    <h2 className="!mb-5 text-base font-semibold">Thông tin đơn hàng</h2>
    <VoucherPicker code={promoCode} promotions={resources.data?.promotions || []} loading={resources.loading} onApply={apply} disabled={cartBusy || !totals.selected.length} hint={promoCode && !quote && !DEMO_MODE ? 'Mã sẽ được xác nhận khi đủ thông tin nhận hàng' : 'Chọn ưu đãi cho những điều tươi lành'} />
    {!DEMO_MODE && <RewardRedemption points={rewardPoints} onApply={applyPoints} rewards={reward.data} customer={customer} loading={reward.loading} onReload={reward.reload} error={reward.error || pointError} disabled={cartBusy || !totals.selected.length} />}
    <dl className="!mt-5 space-y-4 text-xs"><div className="flex justify-between gap-3"><dt className="text-stone-500">Số lượng sản phẩm</dt><dd className="font-medium">{totals.quantity}</dd></div><div className="flex justify-between gap-3"><dt className="text-stone-500">Tổng tiền hàng</dt><dd className="font-medium tabular-nums">{currency(quote?.subtotal ?? totals.subtotal)}</dd></div><div className="flex justify-between gap-3 border-y border-line py-4"><dt className="text-stone-500">Giảm giá trực tiếp</dt><dd className="font-medium text-primary">{quote || DEMO_MODE ? `${discount ? '−' : ''}${currency(discount)}` : '—'}</dd></div>{quote?.shippingFee > 0 && <div className="flex justify-between"><dt>Phí giao hàng</dt><dd>{currency(quote.shippingFee)}</dd></div>}</dl>
    {quote?.pointsUsed > 0 && <div className="!mt-4 flex justify-between gap-3 text-xs text-primary"><span>Đổi điểm thưởng ({quote.pointsUsed})</span><strong>−{currency(quote.pointsDiscount)}</strong></div>}
    <div className="!mt-5" aria-live="polite"><div className="flex items-center justify-between gap-3"><strong className="text-sm">TỔNG TIỀN</strong><strong className="text-2xl font-semibold tabular-nums text-primary">{currency(total)}</strong></div><p className="!mt-1 text-right text-[10px] leading-5 text-stone-400">{quote?.vatIncluded ? 'Đã bao gồm VAT và được làm tròn' : 'Tạm tính · VAT và ưu đãi xác nhận ở bước tiếp theo'}</p><div className="!mt-4 flex justify-between gap-3 rounded-lg bg-sage px-3 py-2.5 text-[11px] text-primary"><span>Bạn đã tiết kiệm được</span><strong>{quote || DEMO_MODE ? currency(discount + (quote?.pointsDiscount || 0)) : '—'}</strong></div></div>
    {checking && <p role="status" className="!mt-3 text-xs text-stone-500">Đang cập nhật giá và ưu đãi…</p>}{error && <p role="alert" className="!mt-3 text-xs leading-5 text-red-700">{error}</p>}
    <div className="!mt-5 hidden lg:block">{blocked ? <button type="button" className={purchaseButton} disabled>Mua ngay ({totals.quantity}) <ArrowRight size={16} /></button> : <Link className={purchaseButton} to="/thanh-toan">Mua ngay ({totals.quantity}) <ArrowRight size={16} /></Link>}</div>
    <p className="!mt-4 flex items-center justify-center gap-1.5 text-[10px] text-stone-500"><ShieldCheck size={14} /> Chỉ thanh toán sản phẩm đã chọn</p>
    <div className="!mt-5 flex gap-3 border-t border-line pt-4"><Leaf size={21} className="shrink-0 text-[#8aa06c]" /><p className="text-[11px] leading-5 text-stone-500">Chọn vừa đủ, nhận trọn tươi lành.<br />Cảm ơn bạn đã mua sắm cùng Mộc.</p></div>
  </aside>
  <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_24px_#2947350d] backdrop-blur lg:hidden"><div className="!mx-auto flex max-w-2xl items-center gap-4"><div className="min-w-0 flex-1"><p className="text-[10px] text-stone-500">Tổng cộng · {totals.quantity} sản phẩm</p><strong className="text-lg text-primary">{currency(total)}</strong></div>{blocked ? <button type="button" className={`${purchaseButton} !w-auto`} disabled>Mua ngay ({totals.quantity})</button> : <Link className={`${purchaseButton} !w-auto`} to="/thanh-toan">Mua ngay ({totals.quantity})</Link>}</div></div></>;
}
