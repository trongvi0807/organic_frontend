import { useId, useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartNoAxesCombined, Table2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { currency } from '@/lib/utils';
import { adminDate } from '@/lib/adminFormat';

const colors = ['#32846B', '#91B8A0', '#C5AB78', '#7E9EBA', '#A89CBE', '#CBD7D0'];
const shortMoney = (value) => Math.abs(value) >= 1e6 ? `${(value / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}tr` : Math.abs(value) >= 1000 ? `${(value / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}k` : String(value);

function RevenueTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return <div className="adk-chart-tooltip"><strong>{adminDate(row.day)}{row.day !== row.endDay && ` – ${adminDate(row.endDay)}`}</strong><p>Doanh thu <span>{currency(row.revenue)}</span></p><p>Số đơn <span>{row.orders}</span></p></div>;
}

export function DashboardCharts({ model, granularity, onGranularityChange, loading }) {
  const [table, setTable] = useState(false), id = useId();
  const gradientId = `adk-revenue-${id.replace(/:/g, '')}`;
  const salesReady = model.ready('orders'), categoriesReady = salesReady && model.ready('products');
  const classified = model.categories.entries.filter((entry) => entry.key !== 'unclassified'), unknown = model.categories.entries.find((entry) => entry.key === 'unclassified');
  const categoryRows = classified.length > 5 ? [...classified.slice(0, 4), { key: 'other-categories', name: 'Danh mục khác', value: classified.slice(4).reduce((sum, row) => sum + row.value, 0) }] : classified;
  const categories = [...categoryRows, ...(unknown ? [unknown] : [])].map((entry, index) => ({ ...entry, fill: colors[index % colors.length] }));

  return <div className="adk-dashboard-grid adk-dashboard-grid--charts">
    <Card className="adk-panel adk-revenue-panel">
      <CardHeader><div><CardTitle>Doanh thu & đơn hàng</CardTitle><CardDescription>Theo dõi kết quả kinh doanh trong kỳ</CardDescription></div><div className="adk-chart-controls"><div className="adk-segmented-control">{[['day', 'Ngày'], ['week', 'Tuần']].map(([key, label]) => <button type="button" key={key} aria-pressed={granularity === key} onClick={() => onGranularityChange(key)}>{label}</button>)}</div><button type="button" className="adk-icon-control" title={table ? 'Hiện biểu đồ' : 'Xem dữ liệu dạng bảng'} aria-label={table ? 'Hiện biểu đồ doanh thu' : 'Xem bảng số liệu doanh thu'} aria-pressed={table} aria-controls={id} onClick={() => setTable(!table)}><Table2 size={17} /></button></div></CardHeader>
      <CardContent>
        <div className="adk-chart-overview"><div><span>Doanh thu trong kỳ</span><strong>{loading || model.revenue == null ? '—' : currency(model.revenue)}</strong></div><div className="adk-chart-legend"><span><i />Doanh thu</span><span><i />Số đơn</span></div></div>
        {loading ? <ChartEmpty loading /> : !salesReady ? <ChartEmpty message="Chưa có dữ liệu đơn bán để vẽ biểu đồ." /> : <>
          {table ? <div id={id} className="adk-table-scroll adk-chart-table"><table className="adk-dashboard-table"><caption className="sr-only">Doanh thu đã thanh toán và số đơn theo ngày đặt</caption><thead><tr><th>Thời gian</th><th className="is-number">Doanh thu</th><th className="is-number">Số đơn</th></tr></thead><tbody>{model.chart.map((row) => <tr key={row.day}><td>{adminDate(row.day)}{row.day !== row.endDay && ` – ${adminDate(row.endDay)}`}</td><td className="is-number">{currency(row.revenue)}</td><td className="is-number">{row.orders}</td></tr>)}</tbody></table></div> : <div id={id} className="adk-revenue-chart" role="img" aria-label="Biểu đồ doanh thu đã thanh toán và số đơn; dùng nút Xem bảng số liệu để đọc từng giá trị"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 270 }}><ComposedChart data={model.chart} margin={{ top: 12, right: 0, bottom: 4, left: -12 }} accessibilityLayer>
            <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#32846B" stopOpacity={0.18} /><stop offset="95%" stopColor="#32846B" stopOpacity={0.015} /></linearGradient></defs>
            <CartesianGrid vertical={false} stroke="#EDF0F3" strokeDasharray="3 4" /><XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} tick={{ fill: '#8D97A7', fontSize: 11 }} dy={8} /><YAxis yAxisId="money" tickFormatter={shortMoney} tickLine={false} axisLine={false} tick={{ fill: '#8D97A7', fontSize: 11 }} width={60} /><YAxis yAxisId="orders" orientation="right" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#AF9466', fontSize: 11 }} width={30} /><Tooltip content={<RevenueTooltip />} />
            <Area name="Doanh thu (VNĐ)" yAxisId="money" dataKey="revenue" type="monotone" stroke="#32846B" strokeWidth={2.8} fill={`url(#${gradientId})`} dot={model.chart.length < 10 ? { r: 3.5, fill: '#32846B', stroke: '#fff', strokeWidth: 2 } : false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 3 }} isAnimationActive={false} /><Line name="Số đơn" yAxisId="orders" dataKey="orders" type="monotone" stroke="#BBA16E" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
          </ComposedChart></ResponsiveContainer></div>}
          <p className="adk-panel-note">Doanh thu từ đơn đã thanh toán, theo ngày đặt; loại đơn hủy/trả và chưa trừ hoàn tiền thực tế. Số đơn gồm mọi trạng thái.</p>
        </>}
      </CardContent>
    </Card>
    <Card className="adk-panel adk-category-panel"><CardHeader><div><CardTitle>Doanh thu theo danh mục</CardTitle><CardDescription>Cơ cấu tiền hàng sau giảm giá</CardDescription></div><span className="adk-panel-tag">Trong kỳ</span></CardHeader><CardContent>
      {loading ? <ChartEmpty loading /> : !categoriesReady ? <ChartEmpty message="Chưa tải đủ đơn bán và thông tin danh mục." /> : categories.length ? <>
        <div className="adk-category-chart"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 300, height: 195 }}><PieChart accessibilityLayer><Pie data={categories} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={65} outerRadius={87} paddingAngle={3} cornerRadius={3} strokeWidth={0} isAnimationActive={false} /><Tooltip formatter={(value) => currency(value)} contentStyle={{ borderRadius: 8, borderColor: '#E6EAF0', fontSize: 12 }} /></PieChart></ResponsiveContainer><div className="adk-donut-label"><span>Tiền hàng</span><strong>{shortMoney(model.categories.total)} ₫</strong></div></div>
        <ul className="adk-category-breakdown">{categories.map((category) => {
          const percent = model.categories.total > 0 ? category.value / model.categories.total * 100 : 0;
          return <li key={category.key}><div><span><i style={{ background: category.fill }} />{category.name}</span><strong title={currency(category.value)}>{percent.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%</strong></div><div className="adk-category-track"><span style={{ background: category.fill, width: `${Math.min(100, Math.max(0, percent))}%` }} /></div></li>;
        })}</ul>
        {model.categories.unclassified > 0 && <p className="adk-panel-note is-warning">Có {currency(model.categories.unclassified)} chưa nối được danh mục.</p>}<p className="adk-panel-note">Không gồm phí giao hàng. Phân loại theo hồ sơ sản phẩm hiện tại.</p>
      </> : <ChartEmpty message="Chưa phát sinh tiền hàng đã thanh toán trong kỳ." />}
    </CardContent></Card>
  </div>;
}

export function ChartEmpty({ loading, message }) {
  return <div className={`adk-chart-empty ${loading ? 'is-loading' : ''}`} role="status"><span><ChartNoAxesCombined size={26} strokeWidth={1.5} /></span><p>{loading ? 'Đang chuẩn bị số liệu…' : message}</p></div>;
}
