import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResource } from '@/hooks/useResource';
import { useOrderRefresh } from '@/hooks/useOrderRefresh';
import { checkoutService } from '@/services/client/checkoutService';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { CommerceHeader, CommerceStatus, commercePanel } from '@/components/checkout/OrderUI';
import { currency } from '@/lib/utils';
import { dateText } from '@/lib/apiData';
import { Button } from '@/components/ui/button';

export default function OrdersPage() {
  const [page, setPage] = useState(0);
  const list = useResource(() => checkoutService.orders({ page, size: 10 }), [page]);
  useOrderRefresh(list.reload);
  return <div className="container py-10"><CommerceHeader title="Đơn hàng của bạn" description="Theo dõi những lựa chọn tươi lành, từ xác nhận đến lúc nhận hàng." /><Button variant="outline" onClick={list.reload} disabled={list.loading}>Tải lại</Button><ResourceState loading={list.loading} error={list.error} empty={!list.data?.items.length} onRetry={list.reload} /><div className="!mt-6 space-y-4">{!list.loading && !list.error && list.data?.items.map((order) => <article key={order.id} className={commercePanel}><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">{order.orderCode}</h2><p className="!mt-2 text-xs text-stone-500">{dateText(order.orderedAt)} · {order.pricing.items.length} quy cách</p></div><div className="flex flex-wrap gap-2"><CommerceStatus value={order.status} /><CommerceStatus value={order.paymentStatus} type="payment" /></div></div><div className="!mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4"><strong className="text-lg text-primary">{currency(order.pricing.totalAmount)}</strong><Link className="inline-flex min-h-11 items-center rounded-xl bg-sage px-4 text-sm" to={`/don-hang/${encodeURIComponent(order.id)}`}>Xem đơn & thanh toán →</Link></div></article>)}</div><Pagination page={page} size={10} totalPages={list.data?.totalPages || 0} totalElements={list.data?.totalElements || 0} onChange={setPage} /></div>;
}
