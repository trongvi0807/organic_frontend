// Each step uses the existing API contract. Keep confirmed IDs across retries.
export async function saveCatalogWorkflow({ values, price, originId, state }, { products, traceability }) {
  const desiredStatus = values.status;
  const saved = await products.save(state.productId, { ...values, status: state.currentStatus || 'draft' });
  if (!saved?.id) throw new Error('Chưa nhận được kết quả lưu sản phẩm. Vui lòng tải lại danh sách trước khi tiếp tục.');
  state.productId = saved.id;
  state.currentStatus = saved.status;
  // A previous POST may have succeeded even if its response was interrupted.
  // The metadata response includes variants, so reuse the confirmed SKU on retry.
  state.variantId ||= saved.variants?.find((item) => item.sku === price.sku)?.id || null;
  const priced = await products.saveVariant(saved.id, state.variantId, price);
  if (!priced?.id) throw new Error('Chưa nhận được đầy đủ thông tin sản phẩm. Vui lòng kiểm tra lại danh sách trước khi tiếp tục.');
  state.variantId = priced.id;
  await traceability.setOrigin(saved.id, originId);
  if (saved.status !== desiredStatus) { await products.save(saved.id, { ...values, status: desiredStatus }); state.currentStatus = desiredStatus; }
  return state.productId;
}
