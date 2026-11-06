import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, CalendarDays, Download, RefreshCw } from 'lucide-react';
import { useResource } from '@/hooks/useResource';
import { salesReportService } from '@/services/admin/salesReportService';
import { salesPeriod, validateSalesRange } from '@/lib/salesReport';
import { revenueChartRows, revenueCsv } from '@/lib/revenueReport';
import { today } from '@/lib/apiData';
import { adminDate } from '@/lib/adminFormat';
import { purchaseMoney, purchaseQuantity } from '@/lib/purchaseDocuments';
import { AdminForm, AdminDateInput } from '@/components/admin/AdminForm';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { RevenueTimeline } from '@/components/dashboard/RevenueTimeline';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import '@/styles/admin-dashboard-refresh.css';
import '@/styles/revenue-report.css';

export default function RevenueReportPage(){
  const day=today();const [draft,setDraft]=useState(()=>salesPeriod('thirty',day)),[applied,setApplied]=useState(draft),[granularity,setGranularity]=useState('day'),[error,setError]=useState(''),[page,setPage]=useState(0);
  const report=useResource(()=>salesReportService.revenue({...applied,granularity}),[applied,granularity]);
  const data=report.data,stale=JSON.stringify(draft)!==JSON.stringify(applied);
  function apply(event){event.preventDefault();const issue=validateSalesRange(draft.from,draft.to,day);if(issue){setError(issue);return;}setError('');setPage(0);if(stale)setApplied({...draft});else report.reload();}
  function group(value){setPage(0);setGranularity(value);}
  function download(){if(!data||report.loading||report.error)return;const url=URL.createObjectURL(new Blob([revenueCsv(data)],{type:'text/csv;charset=utf-8;'}));const link=document.createElement('a');link.href=url;link.download=`bao-cao-doanh-thu-${data.from}-${data.to}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const cards=data?[
    ['Tiền hàng trước giảm',data.summary.grossSales],['Giảm giá & điểm thưởng',data.summary.discounts],['Tiền hoàn thành công',data.summary.refunds],
    ['Tiền hàng thuần',data.summary.salesNet],['Thu bán thanh lý',data.summary.liquidationRevenue],['Tổng doanh thu thuần',data.summary.totalNet],
  ]:[];
  return <div className="adk-dashboard revenue-report">
    <div className="admin-page-heading"><div><span className="eyebrow">THỐNG KÊ & BÁO CÁO</span><h1>Báo cáo doanh thu<span className="heading-dot">.</span></h1><p>Đối chiếu tiền hàng, giảm giá, tiền hoàn và thu bán thanh lý trong kỳ.</p></div><div className="flex flex-wrap gap-3"><Button variant="outline" disabled={report.loading} onClick={()=>report.reload()}><RefreshCw size={16}/>Cập nhật</Button><Button variant="outline" disabled={!data||report.loading||!!report.error} onClick={download}><Download size={16}/>Xuất CSV</Button></div></div>
    <Card><CardHeader><div><CardTitle>Khoảng thời gian báo cáo</CardTitle><CardDescription>Theo ngày đặt đơn gốc; hoàn tiền cập nhật đến hiện tại, thu thanh lý theo ngày hoàn tất.</CardDescription></div><CalendarDays size={20} className="text-stone-400"/></CardHeader><CardContent>
      <div className="!mb-4 flex flex-wrap gap-2">{[['today','Hôm nay'],['week','7 ngày'],['thirty','30 ngày'],['month','Tháng này']].map(([key,label])=><Button key={key} variant="outline" size="sm" onClick={()=>{setDraft(salesPeriod(key,day));setError('');}}>{label}</Button>)}</div>
      <AdminForm onSubmit={apply}><div className="revenue-report-dates"><Field label="Từ ngày *"><AdminDateInput aria-label="Từ ngày báo cáo" required value={draft.from} max={day} onChange={e=>setDraft(old=>({...old,from:e.target.value}))}/></Field><Field label="Đến ngày *"><AdminDateInput aria-label="Đến ngày báo cáo" required value={draft.to} min={draft.from||undefined} max={day} onChange={e=>setDraft(old=>({...old,to:e.target.value}))}/></Field><Button type="submit" disabled={report.loading}><Banknote size={16}/>Xem báo cáo</Button></div>{error&&<p className="form-error !mt-3" role="alert">{error}</p>}<p className="!mt-3 text-xs leading-6 text-stone-500" role="status">{stale?'Bộ lọc đã thay đổi. Bấm Xem báo cáo để áp dụng.':'Mỗi lần xem tối đa 366 ngày. Kỳ so sánh là khoảng liền trước có cùng số ngày.'}</p></AdminForm>
    </CardContent></Card>
    <ResourceState loading={report.loading} error={report.error} onRetry={report.reload}/>
    {data&&!report.loading&&!report.error&&<>
      <div className="flex flex-wrap justify-between gap-2 text-xs text-stone-500"><span>Kết quả {adminDate(data.from)} – {adminDate(data.to)} · {purchaseQuantity(data.summary.orderCount)} đơn được tính · {purchaseQuantity(data.summary.liquidationCount)} phiếu thanh lý</span><span>Cập nhật {adminDate(data.generatedAt,true)}</span></div>
      {!!data.warnings.length&&<div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">{data.warnings.map(w=><p key={w}>{w}</p>)}</div>}
      <div className="revenue-report-metrics">{cards.map(([label,value],index)=><Card key={label} className={index===5?'revenue-report-net':''}><CardContent className="!p-5"><span className="text-xs leading-6 text-stone-500">{label}</span><strong className={`!mt-3 block break-words text-2xl ${Number(value)<0?'text-red-700':'text-primary'}`}>{purchaseMoney(value)}</strong></CardContent></Card>)}</div>
      <Card><CardContent className="!p-5"><div className="flex flex-wrap justify-between gap-3 text-sm"><span>Kỳ trước {adminDate(data.previousFrom)} – {adminDate(data.previousTo)}: <strong>{purchaseMoney(data.previousSummary.totalNet)}</strong></span><strong className={data.growthPercent!=null&&Number(data.growthPercent)<0?'text-red-700':'text-primary'}>{data.growthPercent==null?'Chưa đủ cơ sở tính tỷ lệ tăng trưởng':`${Number(data.growthPercent)>0?'+':''}${Number(data.growthPercent).toLocaleString('vi-VN',{maximumFractionDigits:2})}% so với kỳ trước`}</strong></div><p className="!mt-2 text-xs leading-6 text-stone-500">Phí giao hàng ghi riêng để đối chiếu: {purchaseMoney(data.summary.shippingFees)}; không cộng vào doanh thu tiền hàng.</p></CardContent></Card>
      <RevenueTimeline rows={revenueChartRows(data)} total={data.summary.totalNet} ready loading={false} granularity={granularity} onGranularityChange={group} monthly/>
      <Card><CardHeader><div><CardTitle>Chi tiết theo {granularity==='day'?'ngày':granularity==='week'?'tuần':'tháng'}</CardTitle><CardDescription>Ngày không phát sinh vẫn hiển thị 0; các cột tiền tính bằng VNĐ.</CardDescription></div></CardHeader><CardContent><div className="table-scroll"><table className="data-table"><thead><tr><th>Khoảng ngày</th><th>Tổng thuần</th><th>Tiền hàng thuần</th><th>Thu thanh lý</th><th>Tiền hoàn</th><th>Trước giảm</th><th>Giảm giá & điểm</th><th>Số đơn</th></tr></thead><tbody>{data.periods.slice(page*15,page*15+15).map(row=><tr key={row.from}><td className="whitespace-nowrap">{adminDate(row.from)}{row.from!==row.to&&` – ${adminDate(row.to)}`}</td><td className="whitespace-nowrap font-semibold text-primary">{purchaseMoney(row.amounts.totalNet)}</td><td>{purchaseMoney(row.amounts.salesNet)}</td><td>{purchaseMoney(row.amounts.liquidationRevenue)}</td><td>{purchaseMoney(row.amounts.refunds)}</td><td>{purchaseMoney(row.amounts.grossSales)}</td><td>{purchaseMoney(row.amounts.discounts)}</td><td>{row.amounts.orderCount}</td></tr>)}</tbody></table></div><Pagination page={page} size={15} totalPages={Math.ceil(data.periods.length/15)} totalElements={data.periods.length} onChange={setPage}/></CardContent></Card>
      <Card><CardHeader><div><CardTitle>Tiền hàng theo danh mục</CardTitle><CardDescription>Phân bổ hoàn tiền đúng theo hồ sơ đã duyệt; không gồm thu thanh lý và phí giao hàng.</CardDescription></div></CardHeader><CardContent>{data.categories.length?<div className="table-scroll"><table className="data-table"><thead><tr><th>Danh mục</th><th>Thuần</th><th>Tiền hàng trước giảm</th><th>Giảm giá & điểm</th><th>Đã hoàn</th></tr></thead><tbody>{data.categories.map(row=><tr key={row.id||'unallocated'}><td>{row.name}</td><td className="font-semibold">{purchaseMoney(row.netRevenue)}</td><td>{purchaseMoney(row.grossSales)}</td><td>{purchaseMoney(row.discounts)}</td><td>{purchaseMoney(row.refunds)}</td></tr>)}</tbody></table></div>:<p className="text-sm text-stone-500">Chưa có đơn bán đủ điều kiện trong kỳ.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Quy tắc tính doanh thu</CardTitle></CardHeader><CardContent><details className="revenue-report-rules"><summary>Xem cách tính và xử lý hoàn trả</summary><ul className="!mt-3 list-disc space-y-2 pl-5 text-xs leading-7 text-stone-500">
        <li>Tiền hàng trước giảm = số lượng × đơn giá lịch sử. Giảm giá gồm khuyến mãi, voucher và điểm đã phân bổ trên dòng đơn; không trừ điểm lần thứ hai.</li>
        <li>Tiền hàng thuần = trước giảm − giảm giá/điểm − khoản hoàn thành công. Tổng doanh thu thuần = tiền hàng thuần + tiền thực thu từ phiếu bán thanh lý hoàn tất.</li>
        <li>Tính đơn bán đã giao/hoàn tất, đã thanh toán, hoàn một phần hoặc hoàn toàn bộ. Đơn trả toàn bộ đã hoàn đủ vẫn thể hiện cả tiền bán và tiền hoàn. Loại đơn hủy, chưa giao, chưa thanh toán và đơn giao đổi miễn phí.</li>
        <li>Tiền hoàn chỉ tính giao dịch thành công; không trừ khoản đang chờ, thất bại hoặc chờ đối soát. Hoàn sau ngày cuối kỳ vẫn điều chỉnh đơn gốc thuộc kỳ.</li>
        <li>Phí giao hàng không tính vào doanh thu tiền hàng. Báo cáo dùng VNĐ; không tự đổi ngoại tệ. Tiêu hủy hoặc phiếu thanh lý chưa hoàn tất không tạo doanh thu.</li>
        <li>Đây là kết quả bán hàng của nhóm đơn đặt trong kỳ, không phải sổ thu/chi theo ngày giao dịch và không phải lợi nhuận. Tổng có thể âm nếu dữ liệu nguồn ghi nhận hoàn vượt tiền hàng; luôn hiển thị để đối chiếu.</li>
        <li>Dữ liệu thiếu tiền hàng hoặc thiếu bằng chứng hoàn tiền được cảnh báo và loại khỏi tổng; không tự suy đoán khoản hoàn.</li>
      </ul></details></CardContent></Card>
      <Link to="/admin/dashboard" className="text-sm font-medium text-primary underline underline-offset-4">Về tổng quan cửa hàng</Link>
    </>}
  </div>;
}
