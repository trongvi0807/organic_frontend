import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, ShoppingBag, Truck, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useShop } from '@/contexts/ShopContext';
import { useAuth } from '@/contexts/AuthContext';
import { useResource } from '@/hooks/useResource';
import { hasRole } from '@/lib/permissions';
import { selectedCartItems } from '@/lib/cart';
import { quoteFingerprint, canPayOrder, paymentRedirect } from '@/lib/checkout';
import { checkoutFormPayload, PICKUP_STORE } from '@/lib/checkoutForm';
import { savedAddressToForm } from '@/lib/address';
import { readAttempt, saveAttempt, clearAttempt, rememberPayment } from '@/lib/checkoutAttempt';
import { checkoutService } from '@/services/client/checkoutService';
import { loadAddresses } from '@/services/client/addressService';
import { createProfileService } from '@/services/client/profileService';
import { DEMO_MODE } from '@/services/api';
import { errorMessage } from '@/lib/utils';
import { validateRewardPoints } from '@/lib/rewardPoints';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { ResourceState } from '@/components/common/ResourceState';
import { PurchaseFrame, CheckoutSection, purchasePanel } from '@/components/checkout/PurchaseFrame';
import { AddressForm } from '@/components/checkout/AddressForm';
import { CheckoutSummary } from '@/components/checkout/CheckoutSummary';
import { CheckoutProducts } from '@/components/checkout/CheckoutProducts';
import { PaymentMethods } from '@/components/checkout/PaymentMethods';

export default function CheckoutPage() {
  const { user } = useAuth();
  if (!user || !hasRole(user, 'CUSTOMER') || DEMO_MODE) return <PurchaseFrame step={2} title="Thông tin & thanh toán"><section className={`${purchasePanel} p-8 text-center`}><ShoppingBag className="!mx-auto text-primary" size={35} /><h2 className="!mt-4 text-lg font-semibold">{!user ? 'Đăng nhập để tiếp tục đặt hàng' : 'Thanh toán dành cho tài khoản khách hàng'}</h2><p className="!mt-3 text-sm text-stone-500">{DEMO_MODE ? 'Chuyển sang API backend để tạo đơn thật.' : !user ? 'Giỏ khách sẽ được gộp vào tài khoản sau khi đăng nhập.' : 'Vui lòng sử dụng tài khoản khách hàng để mua sắm.'}</p><Link className="!mt-5 inline-flex rounded-xl bg-primary px-6 py-3 text-sm !text-white" to={!user ? '/dang-nhap' : '/gio-hang'}>{!user ? 'Đăng nhập' : 'Về giỏ hàng'}</Link></section></PurchaseFrame>;
  return <CheckoutForm key={user.username} user={user} />;
}
function CheckoutForm({ user }) {
  const { cart, cartLoading, cartError, cartBusy, refreshCart, removePurchased, promoCode, setPromoCode, rewardPoints, setRewardPoints } = useShop();
  const selected = selectedCartItems(cart), navigate = useNavigate();
  const [attempt, setAttempt] = useState(() => readAttempt(user.username));
  const [values, setValues] = useState({ receiverName: user.fullName || '', receiverPhone: user.phoneNumber || '', email: user.email || '', note: '', paymentMethod: 'cod', promotionCode: promoCode || '' });
  const [address, setAddress] = useState({ provinceCode: '', wardCode: '', street: '', search: '' }), [fulfillment, setFulfillment] = useState('delivery');
  const [quoted, setQuoted] = useState(null), [checking, setChecking] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const locked = useRef(false), initialized = useRef(false), touched = useRef(false);
  const options = useResource(async () => {
    const [methods, rewards, profile, addresses] = await Promise.allSettled([checkoutService.methods(), checkoutService.rewards(), createProfileService().get(), loadAddresses()]);
    if (methods.status === 'rejected') throw methods.reason;
    if (addresses.status === 'rejected') throw addresses.reason;
    return { methods: methods.value, addresses: addresses.value, rewards: rewards.status === 'fulfilled' ? rewards.value : null, profile: profile.status === 'fulfilled' ? profile.value : null };
  }, []);
  useEffect(() => {
    if (!options.data || initialized.current || attempt) return;
    initialized.current = true;
    if (touched.current) return;
    const p = options.data.profile, a = p?.addresses?.find((a) => a.isDefault);
    if (a) setAddress(savedAddressToForm(a, options.data.addresses));
    setValues((old) => ({ ...old, receiverName: a?.receiverName || p?.fullName || old.receiverName, receiverPhone: a?.receiverPhone || p?.phoneNumber || old.receiverPhone, email: p?.email || old.email, paymentMethod: options.data.methods.cod ? 'cod' : Object.keys(options.data.methods).find((n) => options.data.methods[n]) || '' }));
  }, [options.data, attempt]);
  const signature = JSON.stringify({ values, rewardPoints, address: { ...address, search: '' }, fulfillment, items: selected.map(({ variantId, quantity, minPrice }) => [variantId, quantity, minPrice]) });
  const currentSignature = useRef(signature); currentSignature.current = signature;
  const quote = quoted?.signature === signature ? quoted.value : null;
  function field(key, value) { touched.current = true; setValues((old) => ({ ...old, [key]: value })); setError(''); }
  function body(next = values) {
    const points = validateRewardPoints(rewardPoints, options.data?.rewards);
    const payload = checkoutFormPayload({ ...next, points }, selected, address, options.data?.addresses, fulfillment);
    if (!options.data?.methods[payload.paymentMethod]) throw new Error('Phương thức thanh toán này chưa khả dụng.');
    return payload;
  }
  useEffect(() => {
    if (attempt || cartLoading || cartBusy || cartError || !options.data || locked.current) return;
    let payload; try { payload = body(); } catch { return; }
    let active = true; setChecking(true);
    const timer = setTimeout(() => checkoutService.preview(payload).then((value) => { if (active && currentSignature.current === signature) { setQuoted({ signature, value }); setError(''); } }).catch((e) => { if (active) setError(errorMessage(e)); }).finally(() => { if (active) setChecking(false); }), 650);
    return () => { active = false; clearTimeout(timer); setChecking(false); };
  }, [signature, options.data, cartLoading, cartBusy, cartError, attempt]);
  async function place(recover = false) {
    if (locked.current || (!recover && (cartBusy || cartLoading || cartError))) return;
    setError(''); locked.current = true; setBusy(true);
    let current = attempt;
    try {
      if (current?.orderId) { clearAttempt(user.username); navigate(`/dat-hang-thanh-cong/${encodeURIComponent(current.orderId)}`); return; }
      if (!current) {
        if (recover) throw new Error('Không có lần đặt trước để khôi phục.');
        const payload = body(), latest = await checkoutService.preview(payload);
        if (currentSignature.current !== signature) throw new Error('Giỏ hàng vừa thay đổi. Vui lòng kiểm tra tổng tiền mới trước khi xác nhận.');
        if (!quote || quoteFingerprint(latest) !== quoteFingerprint(quote)) { setQuoted({ signature, value: latest }); setError('Tổng tiền đã được kiểm tra. Vui lòng xem lại và bấm THANH TOÁN để xác nhận.'); return; }
        current = { key: crypto.randomUUID(), payload }; saveAttempt(user.username, current); setAttempt(current);
      }
      const order = await checkoutService.create(current.payload, current.key);
      window.dispatchEvent(new Event('moc:order-updated'));
      saveAttempt(user.username, { ...current, orderId: order.id }); setAttempt({ ...current, orderId: order.id });
      await removePurchased(current.payload.items); clearAttempt(user.username); setRewardPoints(0); setPromoCode('');
      if (canPayOrder(order)) {
        try {
          const payment = await checkoutService.initiate(order.id, order.paymentMethod);
          const target = paymentRedirect(payment);
          rememberPayment(user.username, payment);
          navigate(`/dat-hang-thanh-cong/${encodeURIComponent(order.id)}`, { replace: true });
          window.location.assign(target);
          return;
        } catch (paymentError) {
          toast.error(`Đơn ${order.orderCode} đã được tạo; chưa mở được cổng thanh toán. ${errorMessage(paymentError)} Mở đơn để tiếp tục, không tạo lại đơn.`, { position:'top-left', duration:8000 });
          navigate(`/dat-hang-thanh-cong/${encodeURIComponent(order.id)}`, { replace:true });
          return;
        }
      }
      toast.success(order.paymentStatus === 'paid' ? 'Đơn hàng đã được xác nhận thanh toán.' : 'Đặt hàng thành công. Mộc đã ghi nhận đơn của bạn.', { position: 'top-left' });
      navigate(`/dat-hang-thanh-cong/${encodeURIComponent(order.id)}`, { replace: true });
    } catch (e) {
      if ([400, 403, 404, 409].includes(e.response?.status)) { clearAttempt(user.username); setAttempt(null); setQuoted(null); }
      const message = `${errorMessage(e)}${current?.key && (!e.response || e.response.status >= 500) ? ' Chưa rõ kết quả. Dùng nút khôi phục để kiểm tra với cùng mã, tránh đặt trùng.' : ''}`;
      setError(message); toast.error(message, { position: 'top-left' });
    } finally { locked.current = false; setBusy(false); }
  }
  const blocked = busy || cartBusy || !!attempt;
  return <PurchaseFrame step={2} title="Thông tin & thanh toán" description="Chỉ còn một bước để mang những điều tươi lành về nhà.">
    <ResourceState loading={options.loading || (cartLoading && !cart.length)} error={options.error || cartError} onRetry={() => { options.reload(); refreshCart().catch(() => {}); }} />
    {attempt && <section className={`${purchasePanel} !mb-6 border-amber-200 bg-amber-50 p-5`}><h2 className="font-semibold">{attempt.orderId ? 'Đơn hàng đã được tạo' : 'Lần đặt hàng trước cần được kiểm tra'}</h2><p className="!mt-2 text-xs leading-6">Giữ nguyên nội dung và mã chống đặt trùng để lấy lại kết quả, không tạo thêm đơn.</p><Button className="!mt-3" disabled={busy} onClick={() => place(true)}>{busy ? 'Đang kiểm tra…' : attempt.orderId ? 'Mở đơn đã tạo' : 'Khôi phục lần đặt trước'}</Button></section>}
    {!attempt && !cartLoading && !cartError && !selected.length && <section className={`${purchasePanel} p-8 text-center`}><ShoppingBag className="!mx-auto text-primary" size={35} /><h2 className="!mt-4 text-lg font-semibold">Bạn chưa chọn sản phẩm</h2><Link to="/gio-hang" className="!mt-4 inline-flex items-center gap-2 text-sm underline"><ArrowLeft size={14} />Về giỏ hàng</Link></section>}
    {!options.loading && !options.error && !!selected.length && <form id="checkout-form" onSubmit={(e) => { e.preventDefault(); place(); }} className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_370px]">
      <div className="min-w-0 space-y-4"><CheckoutProducts items={selected} quote={quote} /><fieldset disabled={blocked} className="min-w-0 space-y-4">
        <CheckoutSection number="1" title="Thông tin khách hàng" icon={UserRound}><div className="grid gap-4 sm:grid-cols-2"><Field label="Họ và tên *"><Input required maxLength={100} autoComplete="name" placeholder="Nguyễn Văn An" value={values.receiverName} onChange={(e) => field('receiverName', e.target.value)} /></Field><Field label="Số điện thoại *"><Input required type="tel" maxLength={20} minLength={8} autoComplete="tel" placeholder="Số điện thoại nhận hàng" value={values.receiverPhone} onChange={(e) => field('receiverPhone', e.target.value)} /></Field></div><div className="!mt-4"><Field label="Email nhận hóa đơn (tùy chọn)" hint="Gửi yêu cầu email kèm đơn; cửa hàng xác nhận việc phát hành hóa đơn."><Input type="email" maxLength={254} autoComplete="email" placeholder="ban@email.com" value={values.email} onChange={(e) => field('email', e.target.value)} /></Field></div></CheckoutSection>
        <CheckoutSection number="2" title="Hình thức nhận hàng" icon={Truck}><div className="!mb-5 grid grid-cols-2 gap-3">{[['delivery', Truck, 'Giao hàng tận nhà'], ['pickup', Building2, 'Nhận tại cửa hàng']].map(([key, Icon, label]) => <label key={key} className={`flex min-h-20 cursor-pointer items-center gap-2 rounded-xl border px-3 py-4 text-xs ${fulfillment === key ? 'border-[#7c9664] bg-sage text-primary' : 'border-line text-stone-500'}`}><input type="radio" name="fulfillment" value={key} checked={fulfillment === key} onChange={() => { touched.current = true; setFulfillment(key); setError(''); }} className="accent-primary" /><Icon size={18} className="shrink-0" /><span>{label}</span></label>)}</div>
        {fulfillment === 'delivery' ? <>{!!options.data.profile?.addresses?.length && <div className="!mb-4"><Field label="Địa chỉ đã lưu"><Select defaultValue="" onChange={(e) => { const a = options.data.profile.addresses.find((a) => a.id === e.target.value); if (a) { touched.current = true; setAddress(savedAddressToForm(a, options.data.addresses)); setValues((old) => ({ ...old, receiverName: a.receiverName || old.receiverName, receiverPhone: a.receiverPhone || old.receiverPhone })); } }}><option value="">Chọn địa chỉ hoặc nhập mới</option>{options.data.profile.addresses.map((a) => <option key={a.id} value={a.id}>{a.label || a.receiverName} · {a.streetAddress}</option>)}</Select></Field></div>}<AddressForm data={options.data.addresses} value={address} disabled={blocked} onChange={(a) => { touched.current = true; setAddress(a); setError(''); }} /></> : <div className="rounded-xl border border-[#c5d2b8] bg-[#f7faf3] p-4"><p className="flex items-center gap-2 text-sm font-semibold text-primary"><MapPin size={18} />{PICKUP_STORE.name}</p><p className="!mt-2 text-xs leading-6 text-stone-500">{PICKUP_STORE.address}</p><a className="!mt-2 inline-block text-xs text-primary" href={`tel:${PICKUP_STORE.phone}`}>{PICKUP_STORE.phone}</a><p className="!mt-3 border-t border-line pt-3 text-[11px] leading-6 text-amber-800">Đây là yêu cầu nhận tại cửa hàng, được gửi kèm ghi chú đơn. Vui lòng chờ cửa hàng liên hệ xác nhận lịch nhận.</p></div>}
        <div className="!mt-5"><Field label="Ghi chú cho cửa hàng (tùy chọn)"><Textarea maxLength={4500} rows={2} className="!min-h-20" placeholder="Lưu ý về thời gian, người nhận hoặc yêu cầu khác…" value={values.note} onChange={(e) => field('note', e.target.value)} /></Field></div></CheckoutSection>
      </fieldset></div>
      <CheckoutSummary items={selected} quote={quote} busy={busy} checking={checking} disabled={cartBusy || !!attempt || cartLoading || !!cartError} promotionCode={values.promotionCode} points={rewardPoints}><PaymentMethods methods={options.data.methods} value={values.paymentMethod} onChange={(value) => field('paymentMethod',value)} disabled={blocked} fulfillment={fulfillment} /></CheckoutSummary>
    </form>}
    {error && <p role="alert" className="!mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs leading-7 text-red-800">{error}</p>}
  </PurchaseFrame>;
}
