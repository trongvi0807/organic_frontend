import { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, Maximize2 } from 'lucide-react';
import { MediaViewer } from './MediaViewer';

export function ProductGallery({ images, name }) {
  const [selected, setSelected] = useState(0);
  const [viewer, setViewer] = useState(false);
  const [broken, setBroken] = useState([]);
  const photos = images.filter((item) => !broken.includes(item.url));
  const index = Math.min(selected, Math.max(0, photos.length - 1));
  const move = (step) => setSelected((index + step + photos.length) % photos.length);
  if (!photos.length) return <div className="product-gallery gallery-empty"><ImageOff size={42} strokeWidth={1} /><p>Chưa có ảnh sản phẩm</p></div>;
  return <div className="product-gallery" aria-label={`Ảnh ${name}`}>
    <div className="gallery-main"><button className="gallery-zoom" aria-label={`Phóng to ảnh ${index + 1} của ${name}`} onClick={() => setViewer(true)}><img src={photos[index].url} alt={photos[index].alt} fetchPriority="high" onError={() => setBroken((old) => [...old, photos[index].url])} /><span><Maximize2 size={16} />Phóng to</span></button><span className="gallery-counter">{index + 1} / {photos.length}</span>{photos.length > 1 && <><button className="gallery-arrow gallery-prev" aria-label="Ảnh sản phẩm trước" onClick={() => move(-1)}><ChevronLeft size={20} /></button><button className="gallery-arrow gallery-next" aria-label="Ảnh sản phẩm tiếp theo" onClick={() => move(1)}><ChevronRight size={20} /></button></>}</div>
    {photos.length > 1 && <div className="gallery-thumbnails" role="group" aria-label="Chọn góc nhìn sản phẩm">{photos.map((photo, i) => <button key={photo.id} aria-label={`Xem ảnh sản phẩm ${i + 1}`} aria-pressed={i === index} className={i === index ? 'selected' : ''} onClick={() => setSelected(i)}><img src={photo.url} alt={photo.alt} loading="lazy" /></button>)}</div>}
    <p className="gallery-hint">{photos.length > 1 ? 'Chọn ảnh nhỏ để xem thêm góc nhìn. ' : ''}Nhấn vào ảnh để xem lớn hơn.</p>
    {viewer && <MediaViewer items={photos} initialIndex={index} title={name} onClose={() => setViewer(false)} />}
  </div>;
}
