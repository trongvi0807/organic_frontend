import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResource } from '@/hooks/useResource';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { StatusBadge } from './StatusBadge';

export function RelatedProducts({ service, id }) {
  const [page, setPage] = useState(0);
  const resource = useResource(() => service.products(id, { page, size: 5 }), [id, page]);
  return <section className="related-products"><h3>Sản phẩm liên kết</h3><ResourceState loading={resource.loading} error={resource.error} empty={resource.data?.items.length === 0} onRetry={resource.reload} />{!resource.loading && !resource.error && !!resource.data?.items.length && <><div className="related-list">{resource.data.items.map((product) => <div key={product.id}><div><strong>{product.productName}</strong><small>{product.productCode}</small></div><StatusBadge status={product.status} /><Link to={`/admin/traceability?product=${product.id}`}>Xem truy xuất</Link></div>)}</div><Pagination page={page} size={5} totalPages={resource.data.totalPages} totalElements={resource.data.totalElements} onChange={setPage} /></>}</section>;
}
