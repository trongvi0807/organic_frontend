import { ArrowDownRight, ArrowUpRight, Banknote, Boxes, Clock3, Truck } from 'lucide-react';
import { currency } from '@/lib/utils';

const count = (value) => value == null ? '—' : value.toLocaleString('vi-VN');

export function DashboardMetrics({ model, loading }) {
  const growth = model.growth;
  const GrowthIcon = growth != null && growth < 0 ? ArrowDownRight : ArrowUpRight;
  const entries = [
    {
      label: 'Doanh thu đã thanh toán', value: model.revenue == null ? '—' : currency(model.revenue), icon: Banknote, tone: 'green',
      hint: model.revenue == null ? 'Chưa tải được dữ liệu đơn bán' : 'Theo ngày đặt đơn trong kỳ',
      extra: model.revenue != null && <span className={`adk-metric-change ${growth == null ? 'is-neutral' : growth < 0 ? 'is-down' : 'is-up'}`}>
        {growth != null && <GrowthIcon size={14} />}
        {growth == null ? 'Chưa có kỳ trước để so sánh' : growth === 0 ? 'Không đổi so với kỳ trước' : <><strong>{Math.abs(growth).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</strong><span>so với kỳ trước</span></>}
      </span>,
    },
    {
      label: 'Đơn hàng cần xử lý', value: count(model.processing), icon: Clock3, tone: 'blue',
      hint: 'Chờ xác nhận hoặc chuẩn bị hàng',
      extra: <span className="adk-metric-detail">Toàn bộ đơn mở · không gồm chờ thanh toán</span>,
    },
    {
      label: 'Giao hàng thành công', value: model.deliveryRate == null ? '—' : `${model.deliveryRate.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`, icon: Truck, tone: 'teal',
      hint: model.deliveryTotal ? `${model.delivered}/${model.deliveryTotal} đơn có kết quả giao trong kỳ` : 'Chưa có đơn giao xong trong kỳ',
      extra: <span className="adk-metric-detail">Không tính đơn đang vận chuyển</span>,
    },
    {
      label: 'Cảnh báo kho & hạn dùng', value: count(model.warningCount), icon: Boxes, tone: 'amber',
      hint: model.warningCount == null ? 'Cần dữ liệu kho và lô đã nhập' : `${model.lowStock.length} mức tồn thấp · ${model.alerts.length} lô cận/quá hạn`,
      extra: <span className="adk-metric-detail">Tình trạng kho hiện tại</span>,
    },
  ];
  return <section className="adk-metrics" aria-label="Chỉ số tổng quan cửa hàng">
    {entries.map(({ label, value, icon: Icon, tone, hint, extra }) => <article key={label} className={`adk-metric adk-metric--${tone}`}>
      <div className="adk-metric-heading"><p>{label}</p><span className="adk-metric-icon"><Icon size={21} strokeWidth={1.7} /></span></div>
      {loading ? <div className="adk-metric-skeleton" aria-label="Đang tải chỉ số" /> : <p className="adk-metric-value" aria-live="polite">{value}</p>}
      <p className="adk-metric-hint">{hint}</p>
      <div className="adk-metric-footer">{extra}</div>
    </article>)}
  </section>;
}
