export const importLabels = {
  supplierCode: 'Mã nhà cung cấp', expectedDeliveryDate: 'Ngày giao dự kiến', note: 'Ghi chú', sku: 'Mã sản phẩm (SKU)', quantity: 'Số lượng', unitPrice: 'Giá nhập',
  purchaseOrderCode: 'Mã đơn mua', quantityReceived: 'Số đạt', quantityRejected: 'Số bị loại', discrepancyReason: 'Lý do chênh lệch', batchCode: 'Mã lô', manufactureDate: 'Ngày sản xuất', expiryDate: 'Hạn dùng', originDescription: 'Nguồn gốc',
  productCode: 'Mã sản phẩm', productName: 'Tên sản phẩm', slug: 'Đường dẫn', categoryId: 'Loại sản phẩm', brandId: 'Thương hiệu', description: 'Mô tả', productStatus: 'Trạng thái sản phẩm', organicClaimStatus: 'Trạng thái organic', certificationIds: 'Chứng nhận', originId: 'Xuất xứ', imageUrl: 'Ảnh', variantName: 'Quy cách', netQuantity: 'Khối lượng', unitId: 'Đơn vị tính', sellingPrice: 'Giá bán', compareAtPrice: 'Giá so sánh', barcode: 'Mã vạch', reorderLevel: 'Ngưỡng tồn', variantStatus: 'Trạng thái quy cách',
  categoryName: 'Tên loại sản phẩm', originName: 'Tên xuất xứ', supplierName: 'Nhà cung cấp', quantityAvailableToReceive: 'Còn được nhận',
};
export const importConfig = {
  products: { title: 'Nhập sản phẩm từ Excel', action: 'Nhập sản phẩm', limit: 'Tối đa 100 sản phẩm / 500 dòng quy cách.', description: 'Mẫu mới dùng tiếng Việt, tự cấp mã sản phẩm và SKU. Nhập tên hoặc mã loại sản phẩm, hoặc chọn bổ sung trên giao diện. Chỉ tạo sản phẩm nháp, chưa tăng tồn kho.', columns: ['productCode', 'productName', 'categoryId', 'sku', 'variantName', 'sellingPrice'] },
  purchase_orders: { title: 'Lập đơn mua từ Excel', action: 'Tạo đơn mua chờ duyệt', limit: 'Tối đa 100 dòng. Một file tạo một đơn mua.', description: 'Chọn nhà cung cấp trước để tải mẫu điền sẵn sản phẩm. Chỉ nhập số lượng và giá nhập cho các dòng cần đặt; để trống cả hai ô để bỏ qua. Ngày giao và ghi chú nhập một lần bên dưới.', columns: ['supplierName', 'productName', 'variantName', 'sku', 'quantity', 'unitPrice'] },
  goods_receipts: { title: 'Lập phiếu nhập từ Excel', action: 'Tạo phiếu nhập nháp', limit: 'Tối đa 100 dòng, phải đủ tất cả sản phẩm trong đơn mua.', description: 'Mẫu điền sẵn mã đơn mua, sản phẩm và số còn được nhận để tham khảo. Điền số thực nhận, lô và hạn sử dụng; backend kiểm tra lại số còn được nhận. Chỉ cộng tồn sau khi Admin duyệt phiếu.', columns: ['purchaseOrderCode', 'productName', 'variantName', 'quantityAvailableToReceive', 'quantityReceived', 'quantityRejected', 'batchCode', 'expiryDate', 'discrepancyReason'] },
};

export function importIssueText(issue) {
  const raw = issue.message || 'Dữ liệu không hợp lệ.';
  const message = raw.replace(/^must not be (null|blank|empty)$/i, 'Không được để trống.').replace(/^must be greater than or equal to (.+)$/i, 'Phải lớn hơn hoặc bằng $1.').replace(/^must be less than or equal to (.+)$/i, 'Phải nhỏ hơn hoặc bằng $1.');
  return `${importLabels[issue.column] || issue.column || 'Dữ liệu'}: ${message}`;
}
