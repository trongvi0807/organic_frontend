import { useState } from 'react';
import { promotionService } from '@/services/admin/orderService';
import { useResource } from '@/hooks/useResource';
import { useAuth } from '@/contexts/AuthContext';
import { hasRole, can } from '@/lib/permissions';
import { adminDate } from '@/lib/adminFormat';
import { currency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { ResourceState } from '@/components/common/ResourceState';

export function ComboSuggestions({ onChoose }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  if (!can(user, 'promotion.write')) return null;
  return <><Button variant="outline" onClick={() => setOpen(true)}>Đề xuất combo</Button>
    <Modal open={open} onOpenChange={setOpen} title="Combo tiềm năng từ đơn đã hoàn tất" description="Chọn một nhóm sản phẩm để mở bản nháp khuyến mãi. Bạn quyết định mức giảm và thời hạn." className="!max-w-[900px]">
      {open && <Suggestions onChoose={combo => { setOpen(false); onChoose({ promotionType: 'combo', name: `Combo ${combo.products.map(p => p.productName).join(' + ')}`.slice(0, 200), productIds: combo.products.map(p => p.id), requiredQuantities: Object.fromEntries(combo.products.map(p => [p.id, 1])), status: 'draft' }); }} />}
    </Modal></>;
}
function Suggestions({ onChoose }) {
  const resource = useResource(promotionService.comboSuggestions, []);
  const data = resource.data;
  return <div className="space-y-4"><ResourceState loading={resource.loading} error={resource.error} onRetry={resource.reload} />
    {data && <><p className="text-sm leading-6 text-stone-600">{data.message}</p><p className="text-xs text-stone-500">Cập nhật {adminDate(data.generatedAt, true)} · {data.costedOrders}/{data.eligibleOrders} đơn có đủ giá vốn. {data.excludedCostOrders > 0 && `${data.excludedCostOrders} đơn thiếu giá vốn đã được loại khỏi đề xuất.`}</p>
      <div className="max-h-[55vh] space-y-3 overflow-y-auto">{data.combos.map((combo, i) => <article key={combo.products.map(p => p.id).join(':')} className="rounded-xl border border-line p-4">
        <h3 className="font-semibold text-primary">{i + 1}. {combo.products.map(p => p.productName).join(' + ')}</h3>
        <p className="mt-1 text-xs text-stone-500">{combo.products.map(p => p.productCode).join(' · ')}</p>
        <p className="my-3 text-sm">Xuất hiện trong {combo.orderCount} đơn · Lợi nhuận gộp lịch sử ước tính: {currency(combo.estimatedGrossProfit)}</p>
        <Button size="sm" onClick={() => onChoose(combo)}>Tạo bản nháp từ combo</Button>
      </article>)}</div>
      {!data.combos.length && <p role="status" className="rounded-xl bg-sage p-4 text-sm">Bạn vẫn có thể tạo combo thủ công trong “Tạo mã ưu đãi”.</p>}
      <Button size="sm" variant="outline" onClick={resource.reload}>Tải lại đề xuất</Button></>}
  </div>;
}
