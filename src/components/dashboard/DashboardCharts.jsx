import { RevenueTimeline } from './RevenueTimeline';
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartNoAxesCombined } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { currency } from '@/lib/utils';
import { adminDate } from '@/lib/adminFormat';

const colors = ['#32846B', '#91B8A0', '#C5AB78', '#7E9EBA', '#A89CBE', '#CBD7D0'];
const shortMoney = (value) => Math.abs(value) >= 1e6 ? `${(value / 1e6).toLocaleString('vi-VN', { signDisplay: 'negative', maximumFractionDigits: 1 })}tr` : Math.abs(value) >= 1000 ? `${(value / 1000).toLocaleString('vi-VN', { signDisplay: 'negative', maximumFractionDigits: 0 })}k` : String(value);

export function DashboardCharts({ model, granularity, onGranularityChange, loading }) {
  const categoriesReady = model.ready('revenue');
  const classified = model.categories.entries.filter((entry) => entry.key !== 'unclassified'), unknown = model.categories.entries.find((entry) => entry.key === 'unclassified');
  const categoryRows = classified.length > 5 ? [...classified.slice(0, 4), { key: 'other-categories', name: 'Danh mục khác', value: classified.slice(4).reduce((sum, row) => sum + row.value, 0) }] : classified;
  const categories = [...categoryRows, ...(unknown ? [unknown] : [])].map((entry, index) => ({ ...entry, fill: colors[index % colors.length] }));

  return <div className="adk-dashboard-grid adk-dashboard-grid--charts">
    <RevenueTimeline rows={model.chart} total={model.revenue} ready={model.ready('revenue')} loading={loading} granularity={granularity} onGranularityChange={onGranularityChange} />
    <Card className="adk-panel adk-category-panel"><CardHeader><div><CardTitle>Tiền hàng thuần theo danh mục</CardTitle><CardDescription>Sau giảm giá, điểm và tiền hoàn thành công</CardDescription></div><span className="adk-panel-tag">Trong kỳ</span></CardHeader><CardContent>
      {loading ? <ChartEmpty loading /> : !categoriesReady ? <ChartEmpty message="Chưa tải được báo cáo doanh thu." /> : model.categories.entries.some(row => row.value < 0) ? <div className="adk-table-scroll"><table className="adk-dashboard-table"><thead><tr><th>Danh mục</th><th>Tiền hàng thuần</th></tr></thead><tbody>{model.categories.entries.map(row => <tr key={row.key}><td>{row.name}</td><td>{currency(row.value)}</td></tr>)}</tbody></table><p className="adk-panel-note is-warning">Có điều chỉnh âm; dùng bảng để thể hiện đầy đủ tiền hoàn.</p></div> : categories.length ? <>
        <div className="adk-category-chart"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 300, height: 195 }}><PieChart accessibilityLayer><Pie data={categories} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={65} outerRadius={87} paddingAngle={3} cornerRadius={3} strokeWidth={0} isAnimationActive={false} /><Tooltip formatter={(value) => currency(value)} contentStyle={{ borderRadius: 8, borderColor: '#E6EAF0', fontSize: 12 }} /></PieChart></ResponsiveContainer><div className="adk-donut-label"><span>Tiền hàng</span><strong>{shortMoney(model.categories.total)} ₫</strong></div></div>
        <ul className="adk-category-breakdown">{categories.map((category) => {
          const percent = model.categories.total > 0 ? category.value / model.categories.total * 100 : 0;
          return <li key={category.key}><div><span><i style={{ background: category.fill }} />{category.name}</span><strong title={currency(category.value)}>{percent.toLocaleString('vi-VN', { signDisplay: 'negative', maximumFractionDigits: 1 })}%</strong></div><div className="adk-category-track"><span style={{ background: category.fill, width: `${Math.min(100, Math.max(0, percent))}%` }} /></div></li>;
        })}</ul>
        {model.categories.unclassified > 0 && <p className="adk-panel-note is-warning">Có {currency(model.categories.unclassified)} chưa nối được danh mục.</p>}<p className="adk-panel-note">Không gồm phí giao hàng và thu thanh lý. Phân loại theo hồ sơ sản phẩm hiện tại.</p>
      </> : <ChartEmpty message="Chưa phát sinh tiền hàng thuần trong kỳ." />}
    </CardContent></Card>
  </div>;
}

export function ChartEmpty({ loading, message }) {
  return <div className={`adk-chart-empty ${loading ? 'is-loading' : ''}`} role="status"><span><ChartNoAxesCombined size={26} strokeWidth={1.5} /></span><p>{loading ? 'Đang chuẩn bị số liệu…' : message}</p></div>;
}
