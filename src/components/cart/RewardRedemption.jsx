import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { checkoutService } from '@/services/client/checkoutService';
import { validateRewardPoints } from '@/lib/rewardPoints';
import { currency, errorMessage } from '@/lib/utils';

export function RewardRedemption({ points, onApply, rewards, customer, loading, onReload, error: loadError, disabled }) {
  const [draft, setDraft] = useState(String(points)), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { setDraft(String(points)); }, [points]);
  function fail(message) { setError(message); toast.error(message, { position:'top-left', id:'reward-points-error' }); }
  async function apply() {
    if (busy) return;
    setError('');
    try {
      validateRewardPoints(draft, rewards);
      setBusy(true);
      // Always refresh the current account's available (balance - reserved) before committing.
      const latest = Number(draft) > 0 ? await checkoutService.rewards() : rewards;
      const amount = validateRewardPoints(draft, latest);
      await onApply(amount); onReload(); setDraft(String(amount));
    } catch (e) { fail(errorMessage(e)); }
    finally { setBusy(false); }
  }
  return <section aria-label="Đổi điểm thưởng" className="!mt-4 rounded-xl border border-line bg-cream p-4"><div className="flex items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-xs font-semibold"><Coins size={17} className="text-[#81985d]" />Đổi điểm thưởng</h3>{customer && <button type="button" disabled={busy || loading} onClick={onReload} aria-label="Tải lại điểm thưởng" className="grid size-7 place-items-center rounded-lg text-stone-400 hover:bg-sage"><RefreshCw size={13} className={loading ? 'animate-spin' : ''} /></button>}</div>
    {!customer ? <p className="!mt-2 text-[11px] leading-6 text-stone-500"><Link className="text-primary underline" to="/dang-nhap">Đăng nhập khách hàng</Link> để xem và sử dụng điểm đã tích.</p> : <><p className="!mt-2 text-[11px] leading-6 text-stone-500">{loading ? 'Đang kiểm tra điểm thưởng…' : rewards ? <><strong className="text-primary">{rewards.available} điểm khả dụng</strong> · {rewards.reserved} điểm đang giữ<br />1 điểm = {currency(rewards.redeemValue)} · Tối đa {Math.min(50,rewards.redeemLimit)} điểm/đơn.</> : 'Chưa kiểm tra được điểm thưởng.'}</p><label htmlFor="cart-reward-points" className="!mt-3 block text-[11px] font-medium">Số điểm muốn đổi</label><div className="!mt-2 flex gap-2"><input id="cart-reward-points" type="text" inputMode="numeric" autoComplete="off" maxLength={6} value={draft} aria-invalid={!!error} aria-describedby="reward-feedback" disabled={disabled || busy || loading} className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2.5 !text-sm" onChange={(e) => { setDraft(e.target.value); setError(''); if (e.target.value && Number(e.target.value) > 0 && rewards?.available <= 0) fail('Bạn chưa có điểm khả dụng để đổi. Điểm được tích từ đơn hàng đã hoàn tất.'); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }} /><button type="button" disabled={disabled || busy || loading} onClick={apply} className="rounded-lg bg-sage px-3 text-xs font-semibold text-primary hover:bg-[#e0e9d6]">{busy ? 'Đang kiểm tra…' : 'Đổi điểm'}</button></div><p id="reward-feedback" role={error || loadError ? 'alert' : 'status'} className={`!mt-2 text-[10px] leading-5 ${error || loadError ? 'text-red-700' : 'text-stone-500'}`}>{error || loadError || (points > 0 ? `Đã chọn đổi ${points} điểm. Tổng giảm được xác nhận cùng đơn hàng.` : 'Điểm chỉ được cộng sau khi đơn mua hàng hoàn tất. Nhập 0 để không đổi điểm.')}</p></>}
  </section>;
}
