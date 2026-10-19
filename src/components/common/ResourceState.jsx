import { Leaf, RefreshCw, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ResourceState({ loading, error, empty, onRetry }) {
  if (loading) return <div className="resource-state" role="status"><Leaf className="animate-pulse" size={28} /><p>Đang chuẩn bị những điều tươi lành…</p></div>;
  if (error) return <div className="resource-state" role="alert"><RefreshCw size={28} /><p>{error}</p><Button onClick={onRetry} variant="outline">Thử lại</Button></div>;
  if (empty) return <div className="resource-state"><SearchX size={32} /><h3>Chưa tìm thấy kết quả</h3><p>Thử từ khóa khác hoặc chọn lại danh mục nhé.</p></div>;
  return null;
}
