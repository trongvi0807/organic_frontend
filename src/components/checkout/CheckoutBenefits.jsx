import { useId, useState } from 'react';
import { errorMessage } from '@/lib/utils';
import { VoucherPicker } from './VoucherPicker';
import { RewardRedemption } from '@/components/cart/RewardRedemption';

export function CheckoutBenefits({ promotionCode, voucherCode, points, promotions = [], loading, disabled,
  onPromotion, onVoucher, onPoints, rewards, rewardsLoading, rewardsError, onRewardsReload, customer = true, showRewards = true }) {
  const group = useId();
  const [preferred, setPreferred] = useState(voucherCode ? 'voucher' : 'points');
  const [error, setError] = useState(''), [switching, setSwitching] = useState(false);
  const mode = voucherCode ? 'voucher' : preferred;

  async function chooseMode(next) {
    if (disabled || switching) return;
    setSwitching(true); setError('');
    try {
      if (next === 'points' && voucherCode) await onVoucher('');
      if (next === 'voucher' && points > 0) await onPoints(0);
      setPreferred(next);
    } catch (err) { setError(errorMessage(err)); }
    finally { setSwitching(false); }
  }

  return <div className="space-y-4">
    <VoucherPicker kind="public" code={promotionCode} promotions={promotions.filter((p) => !p.owned)} loading={loading}
      onApply={onPromotion} disabled={disabled || switching} hint="Có thể kết hợp với một quyền lợi từ điểm bên dưới" />
    {showRewards && <section className="rounded-xl border border-line p-4" aria-label="Quyền lợi từ điểm">
      <h3 className="text-xs font-semibold text-primary">Quyền lợi từ điểm</h3>
      <p className="!mt-2 text-[11px] leading-6 text-stone-500">Chọn một cách sử dụng. Mã khuyến mãi phía trên vẫn được giữ.</p>
      <div className="!mt-3 grid gap-2 sm:grid-cols-2">
        {[['points', 'Trừ điểm trực tiếp'], ['voucher', 'Dùng voucher đã đổi']].map(([value, label]) => <label key={value}
          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-3 text-xs ${mode === value ? 'border-primary bg-sage text-primary' : 'border-line'}`}>
          <input type="radio" name={group} checked={mode === value} disabled={disabled || switching} className="accent-primary"
            onChange={() => chooseMode(value)} />{label}
        </label>)}
      </div>
      {mode === 'voucher' ? <div className="!mt-4 space-y-3">
        <VoucherPicker kind="owned" code={voucherCode} promotions={promotions.filter((p) => p.owned)} loading={loading}
          onApply={onVoucher} disabled={disabled || switching} hint="Chọn một voucher đã đổi bằng điểm" />
        <p className="text-[11px] leading-6 text-stone-500">Voucher tính trên tiền hàng còn lại thuộc phạm vi áp dụng sau khuyến mãi. Đơn này không trừ thêm điểm trực tiếp.</p>
      </div> : <RewardRedemption points={points} onApply={onPoints} rewards={rewards} customer={customer} loading={rewardsLoading}
        onReload={onRewardsReload} error={rewardsError} disabled={disabled || switching} />}
      {error && <p role="alert" className="!mt-3 text-xs leading-6 text-red-700">{error}</p>}
    </section>}
  </div>;
}
