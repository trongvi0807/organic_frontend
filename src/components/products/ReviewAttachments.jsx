import { useState } from 'react';
import { Play } from 'lucide-react';
import { reviewMedia } from '@/lib/productDetail';
import { MediaViewer } from './MediaViewer';

export function ReviewAttachments({ review }) {
  const [index, setIndex] = useState(null);
  const media = reviewMedia(review);
  if (!media.length) return null;
  return <>
    <div className="flex flex-wrap gap-3">{media.map((item, position) => <button key={item.id} type="button" onClick={() => setIndex(position)} className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-emerald-900/15 bg-emerald-50" aria-label={`Xem ${item.type === 'video' ? 'video' : 'ảnh'} ${position + 1}`}>
      {item.type === 'video' ? <Play size={24} /> : <img src={item.url} alt={item.alt || 'Ảnh đánh giá'} className="h-full w-full object-cover" loading="lazy" />}
    </button>)}</div>
    {index !== null && <MediaViewer items={media} initialIndex={index} title="Ảnh và video đánh giá" onClose={() => setIndex(null)} />}
  </>;
}
