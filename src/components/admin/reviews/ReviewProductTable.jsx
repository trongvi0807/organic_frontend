import { ArrowUpRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { reviewNumber } from './ReviewMetrics';

export function ReviewProductTable({ products, onOpen }) {
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>Sản phẩm</th><th className="!text-right">Đánh giá</th><th className="!text-right">Điểm TB</th><th className="!text-right">Tích cực</th><th className="!text-right">Trung lập</th><th className="!text-right">Tiêu cực</th><th className="!text-right">Tỷ lệ tiêu cực</th><th><span className="sr-only">Chi tiết</span></th></tr></thead>
    <tbody>{products.map((product) => <tr key={product.productId}><td><button type="button" className="flex items-center gap-3 text-left" onClick={() => onOpen(product.productId)}>
      {product.imageUrl ? <img src={product.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" loading="lazy" /> : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-50"><Package size={22} /></span>}
      <span><strong className="block max-w-72 text-sm font-semibold">{product.productName}</strong><small className="mt-1 block text-stone-500">{product.productCode}</small></span>
    </button></td><td className="!text-right tabular-nums">{reviewNumber(product.totalReviews)}</td><td className="!text-right tabular-nums">{reviewNumber(product.averageRating, 2)} ★</td><td className="!text-right tabular-nums text-emerald-700">{reviewNumber(product.positiveCount)}</td><td className="!text-right tabular-nums">{reviewNumber(product.neutralCount)}</td><td className="!text-right tabular-nums font-semibold text-rose-700">{reviewNumber(product.negativeCount)}</td><td className="!text-right"><span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">{reviewNumber(product.negativeRate, 1)}%</span></td><td><Button variant="ghost" size="sm" onClick={() => onOpen(product.productId)} aria-label={`Xem đánh giá ${product.productName}`}><ArrowUpRight size={18} /></Button></td></tr>)}</tbody>
  </table></div>;
}
