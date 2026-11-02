import { currency } from '@/lib/utils';
import { Field, Input } from '@/components/ui/field';

export function PromotionDiscountFields({ values, referenceAmount, requireReference, onReferenceChange, onChange }) {
  const percentage = values.discountType === 'percentage';
  const calculatedZero = percentage && referenceAmount !== '' && Number(referenceAmount) > 0
    && Number(values.discountValue) > 0 && values.maxDiscountAmount === '0';

  return <div className="grid gap-4 sm:grid-cols-2">
    {percentage && <Field
      label={`1. Giá trị hàng làm mốc (₫)${requireReference ? ' *' : ''}`}
      hint="Dùng để tính mức giảm tối đa, không phải giá trị đơn tối thiểu. Ví dụ: 500000."
    >
      <Input type="number" required={requireReference} inputMode="decimal" min="0.01" max="999999999999.99" step="0.01"
        placeholder="Nhập giá trị hàng trước" value={referenceAmount} onChange={(event) => onReferenceChange(event.target.value)} />
    </Field>}
    <Field label={percentage ? '2. Tỷ lệ giảm (%) *' : '1. Số tiền giảm (₫) *'}
      hint={percentage ? 'Nhập từ 0,01 đến 100%. Ví dụ: 10 nghĩa là giảm 10%.' : 'Nhập số tiền giảm cho mỗi lần dùng ưu đãi. Ví dụ: 10000.'}>
      <Input type="number" required inputMode="decimal" min="0.01" max={percentage ? 100 : '999999999999.99'} step="0.01"
        placeholder={percentage ? 'Ví dụ: 10' : 'Ví dụ: 10000'} value={values.discountValue} onChange={(event) => onChange('discountValue', event.target.value)} />
    </Field>
    <Field label={`${percentage ? '3' : '2'}. Giảm tối đa (₫) — tự tính`} className="sm:col-span-2"
      error={calculatedZero ? 'Mức giảm sau làm tròn chưa đủ 1₫. Vui lòng tăng giá trị hàng hoặc tỷ lệ giảm.' : ''}
      hint={percentage
        ? referenceAmount !== '' && values.maxDiscountAmount !== ''
          ? `${currency(Number(referenceAmount))} × ${values.discountValue || 0}% = ${currency(Number(values.maxDiscountAmount))}. Đây là mức giảm cao nhất cho mỗi lần dùng.`
          : 'Nhập giá trị hàng làm mốc và tỷ lệ giảm ở trên để tự điền ô này.'
        : 'Tự điền bằng số tiền giảm đã nhập ở trên.'}>
      <Input aria-label="Giảm tối đa tự tính" readOnly type="text" placeholder="Tự tính sau khi nhập mức giảm"
        value={values.maxDiscountAmount === '' ? '' : currency(Number(values.maxDiscountAmount))} />
    </Field>
    {percentage && !requireReference && referenceAmount === '' && <p className="text-xs leading-6 text-stone-500 sm:col-span-2">
      {values.maxDiscountAmount === '' ? 'Chương trình hiện chưa giới hạn mức giảm.' : `Đang giữ mức giảm tối đa đã lưu: ${currency(Number(values.maxDiscountAmount))}.`}
      {' '}Nhập giá trị hàng làm mốc nếu muốn tính lại; thay đổi tỷ lệ giảm cần nhập lại giá trị này.
    </p>}
  </div>;
}
