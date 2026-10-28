// Each step uses the existing API contract. Keep confirmed IDs across retries.
export async function saveCatalogWorkflow({ values, price, originId, state }, { products, traceability }) {
  const desiredStatus = values.status;
  const saved = await products.save(state.productId, { ...values, status: state.currentStatus || 'draft' });
  if (!saved?.id) throw new Error('Backend chưa trả mã định danh sản phẩm. Tải lại danh sách để kiểm tra trước khi lưu tiếp.');
  state.productId = saved.id;
  state.currentStatus = saved.status;
  // A previous POST may have succeeded even if its response was interrupted.
  // The metadata response includes variants, so reuse the confirmed SKU on retry.
  state.variantId ||= saved.variants?.find((item) => item.sku === price.sku)?.id || null;
  const priced = await products.saveVariant(saved.id, state.variantId, price);
  if (!priced?.id) throw new Error('Backend chưa trả định danh sản phẩm có quy cách. Kiểm tra lại danh sách trước khi lưu tiếp.');
  state.variantId = priced.id;
  await traceability.setOrigin(saved.id, originId);
  if (saved.status !== desiredStatus) { await products.save(saved.id, { ...values, status: desiredStatus }); state.currentStatus = desiredStatus; }
  return state.productId;
}
