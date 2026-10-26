import { useState } from 'react';
import { useResource } from '@/hooks/useResource';
import { checkoutService } from '@/services/client/checkoutService';
import { ResourceState } from '@/components/common/ResourceState';
import { CommerceHeader, commercePanel } from '@/components/checkout/OrderUI';
import { Button } from '@/components/ui/button';
import { dateText } from '@/lib/apiData';
import { currency } from '@/lib/utils';

const labels = { reserve: 'Giữ điểm', redeem: 'Dùng điểm', release: 'Hoàn điểm đang giữ', earn: 'Tích điểm' };
export default function RewardsPage() {
  const [page, setPage] = useState(0);
  const rewards = useResource(checkoutService.rewards, []), history = useResource(() => checkoutService.transactions({ page, size: 20 }), [page]);
  return <div className="container py-10"><CommerceHeader title="Điểm xanh của bạn" description="Điểm được cộng khi đơn đã giao, đã trả tiền và được cửa hàng hoàn tất." /><ResourceState loading={rewards.loading} error={rewards.error} onRetry={rewards.reload} />{rewards.data && !rewards.error && <div className="!mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">{[['Khả dụng', rewards.data.available], ['Đang giữ', rewards.data.reserved], ['Tổng số dư', rewards.data.balance]].map(([title, amount]) => <div className={commercePanel} key={title}><p className="text-sm text-stone-500">{title}</p><strong className="!mt-3 block text-3xl text-primary">{amount}</strong></div>)}</div>}{rewards.data && <p className="!mb-6 text-sm leading-7 text-stone-500">1 điểm = {currency(rewards.data.redeemValue)} · Tối đa {rewards.data.redeemLimit} điểm/đơn · Mỗi {currency(rewards.data.earnPerVnd)} thực trả được 1 điểm khi hoàn tất đơn.</p>}<section className={commercePanel}><h2 className="!mb-5 font-serif text-2xl">Lịch sử điểm</h2><ResourceState loading={history.loading} error={history.error} empty={history.data?.length === 0} onRetry={history.reload} />{!history.loading && !history.error && <ul className="divide-y divide-line">{history.data?.map((item) => <li key={item.id} className="flex flex-wrap justify-between gap-4 py-4 text-sm"><div><strong>{labels[item.type] || item.type}</strong><p className="!mt-1 text-xs text-stone-500">{dateText(item.createdAt)} · {item.note}</p></div><span>Số dư {item.pointsDelta > 0 ? '+' : ''}{item.pointsDelta} · Đang giữ {item.reservedDelta > 0 ? '+' : ''}{item.reservedDelta}</span></li>)}</ul>}<div className="!mt-5 flex items-center justify-between gap-4"><Button variant="outline" disabled={!page || history.loading} onClick={() => setPage((p) => p - 1)}>Trang trước</Button><span className="text-xs">Trang {page + 1}</span><Button variant="outline" disabled={history.loading || history.data?.length !== 20} onClick={() => setPage((p) => p + 1)}>Trang sau</Button></div></section></div>;
}
