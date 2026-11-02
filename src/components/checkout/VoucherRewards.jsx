import { VoucherScope } from './VoucherScope';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TicketPercent } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import { useResource } from '@/hooks/useResource';
import { checkoutService } from '@/services/client/checkoutService';
import { voucherBenefit, voucherStatusLabels } from '@/lib/customerVouchers';
import { currency, errorMessage } from '@/lib/utils';
import { voucherExchangeValueError } from '@/lib/promotionRules';
import { dateText } from '@/lib/apiData';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { commercePanel } from './OrderUI';

const storageKey = (username) => `moc:voucher-exchange:${username}`;
function savedAttempt(username) {
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey(username)) || 'null');
    return value?.key && value?.body?.promotionId && Number.isInteger(value.body.expectedPointsCost) && value.body.expectedPointsCost > 0 ? value : null;
  } catch { return null; }
}

export function VoucherRewards({ available = 0, pointsLoading, onChanged }) {
  const { user } = useAuth();
  const { setVoucherCode, setRewardPoints } = useShop();
  const navigate = useNavigate();
  const [tab, setTab] = useState('offers'), [page, setPage] = useState(0);
  const [pending, setPending] = useState(() => savedAttempt(user.username));
  const [offer, setOffer] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const locked = useRef(false);
  const resource = useResource(() => (tab === 'offers' ? checkoutService.voucherOffers : checkoutService.vouchers)({ page, size: 6 }), [tab, page]);

  async function exchange() {
    if (locked.current || (!pending && !offer)) return;
    locked.current = true; setBusy(true); setError('');
    let attempt = pending;
    try {
      if (!attempt) {
        attempt = { key: crypto.randomUUID(), body: { promotionId: offer.id, expectedPointsCost: Number(offer.pointsCost), expectedOfferVersion: offer.exchangeVersion } };
        // Save before sending; retry an uncertain result with the exact same request.
        sessionStorage.setItem(storageKey(user.username), JSON.stringify(attempt)); setPending(attempt);
      }
      await checkoutService.exchangeVoucher(attempt.body, attempt.key);
      sessionStorage.removeItem(storageKey(user.username));
      setPending(null); setOffer(null); setTab('wallet'); setPage(0); resource.reload(); onChanged();
      toast.success('Đổi điểm thành công. Voucher đã được lưu vào tài khoản của bạn.');
    } catch (err) {
      const status = err.response?.status;
      if (status >= 400 && status < 500 && ![408, 429].includes(status)) {
        sessionStorage.removeItem(storageKey(user.username)); setPending(null); onChanged(); resource.reload();
      }
      setError(errorMessage(err));
    } finally { locked.current = false; setBusy(false); }
  }

  function useVoucher(voucher) {
    setRewardPoints(0); setVoucherCode(voucher.voucherCode);
    toast.success('Đã chọn voucher. Điều kiện sẽ được kiểm tra với giỏ hàng.'); navigate('/gio-hang');
  }

  return <section className={`${commercePanel} !mb-6`}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h2 className="font-serif text-2xl text-primary">Ưu đãi của bạn</h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn danh sách voucher">
        {[['offers', 'Đổi điểm lấy voucher'], ['wallet', 'Voucher của tôi']].map(([value, label]) => <Button key={value} variant={tab === value ? 'default' : 'outline'} onClick={() => { setTab(value); setPage(0); }}>{label}</Button>)}
      </div>
    </div>
    {pending && <div className="!mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7">
      <p>Lần đổi {pending.body.expectedPointsCost} điểm trước cần được kiểm tra. Bấm kiểm tra để nhận lại kết quả trước khi đổi thêm.</p>
      <Button className="!mt-3" disabled={busy} onClick={exchange}>{busy ? 'Đang kiểm tra…' : 'Kiểm tra lại lần đổi trước'}</Button>
    </div>}
    {error && <p role="alert" className="!mt-4 text-sm leading-7 text-red-700">{error}</p>}
    <div className="!mt-5"><ResourceState loading={resource.loading} error={resource.error} empty={!resource.data?.items?.length} onRetry={resource.reload} /></div>
    {!resource.loading && !resource.error && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {resource.data?.items.map((item) => <article key={item.id} className="flex min-w-0 flex-col rounded-2xl border border-[#d8e4d3] bg-[#F7FAF5] p-5">
        <TicketPercent className="text-[#1B4D2E]" size={26} />
        <h3 className="!mt-3 font-semibold text-primary">{item.name}</h3>
        <strong className="!mt-2 block text-lg text-primary">{voucherBenefit(item)}</strong>
        <p className="!mt-2 text-sm leading-6 text-stone-600">Đơn từ {currency(item.minOrderValue)}. Áp dụng cho sản phẩm hoặc lô thuộc chương trình.</p>
        <VoucherScope voucher={item} />{item.description && <p className="!mt-2 whitespace-pre-line text-xs leading-6 text-stone-500">{item.description}</p>}
        {tab === 'offers' ? <>
          <p className="!mt-3 text-xs leading-6 text-primary">Trừ trực tiếp cùng số điểm: {currency(Number(item.pointsCost) * 2000)}. Voucher dùng cùng mã khuyến mãi; số tiền giảm tùy điều kiện đơn hàng.</p><p className="!mt-3 text-xs leading-6 text-stone-500">Hạn dùng tối đa {item.voucherValidDays} ngày kể từ khi đổi, không quá {dateText(item.endDate)}.</p>
          <div className="!mt-auto flex items-center justify-between gap-3 pt-5"><strong>{item.pointsCost} điểm</strong><Button disabled={busy || !!pending || pointsLoading || available < item.pointsCost || !!voucherExchangeValueError(item)} onClick={() => { setOffer(item); setError(''); }}>{voucherExchangeValueError(item) ? 'Chưa mở đổi' : available < item.pointsCost ? 'Chưa đủ điểm' : 'Đổi voucher'}</Button></div>
        </> : <>
          <p className="!mt-3 break-all text-xs font-medium text-primary">{item.voucherCode}</p>
          <p className="!mt-2 text-xs leading-6 text-stone-500">Hết hạn: {dateText(item.expiresAt)}<br />Đã đổi: {item.pointsSpent} điểm</p>
          <div className="!mt-auto flex flex-wrap items-center justify-between gap-3 pt-5"><span className={`text-xs ${item.usable ? 'text-primary' : 'text-stone-500'}`}>{voucherStatusLabels[item.status] || 'Chưa khả dụng'}</span>{item.usable && <Button onClick={() => useVoucher(item)}>Sử dụng</Button>}</div>
        </>}
      </article>)}
    </div>}
    <Pagination page={page} size={6} totalPages={resource.data?.totalPages || 0} totalElements={resource.data?.totalElements || 0} onChange={setPage} />
    <Modal open={!!offer} onOpenChange={(open) => { if (!open && !busy) setOffer(null); }} title="Xác nhận đổi voucher" description="Điểm được trừ khi đổi thành công. Đổi voucher chưa áp dụng giảm giá cho đơn hàng.">
      {offer && <div className="space-y-4"><p className="font-semibold text-primary">{offer.name}</p><p className="text-sm leading-7">Dùng <strong>{offer.pointsCost} điểm</strong> để nhận voucher {voucherBenefit(offer).toLocaleLowerCase('vi')}, cho đơn từ {currency(offer.minOrderValue)}.</p><VoucherScope voucher={offer} /><p className="text-sm leading-7 text-stone-500">Có hiệu lực tối đa {offer.voucherValidDays} ngày và không vượt ngày kết thúc chương trình. Mỗi voucher dùng một lần, có thể kết hợp một mã khuyến mãi nhưng không trừ thêm điểm trực tiếp. Mã khuyến mãi được tính trước, voucher tính trên tiền hàng còn lại thuộc phạm vi áp dụng. Không đổi lại thành điểm hoặc tiền mặt.</p>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<div className="form-actions"><Button variant="outline" disabled={busy} onClick={() => setOffer(null)}>Để sau</Button><Button disabled={busy || (!pending && (pointsLoading || available < offer.pointsCost))} onClick={exchange}>{busy ? 'Đang xác nhận…' : pending ? 'Kiểm tra kết quả' : 'Xác nhận đổi điểm'}</Button></div></div>}
    </Modal>
  </section>;
}
