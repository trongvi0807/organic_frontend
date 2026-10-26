import { Star } from 'lucide-react';

export function StarRating({ value = 0, size = 15 }) {
  return <span className="star-rating" role="img" aria-label={`${Number(value).toFixed(1)} trên 5 sao`}>{[1,2,3,4,5].map((star) => <Star key={star} size={size} aria-hidden="true" fill={star <= Math.round(value) ? 'currentColor' : 'none'} />)}</span>;
}
