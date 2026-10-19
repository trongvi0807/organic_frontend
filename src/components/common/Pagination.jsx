import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Pagination({ page, totalPages, totalElements, size, onChange }) {
  return <div className="pagination"><span>{totalElements ? `${page * size + 1}–${Math.min((page + 1) * size, totalElements)} trong ${totalElements} kết quả` : '0 kết quả'}</span><div><Button size="icon" variant="outline" disabled={page === 0} onClick={() => onChange(page - 1)} aria-label="Trang trước"><ChevronLeft size={16} /></Button><span>Trang {page + 1} / {Math.max(totalPages, 1)}</span><Button size="icon" variant="outline" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)} aria-label="Trang sau"><ChevronRight size={16} /></Button></div></div>;
}
