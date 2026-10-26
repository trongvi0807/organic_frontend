import { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';

export function MediaViewer({ items, initialIndex = 0, title = 'Xem ảnh sản phẩm', onClose }) {
  const [index, setIndex] = useState(Math.min(initialIndex, items.length - 1));
  const [failed, setFailed] = useState(false);
  const current = items[index];
  const move = (step) => { setFailed(false); setIndex((value) => (value + step + items.length) % items.length); };
  return <Modal open onOpenChange={(open) => { if (!open) onClose(); }} title={title} description={`${index + 1} / ${items.length}`} className="media-viewer">
    <div className="media-viewer-body" onKeyDown={(e) => { if (e.target.tagName === 'VIDEO' || items.length < 2) return; if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); } if (e.key === 'ArrowRight') { e.preventDefault(); move(1); } }}>
      <div className="media-viewer-stage">{failed || !current ? <div className="media-unavailable"><ImageOff size={30} /><p>Không thể tải tệp này.</p></div> : current.type === 'video' ? <video key={current.url} src={current.url} poster={current.poster || undefined} controls playsInline preload="metadata" aria-label={current.alt || 'Video đánh giá'} onError={() => setFailed(true)} /> : <img src={current.url} alt={current.alt || 'Ảnh sản phẩm'} onError={() => setFailed(true)} />}</div>
      {items.length > 1 && <div className="viewer-navigation"><button className="icon-button" aria-label="Tệp trước" onClick={() => move(-1)}><ChevronLeft /></button><span>{index + 1} / {items.length}</span><button className="icon-button" aria-label="Tệp tiếp theo" onClick={() => move(1)}><ChevronRight /></button></div>}
    </div>
  </Modal>;
}
