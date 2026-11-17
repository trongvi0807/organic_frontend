import { Link } from 'react-router-dom';
import { useResource } from '@/hooks/useResource';
import { clearanceService } from '@/services/admin/clearanceService';

export function CrossSellSuggestions({ productId }) {
  const result = useResource(() => clearanceService.crossSell(productId), [productId]);
  if (!result.data?.length) return null;
  return <section className="!my-7 rounded-2xl border border-line p-5" aria-label="Gợi ý mua kèm">
    <h2 className="!mb-2 !font-sans !text-lg font-semibold">Gợi ý mua kèm</h2>
    <p className="!mb-3 text-xs leading-6 text-stone-500">Những sản phẩm thường được mua cùng trong các đơn đã hoàn tất.</p>
    <div className="flex flex-wrap gap-3">{result.data.map(row => <Link key={row.productId} to={row.slug ? `/san-pham/${encodeURIComponent(row.slug)}` : `/san-pham/id/${row.productId}`} className="rounded-xl border border-line bg-sage px-4 py-3 text-sm font-medium text-primary hover:underline">{row.productName} →</Link>)}</div>
  </section>;
}
