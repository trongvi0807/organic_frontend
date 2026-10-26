import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResource } from '@/hooks/useResource';
import { orderService } from '@/services/admin/orderService';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
export default function PaymentReviewPage() {
  const [page, setPage] = useState(0);
  const list = useResource(() => orderService.reviewPayments({ page, size: 10 }), [page]);
  return <><div className="admin-page-heading"><div><span className="eyebrow">ĐỐI SOÁT THANH TOÁN</span><h1>Khoản thu cần kiểm tra.</h1><p>Tiền đến muộn hoặc trùng cần đối chiếu và xử lý thủ công tại nhà cung cấp.</p></div><Button variant="outline" onClick={list.reload}>Tải lại</Button></div><section className="admin-table-panel"><ResourceState loading={list.loading} error={list.error} empty={!list.data?.items.length} onRetry={list.reload} />{!list.loading && !list.error && <div className="table-scroll"><table className="data-table"><thead><tr><th>Tham chiếu thanh toán</th><th>Cổng</th><th>Số tiền nguyên tệ</th><th>Thông tin lỗi</th><th>Đơn liên quan</th></tr></thead><tbody>{list.data?.items.map((p) => <tr key={p.id}><td className="break-all">{p.id}</td><td>{p.gateway}</td><td>{Number(p.amount).toLocaleString('vi-VN')} {p.currency}</td><td>{p.failureCode}<small className="block">{p.failureMessage}</small></td><td><Link className="underline" to={`/admin/sales-orders?orderId=${encodeURIComponent(p.orderId)}`}>Xem đơn</Link></td></tr>)}</tbody></table></div>}<Pagination page={page} size={10} totalPages={list.data?.totalPages || 0} totalElements={list.data?.totalElements || 0} onChange={setPage} /></section><p className="!mt-5 text-xs text-stone-500">Hiện backend chưa có API xác nhận hoàn tiền/giải quyết khoản cần đối soát. Danh sách này không tự đánh dấu đã xử lý.</p></>;
}
