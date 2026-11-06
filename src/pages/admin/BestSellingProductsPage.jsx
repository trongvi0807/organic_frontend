import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Banknote, Boxes, CalendarDays, ChartNoAxesCombined, Package, RefreshCw, RotateCcw, Trophy } from 'lucide-react';
import { useResource } from '@/hooks/useResource';
import { salesReportService } from '@/services/admin/salesReportService';
import { salesPeriod, validateSalesRange } from '@/lib/salesReport';
import { adminDate } from '@/lib/adminFormat';
import { today } from '@/lib/apiData';
import { purchaseMoney, purchaseQuantity } from '@/lib/purchaseDocuments';
import { safeMediaUrl } from '@/lib/productDetail';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { AdminDateInput, AdminForm } from '@/components/admin/AdminForm';
import { ResourceState } from '@/components/common/ResourceState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import '@/styles/sales-report.css';

export default function BestSellingProductsPage() {
  const day = today();
  const [draft, setDraft] = useState(() => ({ ...salesPeriod('thirty', day), sortBy: 'quantity', limit: '10', categoryId: '', search: '' }));
  const [applied, setApplied] = useState(draft), [error, setError] = useState('');
  const report = useResource(() => salesReportService.bestSellers({ ...applied, limit: Number(applied.limit), categoryId: applied.categoryId || undefined, search: applied.search.trim() || undefined }), [applied]);
  const categories = useResource(salesReportService.categories, []);
  const data = report.data;
  const stale = JSON.stringify(draft) !== JSON.stringify(applied);
  function update(key, value) { setDraft(old => ({ ...old, [key]: value })); setError(''); }
  function apply(event) { event.preventDefault(); const issue = validateSalesRange(draft.from, draft.to, day); if (issue) { setError(issue); return; } if (!stale) report.reload(); else setApplied({ ...draft }); }
  const metric = data?.summary;
  const cards = [
    { label: 'Sản phẩm có kết quả bán', value: data?.productCount, icon: Package, money: false },
    { label: 'Số lượng bán thuần', value: metric?.netQuantity, icon: Boxes, money: false },
    { label: 'Doanh thu tiền hàng thuần', value: metric?.netRevenue, icon: Banknote, money: true },
    { label: 'Tiền hoàn thành công', value: metric?.refundedAmount, icon: RotateCcw, money: true },
  ];
  return <div className="sales-report space-y-6">
    <div className="admin-page-heading"><div><span className="eyebrow">THỐNG KÊ & BÁO CÁO</span><h1>Sản phẩm bán chạy<span className="heading-dot">.</span></h1><p>Xếp hạng theo kết quả bán thuần, đối chiếu tiền hàng và các khoản hoàn trả.</p></div><Button variant="outline" disabled={report.loading} onClick={() => report.reload()}><RefreshCw size={16} className={report.loading ? 'animate-spin' : ''} />Cập nhật</Button></div>
    <Card><CardHeader><div><CardTitle>Bộ lọc thống kê</CardTitle><CardDescription>Chọn khoảng ngày đặt đơn, tiêu chí xếp hạng và số sản phẩm muốn xem.</CardDescription></div><CalendarDays size={20} className="text-stone-400" /></CardHeader><CardContent>
      <div className="!mb-5 flex flex-wrap gap-2" aria-label="Khoảng thời gian nhanh">{[['today','Hôm nay'],['week','7 ngày'],['thirty','30 ngày'],['month','Tháng này']].map(([key,label])=><Button key={key} size="sm" variant="outline" onClick={()=>{setDraft(old=>({...old,...salesPeriod(key,day)}));setError('');}}>{label}</Button>)}</div>
      <AdminForm onSubmit={apply}><div className="sales-report-filters">
        <Field label="Từ ngày *"><AdminDateInput aria-label="Từ ngày thống kê" required value={draft.from} max={day} onChange={event=>update('from',event.target.value)} /></Field>
        <Field label="Đến ngày *"><AdminDateInput aria-label="Đến ngày thống kê" required value={draft.to} min={draft.from || undefined} max={day} onChange={event=>update('to',event.target.value)} /></Field>
        <Field label="Xếp hạng theo"><Select aria-label="Tiêu chí xếp hạng" value={draft.sortBy} onChange={event=>update('sortBy',event.target.value)}><option value="quantity">Số lượng bán thuần</option><option value="revenue">Doanh thu thuần</option></Select></Field>
        <Field label="Số sản phẩm hiển thị"><Select aria-label="Số sản phẩm xếp hạng" value={draft.limit} onChange={event=>update('limit',event.target.value)}>{[10,20,50,100].map(n=><option key={n} value={String(n)}>Top {n}</option>)}</Select></Field>
        <Field label="Danh mục"><Select aria-label="Danh mục thống kê" disabled={categories.loading || !!categories.error} value={draft.categoryId} onChange={event=>update('categoryId',event.target.value)}><option value="">Tất cả danh mục</option>{categories.data?.map(category=><option key={category.id} value={category.id}>{category.name}{category.status==='active'?'':' · Tạm ẩn'}</option>)}</Select></Field>
        <Field label="Tên hoặc mã sản phẩm"><Input aria-label="Tìm sản phẩm thống kê" value={draft.search} maxLength={150} placeholder="Nhập tên hoặc mã…" onChange={event=>update('search',event.target.value)} /></Field>
      </div>{categories.error&&<p className="form-error !mt-3" role="status">Chưa tải được danh mục. <button type="button" className="underline" onClick={categories.reload}>Thử lại</button></p>}{error&&<p className="form-error !mt-3" role="alert">{error}</p>}<div className="!mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-stone-500" role="status">{stale?'Bộ lọc đã thay đổi. Bấm Xem thống kê để áp dụng.':'Khoảng thời gian tối đa 366 ngày.'}</p><Button type="submit" disabled={report.loading}><ChartNoAxesCombined size={16} />Xem thống kê</Button></div></AdminForm>
    </CardContent></Card>
    <ResourceState loading={report.loading} error={report.error} onRetry={report.reload} />
    {data&&!report.loading&&!report.error&&<>
      <div className="flex flex-wrap justify-between gap-2 text-xs text-stone-500"><span>Kết quả: {adminDate(data.from)} – {adminDate(data.to)} · Theo {data.sortBy==='quantity'?'số lượng bán thuần':'doanh thu thuần'}</span><span>Cập nhật {adminDate(data.generatedAt,true)}</span></div>
      {data.warnings?.length>0&&<div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">{data.warnings.map(warning=><p key={warning}>{warning}</p>)}</div>}
      <div className="sales-report-metrics">{cards.map(({label,value,icon:Icon,money})=><Card key={label}><CardContent className="!p-5"><div className="flex items-start justify-between gap-3"><span className="text-xs leading-6 text-stone-500">{label}</span><Icon size={19} className="shrink-0 text-primary" /></div><strong className="!mt-3 block break-words text-2xl text-primary">{money?purchaseMoney(value):purchaseQuantity(value)}</strong><p className="!mt-2 text-xs leading-5 text-stone-400">Toàn bộ kết quả theo bộ lọc</p></CardContent></Card>)}</div>
      <Card><CardHeader><div><CardTitle>Bảng xếp hạng sản phẩm</CardTitle><CardDescription>Hiển thị {data.items.length}/{data.productCount} sản phẩm. Các biến thể được gộp theo sản phẩm.</CardDescription></div><span className="inline-flex items-center gap-2 rounded-full bg-sage px-3 py-2 text-xs text-primary"><Trophy size={15} />Top {data.limit}</span></CardHeader><CardContent>
        {!data.items.length?<div className="py-10 text-center"><Package size={30} className="mx-auto text-stone-400" /><h3 className="!mt-4 font-semibold text-primary">Chưa có sản phẩm phù hợp</h3><p className="!mt-2 text-sm text-stone-500">Thử khoảng thời gian hoặc bộ lọc khác. Đơn đang xử lý và chưa thanh toán chưa được tính.</p></div>:<>
          <div className="sales-report-leaders" aria-label="Các sản phẩm dẫn đầu">{data.items.slice(0,3).map(row=><div key={row.productId} className="rounded-xl border border-line bg-cream p-4"><span className="text-xs font-semibold text-stone-500">HẠNG {row.rank}</span><strong className="!mt-2 block break-words text-sm text-primary">{row.productName}</strong><p className="!mt-2 text-sm font-semibold text-primary">{data.sortBy==='quantity'?`${purchaseQuantity(row.netQuantity)} đơn vị bán`:purchaseMoney(row.netRevenue)}</p></div>)}</div>
          <div className="table-scroll !mt-5"><table className="data-table sales-ranking-table"><thead><tr><th>Hạng</th><th>Sản phẩm</th><th>Danh mục</th><th>Bán thuần</th><th>Doanh thu thuần</th><th>Số đơn</th><th>Đã bán</th><th>Hoàn tất hoàn tiền</th><th>Tiền hàng sau giảm</th><th>Tiền đã hoàn</th></tr></thead><tbody>{data.items.map(row=><tr key={row.productId}><td><span className={`inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold ${row.rank<=3?'bg-sage text-primary':'bg-stone-100 text-stone-500'}`}>{row.rank}</span></td><td><div className="flex min-w-52 items-center gap-3">{safeMediaUrl(row.imageUrl)?<img src={safeMediaUrl(row.imageUrl)} alt="" className="size-11 shrink-0 rounded-lg object-cover" />:<span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-sage text-primary"><Package size={20} /></span>}<div><strong className="block text-sm">{row.productName}</strong><small className="block text-stone-500">{row.productCode} · {row.variantCount} biến thể</small></div></div></td><td>{row.categoryName}</td><td className="font-semibold text-primary">{purchaseQuantity(row.netQuantity)}</td><td className="whitespace-nowrap font-semibold text-primary">{purchaseMoney(row.netRevenue)}</td><td>{purchaseQuantity(row.orderCount)}</td><td>{purchaseQuantity(row.soldQuantity)}</td><td>{purchaseQuantity(row.refundedQuantity)}</td><td className="whitespace-nowrap">{purchaseMoney(row.salesAmount)}</td><td className="whitespace-nowrap">{purchaseMoney(row.refundedAmount)}</td></tr>)}</tbody></table></div>
        </>}
      </CardContent></Card>
      <Card><CardHeader><div><CardTitle>Quy tắc tính số liệu</CardTitle><CardDescription>Tính tiền hàng sau giảm giá, trừ hoàn thành công; loại đơn hủy và giao đổi miễn phí.</CardDescription></div></CardHeader><CardContent><details className="sales-report-rules"><summary>Xem cách tính chi tiết</summary><ul className="list-disc space-y-2 pl-5 text-xs leading-7 text-stone-500">
        <li>Chọn theo ngày đặt đơn trong kỳ, tính cả ngày đầu và ngày cuối. Hoàn trả được cập nhật đến thời điểm tra cứu, kể cả xử lý sau ngày cuối kỳ.</li>
        <li>Chỉ tính đơn bán đã giao/hoàn tất và đã thanh toán hoặc hoàn một phần bằng VNĐ. Loại đơn hủy, trả toàn bộ, hoàn tiền toàn bộ, đơn giao đổi và phiếu thanh lý.</li>
        <li>Bán thuần = số lượng đã bán − số lượng trong hồ sơ hoàn tiền đã hoàn tất. Đổi cùng sản phẩm không giảm số bán và không được tính lại lượt giao đổi.</li>
        <li>Doanh thu thuần = tiền hàng sau giảm giá và điểm − tiền hoàn thành công. Khoản đang chờ, thất bại hoặc chờ đối soát chưa được trừ; tiền hoàn một phần được phân bổ theo số tiền đã duyệt từng sản phẩm.</li>
        <li>Số lượng là số đơn vị bán của từng biến thể (gói/hộp/chai/túi…), không quy đổi kg/lít. Không gồm phí vận chuyển. Các thẻ tổng tính toàn bộ bộ lọc, không chỉ Top đang hiển thị.</li>
        <li>Đồng hạng được sắp tiếp theo chỉ tiêu còn lại, mã sản phẩm để thứ tự ổn định. Tên và danh mục theo thông tin sản phẩm hiện tại.</li>
      </ul></details></CardContent></Card>
      <Link className="inline-flex items-center gap-2 text-sm font-medium text-primary underline underline-offset-4" to="/admin/dashboard">Về tổng quan cửa hàng<ArrowUpRight size={15} /></Link>
    </>}
  </div>;
}
