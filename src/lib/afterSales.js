export const feedbackStates = { pending: 'Chờ tiếp nhận', processing: 'Đang xử lý', waiting_customer: 'Chờ khách bổ sung', resolved: 'Đã giải quyết', closed: 'Đã đóng' };
export const feedbackTypes = { product: 'Sản phẩm', delivery: 'Giao hàng', payment: 'Thanh toán', service: 'Dịch vụ', other: 'Góp ý khác' };
export const returnStates = { pending: 'Chờ tiếp nhận', reviewing: 'Đang xét duyệt', waiting_customer: 'Chờ bổ sung thông tin', approved: 'Chờ khách xác nhận phương án', processing: 'Đã đồng ý · Chờ thực hiện', completed: 'Đã hoàn tất xử lý', rejected: 'Đã từ chối', cancelled: 'Đã hủy yêu cầu' };
export const returnTypes = { return_refund: 'Trả hàng và hoàn tiền', refund: 'Hoàn tiền không thu hồi', exchange: 'Đổi cùng sản phẩm' };
export const returnReasons = { damaged: 'Sản phẩm hư hỏng', expired: 'Sản phẩm hết hạn', wrong_product: 'Giao sai sản phẩm', missing_product: 'Giao thiếu sản phẩm', quality_issue: 'Vấn đề chất lượng', other: 'Lý do khác' };
export const inspectionStates = { pending: 'Chưa kiểm tra', inspecting: 'Đang kiểm tra', passed: 'Đạt', failed: 'Không đạt', mixed: 'Có phần đạt và không đạt' };
export const feedbackTransitions = { processing: ['waiting_customer', 'resolved'], waiting_customer: ['processing', 'resolved'], resolved: ['processing', 'closed'] };
export const historyActions = { created: 'Tạo yêu cầu', submitted: 'Gửi yêu cầu', claimed: 'Tiếp nhận', approved: 'Duyệt phương án', rejected: 'Từ chối', cancelled: 'Hủy yêu cầu', customer_accepted: 'Khách đồng ý', customer_declined: 'Khách yêu cầu xét lại', proposal_accepted: 'Khách đồng ý', proposal_declined: 'Khách yêu cầu xét lại', information_requested: 'Yêu cầu bổ sung', information_submitted: 'Bổ sung thông tin', goods_received: 'Nhận hàng', goods_inspected: 'Kiểm tra', goods_restocked: 'Nhập lại tồn', goods_disposed: 'Loại bỏ', batch_identified: 'Đối chiếu lô', goods_reinspected: 'Kiểm tra lại' };

Object.assign(historyActions, { refund_requested: 'Gửi yêu cầu hoàn tiền', refund_succeeded: 'Đã hoàn tiền', refund_updated: 'Cập nhật kết quả hoàn tiền', refund_reconciled: 'Đối soát khoản hoàn', replacement_created: 'Tạo đơn hàng đổi', replacement_preparing: 'Chuẩn bị hàng đổi', replacement_shipment_booked: 'Tạo chuyến giao hàng đổi', replacement_shipment_updated: 'Cập nhật giao hàng đổi', execution_completed: 'Hoàn tất hồ sơ' });

// Audit snapshots contain technical IDs. Show the explanation and numeric results,
// keeping the untouched snapshot at the server for auditing.
export function supportHistoryText(raw = '') {
  const text = String(raw), start = text.indexOf('{');
  if (start < 0 || !text.includes('"proposal"') && !text.includes('"receiptItemId"') && !text.includes('"execution"')) return text;
  try {
    const snapshot = JSON.parse(text.slice(start));
    if (!snapshot.proposal && !snapshot.receiptItemId && !snapshot.execution) return text;
    const lines = [typeof snapshot.note === 'string' ? snapshot.note : 'Đã ghi nhận xử lý.'];
    if (snapshot.proposal) {
      lines.push(`Phương án lần ${snapshot.proposalVersion}: tiền hoàn dự kiến ${Number(snapshot.proposal.approvedRefundAmount || 0).toLocaleString('vi-VN')} ₫.`);
      if (snapshot.policyNote) lines.push(`Căn cứ xét duyệt: ${snapshot.policyNote}`);
    } else if (snapshot.receiptItemId) {
      lines.push([['received', 'Đã nhận'], ['passed', 'Đạt'], ['failed', 'Không đạt'], ['restocked', 'Đã nhập lại'], ['disposed', 'Đã loại bỏ'], ['pending', 'Còn giữ riêng']].filter(([key]) => snapshot[key] != null).map(([key, label]) => `${label}: ${Number(snapshot[key]).toLocaleString('vi-VN')}`).join(' · '));
    }
    return text.slice(0, start) + lines.join('\n');
  } catch { return 'Đã ghi nhận lịch sử xử lý. Xem phương án hoặc chi tiết hàng thu hồi để đối chiếu.'; }
}
export function supportSystemText(raw) {
  const labels = { ...(/^RR[-:]/i.test(String(raw)) ? returnStates : feedbackStates), ...returnTypes, ...historyActions };
  return supportHistoryText(raw).replace(/\s*\/\s*[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}(?=:)/gi, '')
    .replace(/\b(?:waiting_customer|return_refund|processing|reviewing|approved|pending|resolved|closed|rejected|cancelled|completed|exchange|refund|goods_received|goods_inspected|goods_restocked|goods_disposed|goods_reinspected|batch_identified)\b/g, (key) => labels[key] || key);
}

export function validateSupportFiles(files) {
  let images = 0, videos = 0;
  for (const file of files) {
    const image = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    const video = ['video/mp4', 'video/webm'].includes(file.type);
    if (!image && !video) return 'Chỉ nhận ảnh JPEG, PNG, WebP hoặc video MP4, WebM.';
    if (file.size > (image ? 5 : 50) * 1024 * 1024) return image ? 'Mỗi ảnh tối đa 5 MB.' : 'Mỗi video tối đa 50 MB.';
    if (image) images++; else videos++;
  }
  return images > 5 || videos > 1 ? 'Mỗi nội dung tối đa 5 ảnh và 1 video.' : '';
}
export const whole = (value, min = 0, max = 999999999) => value !== '' && value != null && Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;

export function decisionPayload(detail, values, note, policyNote) {
  if (!note.trim()) throw new Error('Vui lòng ghi rõ nội dung phương án.');
  let approved = false;
  const items = detail.items.map((line) => {
    const value = values[line.id];
    if (!value || !whole(value.quantity, 0, line.requestedQuantity)) throw new Error(`Số lượng duyệt của ${line.productName} không hợp lệ.`);
    const quantity = Number(value.quantity);
    if (!quantity) return { detailId: line.id, approvedQuantity: 0, resolutionType: null, returnRequired: false, refundAmount: null };
    approved = true;
    if (line.policyReviewRequired && !policyNote.trim()) throw new Error('Vui lòng ghi căn cứ xét duyệt chính sách cho các sản phẩm cần xác minh.');
    if (!returnTypes[value.type]) throw new Error('Vui lòng chọn phương án xử lý.');
    if (detail.request.order.status === 'cancelled' && value.type !== 'refund') throw new Error('Đơn đã hủy chỉ được hoàn tiền không thu hồi.');
    if (value.type !== 'exchange' && !['paid', 'partially_refunded'].includes(detail.request.order.paymentStatus)) throw new Error('Đơn chưa ghi nhận thanh toán nên chưa thể duyệt hoàn tiền.');
    if (value.amount !== '' && value.type !== 'exchange' && !whole(value.amount, 0, 999999999999)) throw new Error('Số tiền hoàn phải là số nguyên không âm.');
    return { detailId: line.id, approvedQuantity: quantity, resolutionType: value.type,
      returnRequired: value.type === 'return_refund' || value.type === 'exchange' && !!value.returnRequired,
      refundAmount: value.type === 'exchange' ? null : value.amount === '' ? null : Number(value.amount) };
  });
  if (!approved) throw new Error('Phải duyệt ít nhất một sản phẩm. Nếu không chấp nhận, dùng Từ chối yêu cầu.');
  return { expectedProposalVersion: detail.request.proposalVersion, note: note.trim(), policyNote: policyNote.trim() || null, items };
}

// Retain a successful/uncertain operation's key; never silently retry with a new key.
export function keyedOperation() {
  let pending;
  return {
    prepare(body) {
      const fingerprint = JSON.stringify(body);
      if (pending && pending.fingerprint !== fingerprint) throw new Error('Thao tác trước chưa rõ kết quả. Tải lại để đối chiếu trước khi thay đổi nội dung.');
      pending ||= { fingerprint, key: crypto.randomUUID() };
      return pending.key;
    },
    clear() { pending = null; },
  };
}

export function warehousePayload(action, values, item, line) {
  if (!values.note?.trim()) throw new Error('Vui lòng ghi chú kết quả thực hiện.');
  const note = values.note.trim();
  const quantity = (field, min, max) => {
    if (!whole(values[field], min, max)) throw new Error(`Số lượng phải là số nguyên từ ${min} đến ${max}.`);
    return Number(values[field]);
  };
  if (action === 'receive') {
    if (!line?.returnRequired) throw new Error('Vui lòng chọn sản phẩm được duyệt thu hồi.');
    const received = quantity('quantity', 1, line.remainingToReceive);
    const allocation = line.originalAllocations.find((entry) => entry.id === values.allocation);
    if (values.allocation && !allocation) throw new Error('Lô đã chọn không thuộc sản phẩm này.');
    if (allocation && received > allocation.availableToIdentify) throw new Error('Số nhận vượt số còn có thể đối chiếu của lô gốc.');
    return { returnRequestDetailId: line.returnRequestDetailId, originalOrderDetailBatchId: allocation?.id || null, quantity: received, note };
  }
  if (!item || !Number.isInteger(item.version)) throw new Error('Chưa có phiên bản hàng thu hồi. Vui lòng tải lại.');
  const base = { expectedVersion: item.version, note };
  if (action === 'identify-batch') {
    if (!line?.originalAllocations.some((entry) => entry.id === values.allocation)) throw new Error('Vui lòng chọn lô đã xuất của đúng sản phẩm.');
    return { ...base, originalOrderDetailBatchId: values.allocation };
  }
  if (action === 'inspect' || action === 'dispose') {
    const passed = quantity('passed', 0, action === 'inspect' ? item.uninspectedQuantity : item.passedHeldQuantity);
    const failed = quantity('failed', 0, action === 'inspect' ? item.uninspectedQuantity : item.failedHeldQuantity);
    if (!passed && !failed || action === 'inspect' && passed + failed > item.uninspectedQuantity) throw new Error('Tổng số lượng phải lớn hơn 0 và không vượt phần còn được xử lý.');
    return { ...base, passedQuantity: passed, failedQuantity: failed };
  }
  if (action === 'reinspect') {
    if (!['passed', 'failed'].includes(values.from)) throw new Error('Vui lòng chọn phần cần kiểm tra lại.');
    return { ...base, from: values.from, quantity: quantity('quantity', 1, values.from === 'passed' ? item.passedHeldQuantity : item.failedHeldQuantity) };
  }
  if (action === 'restock') return { ...base, quantity: quantity('quantity', 1, item.passedHeldQuantity) };
  throw new Error('Thao tác kho không hợp lệ.');
}
