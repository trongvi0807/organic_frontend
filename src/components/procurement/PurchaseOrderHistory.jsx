import { useState } from 'react';
import { History } from 'lucide-react';
import { purchaseOrderService } from '@/services/admin/procurementService';
import { useResource } from '@/hooks/useResource';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { adminDate } from '@/lib/adminFormat';

export function PurchaseOrderHistory({ orderId, revision }) {
  const [page, setPage] = useState(0);
  const history = useResource(() => purchaseOrderService.history(orderId, { page, size: 5 }), [orderId, revision, page]);
  return <section className="!mt-7 space-y-4 rounded-2xl border border-line p-4 sm:p-5"><h2 className="flex items-center gap-2 !font-sans !text-base !font-semibold"><History size={18} />Lịch sử chỉnh sửa</h2>
    <ResourceState loading={history.loading} error={history.error} onRetry={history.reload} />
    {!history.loading && !history.error && history.data?.items.length === 0 && <p className="text-sm text-stone-500">Chưa ghi nhận lần chỉnh sửa nào.</p>}
    {!history.loading && !history.error && history.data?.items.map(entry => <article key={entry.id} className="space-y-3 border-l-2 border-emerald-100 pl-4"><div className="flex flex-wrap justify-between gap-2 text-sm"><strong>{entry.actorName}</strong><time className="text-xs text-stone-500">{adminDate(entry.changedAt, true)}</time></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Nội dung thay đổi</th><th>Trước khi sửa</th><th>Sau khi sửa</th></tr></thead><tbody>{entry.changes.map((change, i) => <tr key={i}><td>{change.field}</td><td className="whitespace-pre-wrap text-stone-500">{change.before}</td><td className="whitespace-pre-wrap font-medium text-primary">{change.after}</td></tr>)}</tbody></table></div><p className="text-xs text-emerald-700">{entry.result}</p></article>)}
    <Pagination page={page} size={5} totalPages={history.data?.totalPages || 0} totalElements={history.data?.totalElements || 0} onChange={setPage} />
  </section>;
}
