import { CheckCircle2, CircleX, PackageSearch } from 'lucide-react';
import { Field, Input } from '@/components/ui/field';
import { conditionCounts } from '@/lib/returnWarehouseChoices';

const choices = [
  { value: 'good', title: 'Toàn bộ còn tốt', description: 'Hàng còn nguyên vẹn, chất lượng đạt yêu cầu.', icon: CheckCircle2 },
  { value: 'damaged', title: 'Toàn bộ bị hỏng / không thể bán lại', description: 'Hàng hư hỏng, hết hạn hoặc không đạt yêu cầu.', icon: CircleX },
  { value: 'mixed', title: 'Có cả hàng tốt và hàng hỏng', description: 'Nhập số hàng hỏng, hệ thống tự tính phần còn tốt.', icon: PackageSearch },
];

export function WarehouseConditionPicker({ total, value, damagedQuantity, onChange, onDamagedChange, correction = false }) {
  let counts;
  try { counts = conditionCounts(value, total, damagedQuantity); } catch { /* Show the selection or inline quantity hint first. */ }
  return <div className="space-y-4">
    <fieldset className="space-y-3">
      <legend className="mb-3 text-sm font-semibold text-primary">{correction ? 'Kết quả kiểm tra đúng là gì?' : 'Tình trạng hàng nhận lại thế nào?'}</legend>
      {choices.filter((choice) => choice.value !== 'mixed' || total > 1).map(({ value: key, title, description, icon: Icon }) => <label key={key} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${value === key ? 'border-emerald-600 bg-emerald-50' : 'border-line bg-white hover:bg-[#F7FAF5]'}`}>
        <input type="radio" name="warehouse-condition" value={key} checked={value === key} onChange={() => onChange(key)} className="mt-1 shrink-0 accent-emerald-700" />
        <Icon size={19} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <span><strong className="block text-sm text-primary">{title}</strong><span className="mt-1 block text-xs leading-5 text-stone-500">{description}</span></span>
      </label>)}
    </fieldset>
    {value === 'mixed' && <Field label="Có bao nhiêu sản phẩm bị hỏng?" hint={`Đang kiểm tra ${total} sản phẩm. Số còn lại được tự tính là hàng tốt.`} error={!counts ? `Nhập số nguyên từ 1 đến ${total - 1}.` : ''}>
      <Input type="number" min={1} max={total - 1} step={1} value={damagedQuantity} onChange={(e) => onDamagedChange(e.target.value)} />
    </Field>}
    {counts && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-900">Kết quả sẽ lưu: <strong>{counts.good} hàng tốt</strong> và <strong>{counts.damaged} hàng hỏng / không thể bán lại</strong>.</p>}
  </div>;
}
