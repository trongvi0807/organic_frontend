import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellRing, Check, ArrowUpRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useResource } from '@/hooks/useResource';
import { useNotifications } from '@/contexts/NotificationContext';
import { pushAvailability } from '@/services/pushNotifications';
import { notificationService } from '@/services/admin/notificationService';
import { notificationTarget } from '@/lib/notificationTarget';
import { errorMessage } from '@/lib/utils';
import { dateText } from '@/lib/apiData';
import { WorkflowHeader, Refresh } from '@/components/procurement/ProcurementUI';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';

const channelLabels = { pending: 'Đang chờ', sent: 'Đã gửi', skipped: 'Bỏ qua', failed: 'Gửi lỗi' };
export default function NotificationsPage() {
  const [page, setPage] = useState(0), [busyId, setBusyId] = useState(null);
  const push = useNotifications();
  const list = useResource(() => notificationService.list({ page, size: 10 }), [page, push.revision]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') list.reload(); };
    const timer = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [list.reload]);
  async function action(item, retry = false) {
    setBusyId(item.id);
    try {
      if (retry) { await notificationService.retry(item.id); toast.success('Đã yêu cầu gửi lại các thông báo chưa thành công.'); }
      else await notificationService.read(item.id);
      list.reload();
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusyId(null); }
  }
  const reason = pushAvailability();
  return <>
    <WorkflowHeader title="Thông báo" description="Theo dõi cảnh báo tồn thấp dành cho tài khoản của bạn." step={5} />
    <section className="!mb-6 flex flex-col gap-5 rounded-2xl border border-[#dce6d3] bg-[#eff3ea] p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-4"><div className="rounded-2xl bg-white p-3 text-[#315c3f]"><BellRing size={23} /></div><div><h2 className="!text-lg !font-semibold">{push.enabled ? 'Đang nhận thông báo đẩy' : 'Không bỏ lỡ khi cần nhập hàng'}</h2><p className="!mt-2 max-w-2xl text-sm leading-6 text-stone-600">Bật thông báo để nhận cảnh báo kịp thời, kể cả khi bạn đang xem trang khác.</p><p className="!mt-2 text-xs text-stone-500">Cảnh báo tồn kho được gửi đến nhân viên kho đang làm việc và người quản lý được phân công.</p>{(push.error || reason) && <p role="status" className="!mt-3 text-sm text-amber-800">{push.error || reason}</p>}</div></div><Button className="shrink-0" disabled={push.busy || (!push.enabled && !!reason)} onClick={push.toggle}>{push.busy ? 'Đang cập nhật…' : push.enabled ? 'Tắt trên thiết bị này' : 'Bật thông báo'}</Button></section>
    <section className="admin-table-panel"><div className="table-panel-heading"><h2 className="flex items-center gap-2"><Bell size={18} />Hộp thư của bạn</h2><Refresh resource={list} /></div>
      <ResourceState loading={list.loading} error={list.error} empty={list.data?.items.length === 0} onRetry={list.reload} />
      {!list.loading && !list.error && !!list.data?.items.length && <ul className="divide-y divide-[#e5e8df]">{list.data.items.map((item) => <li key={item.id} className={`p-5 sm:p-6 ${item.readAt ? '' : 'bg-[#f8faf4]'}`}><div className="flex flex-wrap items-start justify-between gap-3"><h3 className="flex items-center gap-2 !text-base !font-semibold">{!item.readAt && <span className="size-2 rounded-full bg-[#6c8b49]" aria-label="Chưa đọc" />}{item.title}</h3><time className="text-xs text-stone-500" dateTime={item.createdAt}>{dateText(item.createdAt)}</time></div><p className="!mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-600">{item.message}</p><div className="!mt-4 flex flex-wrap gap-2 text-xs text-stone-500"><span className="rounded-full bg-stone-100 px-3 py-1">Email: {channelLabels[item.emailStatus] || item.emailStatus} · {item.emailAttempts} lần thử</span><span className="rounded-full bg-stone-100 px-3 py-1">Push: {channelLabels[item.firebaseStatus] || item.firebaseStatus} · {item.firebaseAttempts} lần thử</span></div><div className="!mt-4 flex flex-wrap items-center gap-3"><Link to={notificationTarget({ variantId: item.variantId })} className="inline-flex items-center gap-1 text-sm underline underline-offset-4">Xem tồn kho <ArrowUpRight size={15} /></Link>{!item.readAt && <Button variant="ghost" size="sm" disabled={!!busyId} onClick={() => action(item)}><Check size={15} />Đánh dấu đã đọc</Button>}{[item.emailStatus, item.firebaseStatus].some((s) => ['pending', 'failed'].includes(s)) && <Button variant="outline" size="sm" disabled={!!busyId} onClick={() => action(item, true)}><RefreshCw size={14} />Thử gửi lại</Button>}</div></li>)}</ul>}
      <Pagination page={page} size={10} totalPages={list.data?.totalPages || 0} totalElements={list.data?.totalElements || 0} onChange={setPage} />
    </section>
  </>;
}
