// Transcribed from the 16 form images in Bieu_mau_Organicfood_Trang_19_36.pdf.
// No approval, inspection, payment or stock outcome is implied by a blank checkbox.
const f = (key, label, format) => ({ key, label, format });
const fields = (items, columns = 1) => ({ type: 'fields', items, columns });
const notes = (key, lines = 2, label) => ({ type: 'notes', key, lines, label });
const checks = (key, options, columns = 2) => ({ type: 'checks', key, options: options.map((option) => typeof option === 'string' ? { value: option, label: option } : option), columns });
const section = (title, ...content) => ({ type: 'section', title, content });
const pair = (...content) => ({ type: 'columns', content });
const table = (title, columns, key = 'items', minRows = 6) => section(title, { type: 'table', key, columns, minRows });
const summary = (...items) => ({ type: 'summary', items });
const c = (key, label, numeric = false, format) => ({ key, label, numeric, format });
const product = [c('stt', 'STT'), c('productCode', 'Mã SP'), c('productName', 'Tên sản phẩm'), c('unit', 'ĐVT')];
const signatures = (...titles) => titles.map((title) => ({ title }));

export const formGroups = {
  purchase: 'Đặt hàng nhà cung cấp', receipt: 'Nhập hàng từ nhà cung cấp', inventory: 'Tồn kho và xử lý hàng',
  sale: 'Bán hàng', delivery: 'Giao hàng', aftersales: 'Sau bán hàng',
};

export const businessForms = [
  { id: 'requisition', code: 'BM-NV01-01', title: 'Phiếu đề nghị nhập hàng', group: 'purchase', source: 'purchase', specialized: true },
  { id: 'purchase_order', code: 'BM-NV01-02', title: 'Đơn đặt hàng - Purchase Order', group: 'purchase', source: 'purchase', specialized: true },
  {
    id: 'receiving_inspection', code: 'BM-NV02-01', title: 'Phiếu kiểm nhận hàng', group: 'receipt', source: 'receipt', orientation: 'landscape', dateLabel: 'Ngày kiểm nhận:',
    signatures: signatures('Đại diện nhà cung cấp', 'Người kiểm nhận', 'Người xác nhận'),
    sections: [
      section('Thông tin kiểm nhận', fields([f('purchaseOrderCode', 'Số đơn đặt hàng:'), f('orderDate', 'Ngày đặt hàng:', 'date'), f('supplierName', 'Nhà cung cấp:'), f('supplierCode', 'Mã nhà cung cấp:'), f('deliverer', 'Người giao hàng:'), f('delivererPhone', 'Số điện thoại:'), f('inspector', 'Người kiểm nhận:'), f('location', 'Địa điểm nhận hàng:')], 2)),
      table('Chi tiết kiểm nhận', [...product, c('quantityExpected', 'SL cần nhận đợt này', true), c('quantityActual', 'SL thực nhận', true), c('quantityReceived', 'SL đạt', true), c('quantityRejected', 'SL không đạt', true), c('batchCode', 'Lô hàng'), c('manufactureDate', 'NSX', false, 'date'), c('expiryDate', 'HSD', false, 'date'), c('condition', 'Tình trạng'), c('result', 'Kết quả')]),
      summary(f('itemCount', 'Tổng số mặt hàng kiểm nhận:', 'number'), f('fullyAcceptedCount', 'Số mặt hàng đạt toàn bộ:', 'number'), f('discrepancyCount', 'Số mặt hàng có sai lệch:', 'number'), f('rejectedTotal', 'Tổng số lượng không đạt:', 'number')),
      pair(section('Nội dung sai lệch hoặc ghi chú', notes('discrepancyNote')), section('Hướng xử lý ban đầu', checks('initialHandling', ['Tiếp nhận toàn bộ', 'Tiếp nhận một phần', 'Chờ bổ sung', 'Đổi/thay thế hàng', 'Trả lại nhà cung cấp']))),
    ],
  },
  {
    id: 'goods_receipt', code: 'BM-NV02-02', title: 'Phiếu nhập kho', group: 'receipt', source: 'receipt', orientation: 'landscape', numberLabel: 'Số phiếu nhập:', dateLabel: 'Ngày nhập kho:',
    signatures: signatures('Người giao hàng', 'Người lập phiếu', 'Người nhận kho', 'Người xác nhận'),
    sections: [
      section('Thông tin chung', fields([f('supplierName', 'Nhà cung cấp:'), f('supplierCode', 'Mã NCC:'), f('purchaseOrderCode', 'Theo đơn đặt hàng số:'), f('inspectionNumber', 'Theo phiếu kiểm nhận số:'), f('deliverer', 'Người giao:'), f('receiverName', 'Người nhận:'), f('warehouse', 'Kho nhập:')], 2)),
      table('Danh sách hàng hóa nhập kho', [...product, c('batchCode', 'Lô hàng'), c('manufactureDate', 'NSX', false, 'date'), c('expiryDate', 'HSD', false, 'date'), c('quantityReceived', 'SL nhập', true), c('unitPrice', 'Đơn giá', true), c('acceptedAmount', 'Thành tiền', true), c('storageLocation', 'Vị trí bảo quản'), c('note', 'Ghi chú')]),
      summary(f('itemCount', 'Tổng số mặt hàng:', 'number'), f('totalAmount', 'Tổng giá trị nhập (đồng):', 'number')),
      section('Ghi chú nhập kho', notes('note')),
    ],
  },
  {
    id: 'rejected_goods', code: 'BM-NV02-03', title: 'Biên bản ghi nhận hàng không đạt', group: 'receipt', source: 'receipt', numberLabel: 'Số biên bản:',
    signatures: signatures('Đại diện nhà cung cấp', 'Người kiểm nhận', 'Người xác nhận'),
    sections: [section('Thông tin tham chiếu', fields([f('supplierName', 'Nhà cung cấp:'), f('purchaseOrderCode', 'Đơn đặt hàng số:'), f('inspectionNumber', 'Phiếu kiểm nhận số:'), f('deliverer', 'Người giao hàng:'), f('inspector', 'Người kiểm nhận:')])),
      table('Hàng không đạt yêu cầu', [...product, c('quantityRejected', 'SL không đạt', true), c('batchExpiry', 'Lô/HSD'), c('condition', 'Tình trạng ghi nhận'), c('resolution', 'Phương án xử lý')], 'items', 8),
      section('Phương án thống nhất', checks('resolution', ['Nhà cung cấp bổ sung hàng thiếu', 'Thay thế sản phẩm', 'Nhận lại hàng không đạt', 'Điều chỉnh số lượng giao', 'Phương án khác'], 1), fields([f('otherResolution', 'Phương án khác:'), f('handlingDeadline', 'Thời hạn dự kiến xử lý:', 'date')])),
    ],
  },
  {
    id: 'stock_card', code: 'BM-NV03-01', title: 'Thẻ kho', group: 'inventory', source: 'batch', numberLabel: 'Số thẻ:',
    signatures: signatures('Người ghi thẻ', 'Người kiểm tra'),
    sections: [section('Thời gian theo dõi', fields([f('periodFrom', 'Từ ngày:', 'date'), f('periodTo', 'Đến ngày:', 'date')], 2)),
      section('Thông tin sản phẩm', fields([f('productCode', 'Mã sản phẩm:'), f('productName', 'Tên sản phẩm:'), f('categoryName', 'Loại sản phẩm:'), f('unit', 'Đơn vị tính:'), f('storageLocation', 'Vị trí bảo quản:'), f('storageCondition', 'Điều kiện bảo quản:'), f('batchCode', 'Mã lô:'), f('manufactureDate', 'Ngày sản xuất:', 'date'), f('expiryDate', 'Hạn sử dụng:', 'date')], 2)),
      table('Bảng theo dõi biến động', [c('date', 'Ngày', false, 'date'), c('documentNumber', 'Chứng từ'), c('description', 'Diễn giải'), c('quantityIn', 'Nhập', true), c('quantityOut', 'Xuất', true), c('balance', 'Tồn', true), c('recordedBy', 'Người ghi'), c('note', 'Ghi chú')], 'movements', 14),
    ],
  },
  {
    id: 'stocktake', code: 'BM-NV03-02', title: 'Phiếu kiểm kê hàng hóa trong kho', group: 'inventory', source: 'batch', orientation: 'landscape', dateLabel: 'Ngày kiểm kê:',
    signatures: signatures('Người kiểm kê', 'Người phụ trách kho', 'Người xác nhận'),
    sections: [section('Thông tin kiểm kê', fields([f('warehouse', 'Kho/khu vực kiểm kê:'), f('warehouseManager', 'Người phụ trách kho:'), f('inspector', 'Người kiểm tra:'), f('inspectionTime', 'Thời điểm kiểm kê:')], 2), checks('scope', ['Toàn bộ kho', 'Một nhóm hàng', 'Khác'], 3)),
      table('Chi tiết kiểm kê', [...product, c('batchCode', 'Lô'), c('expiryDate', 'HSD', false, 'date'), c('bookQuantity', 'SL theo dõi (trên sổ)', true), c('countedQuantity', 'SL thực tế (kiểm đếm)', true), c('difference', 'Chênh lệch (+/-)', true), c('condition', 'Tình trạng'), c('note', 'Ghi chú')]),
      summary(f('itemCount', 'Số mặt hàng kiểm kê:', 'number'), f('matchingCount', 'Số mặt hàng khớp:', 'number'), f('differenceCount', 'Số mặt hàng chênh lệch:', 'number'), f('conditionIssueCount', 'Số mặt hàng có vấn đề:', 'number')),
      section('Nội dung chênh lệch', notes('differenceNote')),
      section('Nguyên nhân sơ bộ', checks('causes', ['Hao hụt trong bảo quản', 'Sai lệch ghi nhận nhập/xuất', 'Hàng hư hỏng', 'Chưa xác định', 'Khác'], 3)),
      section('Kiến nghị xử lý', notes('recommendation')),
    ],
  },
  {
    id: 'stock_disposal', code: 'BM-NV03-03', title: 'Phiếu xử lý hàng cận hạn / hư hỏng', group: 'inventory', source: 'batch', orientation: 'landscape',
    signatures: signatures('Người lập', 'Người kiểm tra', 'Người phê duyệt/xác nhận'),
    sections: [section('Thông tin kiểm tra', fields([f('warehouse', 'Kho/khu vực:'), f('detectedBy', 'Người phát hiện:'), f('inspectionTime', 'Thời điểm kiểm tra:')], 2)),
      table('Danh sách hàng cần xử lý', [...product, c('batchCode', 'Lô'), c('expiryDate', 'HSD', false, 'date'), c('onHand', 'SL hiện có', true), c('handlingQuantity', 'SL cần xử lý', true), c('condition', 'Tình trạng'), c('proposedAction', 'Đề xuất xử lý')]),
      section('Phương án xử lý', checks('actions', ['Tiếp tục kinh doanh có kiểm soát', 'Ưu tiên bán theo chính sách cận hạn', 'Điều chỉnh/khuyến mãi theo quy định', 'Trả nhà cung cấp nếu phù hợp', 'Loại khỏi hàng có thể bán', 'Thanh lý', 'Hủy', 'Khác'], 4)),
      summary(f('itemCount', 'Tổng số mặt hàng cần xử lý:', 'number'), f('affectedQuantity', 'Tổng số lượng bị ảnh hưởng:', 'number'), f('estimatedValue', 'Giá trị ước tính (đồng):', 'number')),
      section('Kết quả xử lý', fields([f('handledAt', 'Ngày xử lý:', 'date'), f('handledQuantity', 'Số lượng thực tế đã xử lý:', 'number'), f('handlingResult', 'Kết quả thực hiện:'), f('note', 'Ghi chú:')], 2)),
    ],
  },
  {
    id: 'sales_receipt', code: 'BM-NV04-01', title: 'Phiếu bán hàng', group: 'sale', source: 'sale', dateLabel: 'Ngày bán:',
    disclaimer: 'PHIẾU MINH HỌA PHỤC VỤ KHÓA LUẬN - KHÔNG PHẢI HÓA ĐƠN TÀI CHÍNH - KHÔNG CÓ GIÁ TRỊ PHÁP LÝ',
    signatures: signatures('Nhân viên bán hàng', 'Khách hàng'),
    sections: [section('Thông tin cửa hàng', fields([f('storeName', 'Cửa hàng:'), f('storePhone', 'Điện thoại:'), f('salesperson', 'Nhân viên bán hàng:')], 2)),
      section('1. Thông tin khách hàng (không bắt buộc với khách mua lẻ)', fields([f('customerCode', 'Mã khách hàng:'), f('customerName', 'Họ tên:'), f('customerPhone', 'Số điện thoại:'), f('membershipTier', 'Hạng thành viên:')], 2)),
      table('2. Chi tiết hàng hóa', [...product, c('quantity', 'SL / Trọng lượng', true), c('unitPrice', 'Đơn giá (đồng)', true), c('lineAmount', 'Thành tiền (đồng)', true), c('discountAmount', 'Giảm giá (đồng)', true), c('netAmount', 'Sau giảm (đồng)', true)]),
      pair(section('3. Tổng hợp thanh toán', fields([f('subtotal', 'Tạm tính (đồng):', 'number'), f('discountTotal', 'Giảm giá / ưu đãi (đồng):', 'number'), f('shippingFee', 'Phí khác (đồng):', 'number'), f('totalAmount', 'TỔNG THANH TOÁN (đồng):', 'number')])), section('4. Phương thức thanh toán', checks('paymentOptions', ['Tiền mặt', 'Thẻ', 'Chuyển khoản/QR', 'Ví điện tử', 'Khác']), fields([f('paidAmount', 'Số tiền khách thanh toán:', 'number'), f('changeAmount', 'Số tiền trả lại:', 'number')]))),
      section('5. Thông tin thành viên và tích điểm', checks('membershipOptions', ['Có', 'Không']), fields([f('membershipCode', 'Mã thành viên:'), f('eligibleEarnAmount', 'Giá trị được tính điểm (đồng):', 'number'), f('pointsEarned', 'Điểm ghi nhận:', 'number')], 2)),
      section('6. Ghi chú', notes('note')),
    ],
  },
  {
    id: 'order_confirmation', code: 'BM-NV04-02', title: 'Phiếu xác nhận đơn hàng', group: 'sale', source: 'sale', numberLabel: 'Mã đơn:', dateLabel: 'Ngày tiếp nhận:',
    signatures: signatures('Người tiếp nhận đơn', 'Người xác nhận', 'Khách hàng'),
    sections: [pair(section('A. Thông tin khách đặt hàng', fields([f('customerCode', 'Mã khách hàng:'), f('customerName', 'Họ và tên:'), f('customerPhone', 'Số điện thoại:'), f('customerEmail', 'Email (nếu có):')]), checks('orderChannels', ['Trực tiếp', 'Điện thoại', 'Website', 'Khác'])), section('B. Thông tin người nhận', fields([f('receiverName', 'Người nhận:'), f('receiverPhone', 'SĐT người nhận:'), f('shippingAddress', 'Địa chỉ nhận hàng:'), f('requestedDeliveryTime', 'Thời gian mong muốn nhận:')]), notes('deliveryNote', 1, 'Ghi chú giao hàng:'))),
      table('C. Chi tiết đơn hàng', [...product, c('requestedQuantity', 'SL/TL yêu cầu', true), c('confirmedQuantity', 'SL/TL xác nhận', true), c('unitPrice', 'Đơn giá (đồng)', true), c('netAmount', 'Thành tiền (đồng)', true), c('note', 'Ghi chú')]),
      pair(section('D. Tổng giá trị đơn', fields([f('subtotal', 'Tạm tính (đồng):', 'number'), f('discountTotal', 'Khuyến mãi/ưu đãi (đồng):', 'number'), f('shippingFee', 'Phí giao hàng dự kiến (đồng):', 'number'), f('totalAmount', 'TỔNG GIÁ TRỊ DỰ KIẾN:', 'number')])), section('E. Thanh toán', checks('paymentOptions', ['Thanh toán trước', 'Thanh toán khi nhận hàng', 'Tiền mặt', 'Chuyển khoản/QR', 'Thẻ/ví điện tử', 'Khác']), checks('paymentStates', ['Chưa thanh toán', 'Đã thanh toán một phần', 'Đã thanh toán']), fields([f('paidAmount', 'Số tiền đã thanh toán:', 'number'), f('remainingAmount', 'Số tiền còn phải thu:', 'number')]))),
      pair(section('F. Khuyến mãi và thành viên', fields([f('promotionCode', 'Chương trình ưu đãi áp dụng:'), f('membershipCode', 'Mã khách hàng thành viên:'), f('pointsEarned', 'Điểm ghi nhận:', 'number')])), section('G. Trạng thái xử lý nghiệp vụ', checks('orderStates', ['Đã tiếp nhận', 'Đã xác nhận với khách', 'Chờ chuẩn bị hàng', 'Chuyển xuất/giao hàng', 'Khách hủy', 'Khác']))),
      section('Xác nhận của khách', checks('confirmationChannels', ['Điện thoại', 'Tin nhắn', 'Trực tiếp', 'Khác']), fields([f('customerConfirmedAt', 'Thời điểm khách xác nhận:')])),
    ],
  },
  {
    id: 'goods_dispatch', code: 'BM-NV05-01', title: 'Phiếu xuất hàng', group: 'delivery', source: 'sale', orientation: 'landscape', dateLabel: 'Ngày xuất:',
    disclaimer: 'BIỂU MẪU MINH HỌA PHỤC VỤ KHÓA LUẬN - KHÔNG PHẢI CHỨNG TỪ KẾ TOÁN - KHÔNG CÓ GIÁ TRỊ PHÁP LÝ',
    signatures: signatures('Người yêu cầu xuất', 'Người phụ trách kho', 'Người nhận hàng', 'Người xác nhận (nếu cần)'),
    sections: [section('A. Thông tin căn cứ xuất', fields([f('orderCode', 'Mã đơn hàng/Phiếu bán hàng:'), f('orderedAt', 'Ngày bán/đặt hàng:', 'date'), f('customerName', 'Khách hàng:'), f('requestedBy', 'Người yêu cầu xuất:'), f('dispatchedBy', 'Người phụ trách xuất:'), f('warehouse', 'Kho/khu vực xuất:'), f('receiverName', 'Người nhận dự kiến:')], 2), checks('deliveryMethods', ['Tại cửa hàng', 'Giao tận nơi'])),
      table('B. Chi tiết hàng xuất', [...product, c('quantity', 'SL/TL theo đơn', true), c('dispatchedQuantity', 'SL/TL thực xuất', true), c('batchCode', 'Lô hàng'), c('expiryDate', 'HSD', false, 'date'), c('pickLocation', 'Vị trí lấy hàng'), c('condition', 'Tình trạng'), c('note', 'Ghi chú')]),
      section('C. Tổng hợp', summary(f('itemCount', 'Tổng số mặt hàng:', 'number'), f('dispatchedTotal', 'Tổng số lượng xuất:', 'number'), f('preparedAt', 'Thời điểm hoàn tất chuẩn bị:')), notes('discrepancyNote', 1, 'Sai lệch so với đơn bán:')),
      section('D. Kiểm tra trước bàn giao', checks('handoverChecks', ['Đúng sản phẩm', 'Đúng số lượng/trọng lượng', 'Tình trạng hàng đạt', 'Đã đóng gói phù hợp', 'Thông tin người nhận đã được kiểm tra'], 3), fields([f('handoverNote', 'Ghi chú kiểm tra:')])),
    ],
  },
  {
    id: 'delivery_note', code: 'BM-NV05-02', title: 'Phiếu giao hàng - Delivery Note', group: 'delivery', source: 'sale', numberLabel: 'Số phiếu giao:', dateLabel: 'Ngày giao:',
    signatures: signatures('Người giao hàng', 'Người nhận hàng'),
    sections: [section('A. Thông tin đơn hàng', fields([f('orderCode', 'Mã đơn hàng:'), f('orderedAt', 'Ngày đặt hàng:', 'date'), f('dispatchNumber', 'Phiếu xuất hàng số:'), f('packageCount', 'Tổng số kiện/túi giao:', 'number')], 2)),
      section('B. Thông tin người nhận', fields([f('receiverName', 'Họ tên người nhận:'), f('receiverPhone', 'Số điện thoại:'), f('shippingAddress', 'Địa chỉ giao hàng:'), f('deliveryTimeWindow', 'Khung giờ giao dự kiến:')], 2), notes('deliveryNote', 1, 'Yêu cầu giao hàng đặc biệt:')),
      section('C. Thông tin vận chuyển', fields([f('driverName', 'Người giao hàng:'), f('carrier', 'Đơn vị vận chuyển:'), f('driverPhone', 'Số điện thoại người giao:'), f('pickedUpAt', 'Thời gian nhận hàng từ cửa hàng:'), f('estimatedDeliveryTime', 'Thời gian dự kiến giao:')], 2)),
      table('D. Danh sách hàng giao', [...product, c('deliveryQuantity', 'SL/TL giao', true), c('handoverCondition', 'Tình trạng khi bàn giao'), c('note', 'Ghi chú')]),
      section('Ghi chú bảo quản khi vận chuyển', notes('transportNote', 1)),
      pair(section('E. Thông tin thanh toán khi giao', checks('preDeliveryPayment', ['Đã thanh toán', 'Còn phải thu']), fields([f('codAmount', 'Số tiền cần thu (đồng):', 'number'), f('cashCollected', 'Số tiền thực thu (đồng):', 'number')]), checks('collectionMethods', ['Tiền mặt', 'Chuyển khoản/QR', 'Khác'])), section('F. Kết quả giao hàng', checks('deliveryResults', ['Giao thành công toàn bộ', 'Giao thành công một phần', 'Khách hẹn giao lại', 'Khách từ chối nhận', 'Không liên hệ được', 'Sai/thay đổi địa chỉ', 'Khác']), fields([f('deliveredAt', 'Thời gian giao thực tế:')]), notes('deliveryResultNote', 1))),
      section('G. Xác nhận bàn giao', checks('customerInspection', ['Người nhận đã kiểm tra hàng', 'Chưa kiểm tra hàng'])),
    ],
  },
  {
    id: 'delivery_failure', code: 'BM-NV05-03', title: 'Phiếu ghi nhận giao hàng không thành công', group: 'delivery', source: 'sale',
    signatures: signatures('Người giao hàng', 'Người tiếp nhận hàng trả về', 'Người xác nhận'),
    sections: [section('1. Thông tin tham chiếu', fields([f('orderCode', 'Mã đơn hàng:'), f('deliveryNumber', 'Phiếu giao hàng:'), f('receiverName', 'Người nhận dự kiến:'), f('shippingAddress', 'Địa chỉ giao hàng:'), f('driverName', 'Người giao hàng:'), f('driverPhone', 'Số điện thoại:'), f('attemptedAt', 'Thời điểm giao:'), f('deliveryArea', 'Khu vực giao:')], 2)),
      section('2. Nguyên nhân không giao được', checks('failureCauses', ['Không liên hệ được khách hàng', 'Khách không có mặt', 'Khách hẹn thời gian khác', 'Khách từ chối nhận', 'Địa chỉ không chính xác', 'Hàng gặp vấn đề trong quá trình giao', 'Nguyên nhân khác']), notes('failureReason', 2, 'Mô tả chi tiết:')),
      table('3. Tình trạng hàng mang về', [...product, c('outboundQuantity', 'SL/TL mang đi', true), c('returnedQuantity', 'SL/TL trả về', true), c('returnedCondition', 'Tình trạng khi trả về'), c('note', 'Ghi chú')]),
      section('4. Phương án xử lý tiếp theo', checks('nextActions', ['Giao lại cho khách', 'Liên hệ khách xác nhận lại', 'Khách hủy đơn', 'Chuyển kiểm tra lại tình trạng hàng', 'Trả hàng về khu vực lưu trữ sau khi kiểm tra', 'Chuyển xử lý hàng không còn đủ điều kiện', 'Khác']), fields([f('redeliveryTime', 'Thời gian giao lại dự kiến:')]), notes('additionalNote', 1, 'Ghi chú thêm:')),
    ],
  },
  {
    id: 'customer_feedback', code: 'BM-NV06-01', title: 'Phiếu tiếp nhận phản hồi / yêu cầu sau bán', group: 'aftersales', source: 'feedback', dateLabel: 'Ngày tiếp nhận:', numberLabel: 'Mã yêu cầu:',
    signatures: signatures('Khách hàng', 'Người tiếp nhận'),
    sections: [section('A. Thông tin khách hàng', fields([f('customerCode', 'Mã khách hàng:'), f('customerName', 'Họ và tên:'), f('customerPhone', 'Số điện thoại:'), f('customerEmail', 'Email:')], 2), checks('feedbackChannels', ['Trực tiếp tại cửa hàng', 'Điện thoại', 'Tin nhắn', 'Email', 'Kênh khác'], 3)),
      section('B. Thông tin giao dịch liên quan', fields([f('orderCode', 'Mã đơn hàng/Phiếu bán hàng:'), f('orderedAt', 'Ngày mua hàng:', 'date'), f('receivedAt', 'Ngày nhận hàng:', 'date'), f('deliveryNumber', 'Phiếu giao hàng số:')], 2), checks('deliveryMethods', ['Nhận tại cửa hàng', 'Giao tận nơi'])),
      table('C. Nội dung phản hồi', [...product, c('quantity', 'SL/TL liên quan', true), c('batchExpiry', 'Lô/HSD (nếu có)'), c('feedbackContent', 'Nội dung phản ánh')]),
      section('D. Loại yêu cầu', checks('requestTypes', ['Góp ý / phản hồi', 'Đánh giá sản phẩm', 'Khiếu nại', 'Yêu cầu đổi hàng', 'Yêu cầu trả hàng', 'Yêu cầu hoàn tiền', 'Khác'], 3), notes('content', 2, 'Nội dung chi tiết của khách:'), checks('evidenceTypes', ['Sản phẩm thực tế', 'Hình ảnh', 'Video', 'Phiếu bán hàng/đơn hàng', 'Khác'], 3)),
      section('E. Mong muốn của khách', checks('customerWishes', ['Đổi cùng sản phẩm', 'Đổi sản phẩm khác', 'Trả hàng', 'Hoàn tiền', 'Chỉ ghi nhận phản hồi', 'Khác'], 3), notes('staffNote', 1, 'Ghi chú nhân viên tiếp nhận:')),
      section('F. Chuyển xử lý', fields([f('assignedEmployee', 'Người tiếp nhận:'), f('forwardedTo', 'Chuyển người xem xét:'), f('forwardedAt', 'Thời điểm chuyển:')], 2), checks('initialStates', ['Đã tiếp nhận', 'Chờ kiểm tra', 'Chuyển quản lý xem xét'], 3)),
    ],
  },
  {
    id: 'return_resolution', code: 'BM-NV06-02', title: 'Phiếu xử lý đổi trả / hoàn tiền', group: 'aftersales', source: 'return', dateLabel: 'Ngày xử lý:',
    signatures: signatures('Người lập', 'Quản lý xác nhận', 'Khách hàng'),
    sections: [section('A. Thông tin tham chiếu', fields([f('requestCode', 'Mã yêu cầu sau bán:'), f('orderCode', 'Mã đơn hàng/Phiếu bán hàng:'), f('customerName', 'Khách hàng:'), f('customerPhone', 'Số điện thoại:'), f('orderedAt', 'Ngày mua:', 'date'), f('requestedAt', 'Ngày tiếp nhận yêu cầu:', 'date')], 2)),
      table('B. Sản phẩm được xem xét', [...product, c('purchasedQuantity', 'SL/TL mua', true), c('requestedQuantity', 'SL/TL yêu cầu xử lý', true), c('relatedAmount', 'Giá trị liên quan (đồng)', true), c('condition', 'Tình trạng ghi nhận')]),
      section('C. Kết quả xem xét', checks('reviewResults', ['Đáp ứng điều kiện xử lý', 'Không đáp ứng điều kiện', 'Cần bổ sung thông tin'], 3), notes('decisionNote', 1, 'Kết luận/Ghi chú:')),
      section('D. Quyết định xử lý', checks('resolutionTypes', ['Đổi cùng sản phẩm', 'Đổi sang sản phẩm khác', 'Trả hàng và hoàn tiền', 'Hoàn tiền một phần', 'Không chấp nhận yêu cầu', 'Phương án khác'], 3), fields([f('replacementName', 'Sản phẩm thay thế:'), f('replacementCode', 'Mã sản phẩm:'), f('replacementQuantity', 'Số lượng:', 'number'), f('replacementAmount', 'Giá trị sản phẩm thay thế:', 'number'), f('differenceAmount', 'Giá trị chênh lệch:', 'number')], 2)),
      section('E. Thông tin hoàn tiền', fields([f('relatedPaidAmount', 'Số tiền đã thanh toán liên quan:', 'number'), f('approvedRefundAmount', 'Số tiền được hoàn (đề xuất):', 'number')], 2), checks('refundMethods', ['Tiền mặt', 'Chuyển khoản', 'Hoàn qua phương thức thanh toán ban đầu', 'Khác']), fields([f('bankAccountName', 'Chủ tài khoản:'), f('bankName', 'Ngân hàng:'), f('refundReference', 'Thông tin tham chiếu:'), f('refundedAt', 'Ngày hoàn tiền:', 'date')], 2), checks('refundStates', ['Đã hoàn', 'Chờ hoàn', 'Không áp dụng'], 3)),
      section('F. Kết quả cuối cùng', fields([f('completedAt', 'Ngày hoàn tất xử lý:', 'date')]), notes('finalResult', 1, 'Nội dung kết quả:')),
    ],
  },
  {
    id: 'return_inspection', code: 'BM-NV06-03', title: 'Phiếu kiểm tra và xử lý hàng trả lại', group: 'aftersales', source: 'return_receipt', orientation: 'landscape', dateLabel: 'Ngày tiếp nhận:',
    signatures: signatures('Người tiếp nhận', 'Người phụ trách kho', 'Người xác nhận'),
    sections: [section('A. Thông tin tham chiếu', fields([f('requestCode', 'Phiếu xử lý đổi trả số:'), f('orderCode', 'Mã đơn hàng:'), f('customerName', 'Khách hàng:'), f('receivedBy', 'Người tiếp nhận hàng:'), f('inspectedBy', 'Người kiểm tra:')], 2)),
      table('B. Danh sách hàng trả', [...product, c('receivedQuantity', 'SL/TL trả', true), c('batchCode', 'Lô'), c('expiryDate', 'HSD', false, 'date'), c('condition', 'Tình trạng khi nhận lại'), c('returnReason', 'Nguyên nhân trả')]),
      section('C. Kết quả kiểm tra', checks('inspectionResults', ['Bao bì còn nguyên vẹn', 'Sản phẩm đã mở/sử dụng', 'Hàng có dấu hiệu hư hỏng', 'Cần kiểm tra thêm', 'Điều kiện bảo quản có thể đã bị ảnh hưởng', 'Còn trong thời hạn sử dụng', 'Không đủ điều kiện tiếp tục kinh doanh'], 4), notes('inspectionNote', 1, 'Nhận xét:')),
      section('D. Phương án xử lý hàng', checks('handlingOptions', ['Đưa lại vào lượng hàng có thể kinh doanh sau khi kiểm tra đạt', 'Chuyển khu vực chờ xử lý', 'Thanh lý theo quy định', 'Trả nhà cung cấp nếu phù hợp', 'Loại khỏi hàng có thể bán', 'Hủy', 'Khác'], 3)),
      section('E. Thông tin định lượng sau xử lý', fields([f('receivedTotal', 'Tổng số lượng trả lại:', 'number'), f('restockedTotal', 'Số lượng tiếp tục được kinh doanh:', 'number'), f('pendingTotal', 'Số lượng chuyển xử lý:', 'number'), f('disposedTotal', 'Số lượng phải loại bỏ/hủy:', 'number'), f('affectedValue', 'Giá trị hàng bị ảnh hưởng dự kiến:', 'number')], 2)),
      section('F. Kết quả thực hiện', fields([f('handledAt', 'Ngày xử lý thực tế:', 'date'), f('handledBy', 'Người thực hiện:'), f('handlingResult', 'Kết quả cuối cùng:')], 3)),
    ],
  },
];

export const businessForm = (id) => businessForms.find((form) => form.id === id);
