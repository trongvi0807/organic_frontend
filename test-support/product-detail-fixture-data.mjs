// Visual QA only. Repeated photo URLs with different queries exercise the gallery;
// they are not genuine alternative angles. No database, upload or review publication.
export function productDetailFixture(db) {
  const source = db.products[0];
  const products = [source, ...[2,3].map((number) => ({ ...source, id: `11111111-1111-4111-8111-11111111111${number}`, slug: `rau-cu-qa-${number}`, productCode: `QA-SP00${number}`, productName: `Rau củ kiểm thử ${number}` }))];
  const variants = (product) => [
    { id: `${product.id}-small`, sku: `${product.productCode}-500`, variantName: 'Gói 500g', netQuantity: .5, unitId: 'kg', sellingPrice: 28000, compareAtPrice: 32000, status: 'active' },
    { id: `${product.id}-large`, sku: `${product.productCode}-1000`, variantName: 'Gói 1kg', netQuantity: 1, unitId: 'kg', sellingPrice: 50000, compareAtPrice: null, status: 'active' },
  ];
  const card = (product) => ({ ...product, name: product.productName, imageUrl: '/images/carrots.jpg', defaultVariantId: variants(product)[0].id, defaultVariantName: 'Gói 500g', defaultPrice: 28000, organicVerified: true });
  const ratings = [5,5,4,3,5,4,2,5];
  const summary = { totalReviews: ratings.length, averageRating: ratings.reduce((sum,n) => sum+n,0)/ratings.length, distribution: [5,4,3,2,1].map((rating) => ({ rating, count: ratings.filter((n) => n === rating).length })) };
  return {
    list() { return products.map(card); },
    find(value) { return products.find((product) => product.id === value || product.slug === value); },
    detail(product) { return { ...product, images: [1,2,3].map((index) => ({ id: `qa-photo-${index}`, imageUrl: `/images/carrots.jpg?qa-photo=${index}`, altText: `Ảnh QA ${index} của ${product.productName}`, isPrimary: index === 1, sortOrder: index })), variants: variants(product), defaultVariantId: variants(product)[0].id, currency: 'VND', minPrice: 28000, maxPrice: 50000, canAddToCart: true, checkoutAvailable: false, quantityRule: { mode: 'whole_package', minimum: 1, step: 1 }, organicVerified: true,
      origin: { originName: 'Vùng trồng kiểm thử', region: 'Lâm Đồng', country: 'Việt Nam', producerName: 'Cơ sở QA' },
      certifications: db.certifications.map((cert) => ({ ...cert, currentlyValid: cert.status === 'verified' && !cert.archived })),
      reviewSummary: summary, relatedProducts: products.filter((other) => other.id !== product.id).map(card) }; },
    reviews(product, params) {
      const rating = Number(params.get('rating')), sort = params.get('sort') || 'newest', page = Number(params.get('page') || 0), size = Number(params.get('size') || 6);
      let rows = ratings.map((value,index) => ({ id: `${product.id}-review-${index}`, rating: value, title: `Đánh giá QA ${index+1}`, content: 'Nội dung giả lập để kiểm tra giao diện đọc đánh giá. Không phải nhận xét của khách hàng thật.', reviewerName: `${String.fromCharCode(65+index)}***`, verifiedPurchase: true, variantName: 'Gói 500g', createdAt: `2026-10-${String(21-index).padStart(2,'0')}T08:00:00`, images: index === 0 ? [{ id:'review-photo', imageUrl:'/images/carrots.jpg', altText:'Ảnh QA trong đánh giá', sortOrder:0 }] : [] }));
      if (rating) rows = rows.filter((row) => row.rating === rating);
      if (sort === 'highest') rows.sort((a,b) => b.rating-a.rating);
      if (sort === 'lowest') rows.sort((a,b) => a.rating-b.rating);
      return { summary, reviews: { content: rows.slice(page*size,(page+1)*size), page, size, totalElements:rows.length, totalPages:Math.ceil(rows.length/size) } };
    },
  };
}
