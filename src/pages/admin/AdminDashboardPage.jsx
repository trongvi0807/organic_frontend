import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, CircleHelp, LayoutDashboard, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useResource } from '@/hooks/useResource';
import { useOrderRefresh } from '@/hooks/useOrderRefresh';
import { DEMO_MODE } from '@/services/api';
import { dashboardService } from '@/services/admin/dashboardService';
import { buildDashboard } from '@/lib/adminDashboard';
import { adminDate } from '@/lib/adminFormat';
import { hasRole, roleCodes } from '@/lib/permissions';
import { today } from '@/lib/apiData';
import { Button } from '@/components/ui/button';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { DashboardActivities, DashboardAlerts, DashboardRecentOrders, DashboardTasks } from '@/components/dashboard/DashboardOperations';
import { DashboardRecordDialog } from '@/components/dashboard/DashboardRecordDialog';
import '@/styles/admin-dashboard-refresh.css';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  return <DashboardContent key={`${user?.username}:${roleCodes(user).sort().join(',')}`} user={user} />;
}

function DashboardContent({ user }) {
  const [days, setDays] = useState(7), [granularity, setGranularity] = useState('day'), [expiryDays, setExpiryDays] = useState(14), [demo, setDemo] = useState(DEMO_MODE), [selection, setSelection] = useState(null);
  const day = today();
  const snapshot = useResource(() => dashboardService.snapshot(user, { demo, today: day }), [demo, day]);
  useOrderRefresh(snapshot.reload, { enabled: !demo, interval: 60000 });
  const data = snapshot.data?.demo === demo ? snapshot.data : null;
  const loading = snapshot.loading || (!data && !snapshot.error);
  const model = useMemo(() => buildDashboard(data, { today: day, days, granularity, expiryDays }), [data, day, days, granularity, expiryDays]);
  const sources = data?.sources || {}, errors = Object.values(sources).filter((source) => source.status === 'error');
  const canStock = hasRole(user, 'ADMIN', 'WAREHOUSE_STAFF'), canManage = hasRole(user, 'ADMIN');
  const shortcuts = [
    ['/admin/sales-orders', 'Đơn bán & giao hàng', true], ['/admin/order-approvals', 'Duyệt đơn mua', canManage],
    ['/admin/inventory', 'Tồn kho / Lô', canStock], ['/admin/business-forms', 'Biểu mẫu & bản in', true],
  ].filter(([, , allowed]) => allowed);

  return <div className="adk-dashboard">
    <header className="adk-dashboard-heading">
      <div><p className="adk-dashboard-breadcrumb"><LayoutDashboard size={14} /> Quản trị <span>/</span> Tổng quan</p><h1>Tổng quan cửa hàng</h1><p className="adk-dashboard-greeting">Chào {user?.fullName || 'bạn'}, đây là tình hình hoạt động của cửa hàng.</p></div>
      <div className="adk-dashboard-heading-actions">
        <div className="adk-period-control" aria-label="Khoảng thời gian thống kê"><CalendarDays size={16} />{[[1, 'Hôm nay'], [7, '7 ngày'], [30, '30 ngày']].map(([value, label]) => <button key={value} type="button" aria-pressed={days === value} onClick={() => setDays(value)}>{label}</button>)}</div>
        <Button variant="outline" className="adk-refresh-button" onClick={() => snapshot.reload({ background: !!snapshot.data })} disabled={snapshot.loading}><RefreshCw size={15} className={snapshot.loading ? 'animate-spin' : ''} />Cập nhật</Button>
      </div>
    </header>

    <div className="adk-data-status"><p><span className={`adk-status-dot ${demo ? 'is-demo' : ''}`} />{demo ? 'Số liệu mô phỏng' : 'Dữ liệu từ hệ thống'}<span className="adk-status-divider">|</span>{adminDate(model.range.start)} – {adminDate(model.range.end)}</p><div>{snapshot.data?.loadedAt && <span>Cập nhật {adminDate(snapshot.data.loadedAt, true)}</span>}<button type="button" disabled={DEMO_MODE || snapshot.loading} onClick={() => { setSelection(null); setDemo(!demo); }}>{demo ? 'Quay lại dữ liệu thật' : 'Xem bản mẫu'}</button></div></div>
    {demo && <p className="adk-dashboard-notice" role="status">Đang xem dữ liệu mô phỏng thực phẩm organic. Đây không phải số liệu kinh doanh thực tế và không thực hiện thao tác duyệt trên chứng từ thật.</p>}
    {(errors.length > 0 || snapshot.error || snapshot.refreshError) && <div role="status" className="adk-dashboard-notice"><strong>Dữ liệu chưa đầy đủ.</strong> {snapshot.refreshError ? 'Chưa làm mới được số liệu; dữ liệu dưới đây là lần tải gần nhất.' : snapshot.error ? 'Chưa tải được Dashboard.' : `Chưa tải được: ${errors.map((source) => source.label).join(', ')}.`} Bấm Cập nhật để thử lại. Các phần chưa tải được không được coi là số 0.</div>}

    <DashboardMetrics model={model} loading={loading} />
    <DashboardCharts model={model} granularity={granularity} onGranularityChange={setGranularity} loading={loading} />
    <div className="adk-dashboard-grid adk-dashboard-grid--operations"><DashboardAlerts model={model} sources={sources} expiryDays={expiryDays} onExpiryDaysChange={setExpiryDays} onOpen={(type, row) => { if (row) setSelection({ type, row }); }} loading={loading} /><DashboardTasks model={model} sources={sources} onOpen={(type, row) => setSelection({ type, row })} loading={loading} /></div>
    <div className="adk-dashboard-grid adk-dashboard-grid--recent"><DashboardRecentOrders model={model} source={sources.orders} loading={loading} onOpen={(type, row) => setSelection({ type, row })} /><DashboardActivities model={model} sources={sources} loading={loading} onOpen={(type, row) => { if (row) setSelection({ type, row }); }} /></div>

    <nav className="adk-shortcuts" aria-label="Lối tắt vận hành"><p><ShieldCheck size={18} />Truy cập nhanh</p><div>{shortcuts.map(([href, label]) => <Link key={href} to={href}>{label}<ArrowUpRight size={14} /></Link>)}</div></nav>
    <p className="adk-dashboard-footnote"><CircleHelp size={15} /><span>Bộ lọc thời gian áp dụng doanh thu, biểu đồ và đơn gần đây. Cảnh báo kho, đơn còn mở và công việc chờ duyệt phản ánh tình trạng hiện tại.{model.excludedRevenueCount > 0 && ` Có ${model.excludedRevenueCount} đơn hoàn một phần hoặc dùng ngoại tệ chưa được tính vào doanh thu vì thiếu số tiền thuần bằng VNĐ.`}</span></p>
    {selection && <DashboardRecordDialog key={`${selection.type}:${selection.row.id || selection.row.variant?.id}`} selection={selection} demo={demo} user={user} onClose={() => setSelection(null)} />}
  </div>;
}
