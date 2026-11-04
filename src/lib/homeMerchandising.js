// Older catalogs may contain categories created for a combo campaign.
// Hide those from category discovery without changing products or their assignments.
export const shoppingCategories = categories => (categories || []).filter(category =>
  !/combo/i.test(`${category.name || category.categoryName || ''} ${category.code || category.categoryCode || ''}`));

export const discountedProductCards = products => [...new Map((products || []).filter(product => {
  const price = Number(product.minPrice), original = Number(product.compareAtPrice);
  return Number.isFinite(price) && Number.isFinite(original) && price > 0 && original > price;
}).map(product => [product.id, product])).values()];
