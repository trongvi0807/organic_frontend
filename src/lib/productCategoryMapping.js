const text = (value) => String(value ?? '').trim();

// Group all SKU rows of one product so a category is never chosen per pack size.
export function missingProductCategories(rows = []) {
  const groups = new Map();
  for (const row of rows) {
    const values = row.values || {};
    const code = text(values.productCode);
    const key = code ? `product:${code.toUpperCase()}` : `row:${row.row}`;
    if (!groups.has(key)) groups.set(key, { key, productCode: code, productName: text(values.productName), rows: [], missingRows: [], categoryIds: [] });
    const group = groups.get(key);
    group.rows.push(row.row);
    const category = text(values.categoryId);
    if (!category) group.missingRows.push(row.row);
    else if (!group.categoryIds.includes(category)) group.categoryIds.push(category);
  }
  return [...groups.values()].filter((group) => group.missingRows.length > 0);
}

export function categoryAssignments(rows, selections, categories) {
  const assignments = [];
  for (const group of missingProductCategories(rows)) {
    const categoryId = selections[group.key] || (group.categoryIds.length === 1 ? group.categoryIds[0] : '');
    const category = categories.find((item) => item.id === categoryId && item.status === 'active');
    if (!category) throw new Error(`Chọn loại sản phẩm đang hoạt động cho ${group.productName || group.productCode || `dòng ${group.rows[0]}`}.`);
    if (group.categoryIds.some((id) => id !== categoryId)) throw new Error(`${group.productName || group.productCode}: các dòng cùng sản phẩm phải dùng cùng loại. Hãy chỉnh các ô đã có dữ liệu trong Excel trước.`);
    for (const row of group.missingRows) assignments.push({ row, categoryId });
  }
  if (!assignments.length) throw new Error('Không còn dòng thiếu loại sản phẩm để bổ sung.');
  return assignments;
}
