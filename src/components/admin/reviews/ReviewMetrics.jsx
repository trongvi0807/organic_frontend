export const reviewNumber = (value, digits = 0) => Number(value || 0).toLocaleString('vi-VN', { signDisplay: 'negative', maximumFractionDigits: digits });
export const reviewSentiment = (rating) => rating <= 2 ? { label: 'Tiêu cực', color: 'bg-rose-50 text-rose-700' } : rating === 3 ? { label: 'Trung lập', color: 'bg-amber-50 text-amber-800' } : { label: 'Tích cực', color: 'bg-emerald-50 text-emerald-800' };

export function ReviewMetrics({ product }) {
  const metrics = [
    ['Tổng đánh giá', reviewNumber(product.totalReviews), 'text-emerald-950'],
    ['Điểm trung bình', product.totalReviews ? `${reviewNumber(product.averageRating, 2)} / 5` : 'Chưa có', 'text-amber-700'],
    ['Đánh giá tiêu cực', reviewNumber(product.negativeCount), 'text-rose-700'],
    ['Tỷ lệ tiêu cực', `${reviewNumber(product.negativeRate, 1)}%`, 'text-rose-700'],
  ];
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map(([label, value, color]) => <div key={label} className="rounded-2xl border border-emerald-900/10 bg-white p-5"><p className="text-xs text-stone-500">{label}</p><strong className={`mt-2 block text-2xl tabular-nums ${color}`}>{value}</strong></div>)}</div>;
}
