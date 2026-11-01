import { warehousePayload, whole } from './afterSales';

export function conditionCounts(condition, total, damagedQuantity) {
  if (!whole(total, 1)) throw new Error('Không còn hàng để kiểm tra. Hãy đóng và cập nhật tiến độ.');
  if (condition === 'good') return { good: total, damaged: 0 };
  if (condition === 'damaged') return { good: 0, damaged: total };
  if (condition !== 'mixed') throw new Error('Vui lòng chọn tình trạng hàng thực tế.');
  if (total < 2) throw new Error('Chỉ có một sản phẩm, hãy chọn còn tốt hoặc bị hỏng.');
  if (!whole(damagedQuantity, 1, total - 1)) throw new Error(`Nhập số sản phẩm bị hỏng từ 1 đến ${total - 1}; phần còn lại được tính là hàng tốt.`);
  return { good: total - Number(damagedQuantity), damaged: Number(damagedQuantity) };
}

export function disposalGroups(item) {
  const good = Number(item?.passedHeldQuantity || 0), damaged = Number(item?.failedHeldQuantity || 0);
  return [
    ...(damaged ? [{ value: 'damaged', label: 'Hàng bị hỏng / không thể bán lại', good: 0, damaged, total: damaged }] : []),
    ...(good ? [{ value: 'good', label: 'Hàng đã kiểm tốt nhưng cần loại bỏ', good, damaged: 0, total: good }] : []),
    ...(good && damaged ? [{ value: 'all', label: 'Toàn bộ hàng đang chờ xử lý', good, damaged, total: good + damaged }] : []),
  ];
}

// Translate everyday choices into the existing, versioned warehouse API commands.
// The server remains responsible for quantities, batch eligibility and stock updates.
export function warehouseChoicePayload(action, values, item, line) {
  if (action === 'inspect') {
    const counts = conditionCounts(values.condition, item.uninspectedQuantity, values.damagedQuantity);
    return warehousePayload(action, { passed: counts.good, failed: counts.damaged }, item, line);
  }
  if (action === 'reinspect') {
    const good = Number(item.passedHeldQuantity), damaged = Number(item.failedHeldQuantity);
    const target = conditionCounts(values.condition, good + damaged, values.damagedQuantity);
    const difference = target.good - good;
    if (!difference) throw new Error('Kết quả bạn chọn giống kết quả đang lưu. Không cần xác nhận lại.');
    return warehousePayload(action, { from: difference > 0 ? 'failed' : 'passed', quantity: Math.abs(difference) }, item, line);
  }
  if (action === 'dispose') {
    const group = disposalGroups(item).find((entry) => entry.value === values.disposalGroup);
    if (!group) throw new Error('Không còn hàng thuộc nhóm này để loại bỏ. Hãy cập nhật tiến độ.');
    const partial = values.partial === true;
    if (partial && group.value === 'all') throw new Error('Hãy chọn một nhóm hàng cụ thể khi chỉ loại bỏ một phần.');
    const amount = partial ? values.quantity : group.total;
    if (!whole(amount, 1, group.total)) throw new Error(`Số lượng loại bỏ phải từ 1 đến ${group.total}.`);
    return warehousePayload(action, {
      passed: partial ? group.good ? Number(amount) : 0 : group.good,
      failed: partial ? group.damaged ? Number(amount) : 0 : group.damaged,
    }, item, line);
  }
  if (action === 'restock') {
    const amount = values.partial ? values.quantity : item.passedHeldQuantity;
    return warehousePayload(action, { quantity: amount, note: `Đã nhập lại kho ${amount} sản phẩm đủ điều kiện bán lại.` }, item, line);
  }
  return warehousePayload(action, values, item, line);
}
