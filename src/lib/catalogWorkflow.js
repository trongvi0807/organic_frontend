// Each step uses the existing API contract. Keep confirmed IDs across retries.
export async function saveCatalogWorkflow({ values, price, originId, imageFile, state }, { products, traceability }) {
  if (!imageFile && !state.hasImage) throw new Error('Vui lòng chọn ảnh sản phẩm.');
  const desiredStatus = values.status;
  originId = originId || null;
  const saved = await products.save(state.productId, { ...values, originId, status: state.hasImage ? state.currentStatus || 'draft' : 'draft' });
  if (!saved?.id) throw new Error('Chưa nhận được kết quả lưu sản phẩm. Vui lòng tải lại danh sách trước khi tiếp tục.');
  state.productId = saved.id;
  values.productCode = saved.productCode || values.productCode;
  state.currentStatus = saved.status;
  // A previous POST may have succeeded even if its response was interrupted.
  // The metadata response includes variants, so reuse the confirmed SKU on retry.
  state.variantId ||= saved.variants?.find((item) => item.sku === price.sku || (!price.sku && saved.variants.length === 1))?.id || null;
  const priced = await products.saveVariant(saved.id, state.variantId, price);
  if (!priced?.id) throw new Error('Chưa nhận được đầy đủ thông tin sản phẩm. Vui lòng kiểm tra lại danh sách trước khi tiếp tục.');
  state.variantId = priced.id;
  if (imageFile && state.uploadedFile !== imageFile) {
    const uploaded = await products.uploadImage(saved.id, imageFile);
    if (!uploaded?.id) throw new Error('Chưa nhận được kết quả lưu ảnh. Vui lòng thử lại.');
    state.uploadedFile = imageFile;
    state.hasImage = true;
  }
  if (originId) await traceability.setOrigin(saved.id, originId);
  if (saved.status !== desiredStatus) { await products.save(saved.id, { ...values, originId, status: desiredStatus }); state.currentStatus = desiredStatus; }
  return state.productId;
}
