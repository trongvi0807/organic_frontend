import { whole } from './afterSales';

export const refundStates = { pending: 'Chờ thực hiện', processing: 'Đang xử lý hoàn tiền', succeeded: 'Đã hoàn tiền', failed: 'Hoàn tiền không thành công', requires_review: 'Cần đối soát' };
export const refundMethods = { original_payment: 'Hoàn qua VNPay', bank_transfer: 'Chuyển khoản đã thực hiện', cash: 'Tiền mặt đã hoàn' };
export const replacementStates = { confirmed: 'Đã giữ hàng', paid: 'Đã giữ hàng', preparing: 'Đang chuẩn bị', shipping: 'Đang giao hàng đổi', delivered: 'Đã giao hàng đổi', completed: 'Hoàn tất hàng đổi', returned: 'Giao không thành công · Hàng trả về', cancelled: 'Đã hủy' };
export const shipmentStates = { pending: 'Chờ bàn giao', picked_up: 'Đã bàn giao', in_transit: 'Đang giao', delivered: 'Đã giao', failed: 'Giao không thành công', returned: 'Đã trả về', cancelled: 'Đã hủy chuyến' };
export const shipmentNext = { pending: ['picked_up', 'cancelled'], picked_up: ['in_transit', 'delivered', 'failed'], in_transit: ['delivered', 'failed'], failed: ['returned'] };
export const executionTitles = { refund: 'Thực hiện hoàn tiền', reconcile: 'Xác nhận kết quả đối soát', replacement: 'Tạo đơn giao hàng đổi', prepare: 'Chuẩn bị hàng đổi', book: 'Tạo chuyến giao hàng đổi', shipmentStatus: 'Cập nhật giao hàng đổi', complete: 'Hoàn tất hồ sơ' };

export function executionPayload(action, values, data, refund, shipment) {
  const required = (key, label, max = 3000) => { const value = String(values[key] || '').trim(); if (!value || value.length > max) throw new Error(`Vui lòng nhập ${label} (tối đa ${max} ký tự).`); return value; };
  const note = required('note', 'ghi chú thực hiện');
  const base = { proposalVersion: data.proposalVersion, note };
  if (action === 'refund') {
    if (!whole(values.amount, 1, data.remainingRefundAmount)) throw new Error('Tiền hoàn phải là số nguyên dương và không vượt phần được duyệt còn lại.');
    const method = values.refundMethod;
    if (!refundMethods[method]) throw new Error('Vui lòng chọn cách hoàn tiền.');
    const payment = data.payments.find((item) => item.id === values.paymentId);
    if (method === 'original_payment' && !payment?.canRefundToOriginal) throw new Error('Vui lòng chọn giao dịch VNPay đã thu tiền.');
    const result = { ...base, amount: Number(values.amount), refundMethod: method, originalPaymentId: payment?.id || null, confirmedTransferred: method !== 'original_payment' && !!values.confirmed };
    if (method !== 'original_payment') {
      if (!values.confirmed) throw new Error('Chỉ ghi nhận khi đã hoàn tiền thực tế và đã kiểm tra chứng từ.');
      result.referenceCode = required('referenceCode', 'mã biên nhận / chuyển khoản', 200);
      if (method === 'bank_transfer') {
        result.recipientName = required('recipientName', 'tên chủ tài khoản', 100); result.bankName = required('bankName', 'ngân hàng', 200);
        result.bankAccountNumber = required('bankAccountNumber', 'số tài khoản', 34);
        if (!/^[0-9]{6,34}$/.test(result.bankAccountNumber)) throw new Error('Số tài khoản cần từ 6 đến 34 chữ số.');
        result.bankBranch = values.bankBranch?.trim() || null; result.recipientPhone = values.recipientPhone?.trim() || null;
      }
    }
    return result;
  }
  if (action === 'reconcile') {
    if (!refund || !values.confirmed) throw new Error('Cần đối chiếu kết quả thực tế tại VNPay hoặc sao kê và xác nhận.');
    if (!['succeeded', 'failed'].includes(values.outcome) || !['merchant_portal', 'bank_statement'].includes(values.evidenceSource)) throw new Error('Vui lòng chọn kết quả và nguồn đối soát.');
    if (!whole(values.amount, 1) || Number(values.amount) !== Number(refund.amount)) throw new Error('Số tiền đối soát phải trùng chính xác khoản hoàn.');
    return { outcome: values.outcome, confirmedAmount: Number(values.amount), evidenceSource: values.evidenceSource, referenceCode: required('referenceCode', 'mã giao dịch được đối chiếu', 200), confirmed: true, note };
  }
  if (action === 'replacement') {
    const phone = required('receiverPhone', 'số điện thoại người nhận', 20);
    if (!/^[+0-9 ()-]{8,20}$/.test(phone)) throw new Error('Số điện thoại người nhận chưa hợp lệ.');
    return { ...base, receiverName: required('receiverName', 'tên người nhận', 100), receiverPhone: phone, shippingAddress: required('shippingAddress', 'địa chỉ nhận hàng', 500) };
  }
  if (action === 'book') {
    if (values.shippingCost !== '' && !whole(values.shippingCost, 0, 999999999999)) throw new Error('Phí giao hàng phải là số nguyên không âm.');
    return { proposalVersion: data.proposalVersion, shipment: { carrier: required('carrier', 'đơn vị giao hàng', 100), trackingCode: required('trackingCode', 'mã vận chuyển', 100), driverName: values.driverName?.trim() || null, driverPhone: values.driverPhone?.trim() || null, shippingCost: Number(values.shippingCost || 0), note: note.slice(0, 1000) } };
  }
  if (action === 'shipmentStatus') {
    if (!shipmentNext[shipment?.status]?.includes(values.shipmentStatus)) throw new Error('Trạng thái chuyến giao đã thay đổi; vui lòng tải lại để đối chiếu.');
    return { proposalVersion: data.proposalVersion, shipment: { status: values.shipmentStatus, note: note.slice(0, 1000) } };
  }
  if (!['prepare', 'complete'].includes(action)) throw new Error('Thao tác chưa hợp lệ.');
  return base;
}
