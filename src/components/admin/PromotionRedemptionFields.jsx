import { Field, Input, Select } from '@/components/ui/field';
import { voucherExchangeValueError } from '@/lib/promotionRules';
import { currency } from '@/lib/utils';

export function PromotionRedemptionFields({ values, onChange }) {
  const redeemable = values.pointsCost !== '' && values.pointsCost != null;
  const valueError = redeemable ? voucherExchangeValueError(values) : '';
  const costError = redeemable && (!Number.isInteger(Number(values.pointsCost)) || Number(values.pointsCost) < 1)
    ? 'Số điểm cần đổi phải là số nguyên từ 1.' : '';
  const daysError = redeemable && (!Number.isInteger(Number(values.voucherValidDays)) || Number(values.voucherValidDays) < 1 || Number(values.voucherValidDays) > 365)
    ? 'Hạn dùng phải là số nguyên từ 1 đến 365 ngày.' : '';
  return <section className="rounded-xl border border-line bg-sage/40 p-4">
    <Field label="Cách nhận ưu đãi">
      <Select value={redeemable ? 'points' : 'public'} onChange={(event) => {
        const enabled = event.target.value === 'points';
        onChange('pointsCost', enabled ? 1 : '');
        onChange('voucherValidDays', enabled ? 30 : '');
      }}>
        <option value="public">Mã khuyến mãi thông thường</option>
        <option value="points">Đổi điểm lấy voucher riêng</option>
      </Select>
    </Field>
    {redeemable && <div className="!mt-4 grid gap-4 sm:grid-cols-2">
      <Field label="Số điểm cần đổi *" error={costError}><Input required type="number" min="1" max="2147483647" step="1" value={values.pointsCost} onChange={(event) => onChange('pointsCost', event.target.value)} /></Field>
      <Field label="Hạn dùng kể từ khi đổi (ngày) *" error={daysError}><Input required type="number" min="1" max="365" step="1" value={values.voucherValidDays} onChange={(event) => onChange('voucherValidDays', event.target.value)} /></Field>
    </div>}
    {redeemable && Number(values.pointsCost) > 0 && <p className="!mt-3 text-xs leading-6 text-primary">
      Trừ trực tiếp {values.pointsCost} điểm tương đương {currency(Number(values.pointsCost) * 2000)}. Voucher cần có mức giảm tối đa lớn hơn số tiền này.
    </p>}
    {valueError && <p role="alert" className="!mt-2 text-xs leading-6 text-red-700">{valueError}</p>}
    <p className="!mt-3 text-xs leading-6 text-stone-500">{redeemable
      ? 'Khách đổi điểm để nhận voucher dùng cùng một mã khuyến mãi. Không trừ thêm điểm trực tiếp trên cùng đơn. Voucher hết hạn theo số ngày đã chọn hoặc ngày kết thúc chương trình, tùy thời điểm nào đến trước.'
      : 'Khách có thể nhập mã trực tiếp khi mua hàng, không cần đổi điểm.'}</p>
  </section>;
}
