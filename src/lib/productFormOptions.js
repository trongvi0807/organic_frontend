const clean = (value) => String(value ?? '').normalize('NFC').replace(/\s+/gu, ' ').trim();
const key = (value) => clean(value).toLocaleLowerCase('vi');

const packages = ['Gói', 'Thùng', 'Hộp', 'Túi', 'Chai', 'Hũ', 'Lọ', 'Khay', 'Bó', 'Cái'];
const massUnits = ['g', 'kg', 'ml', 'l'];

function unitOptions(defaults, configured, current) {
  const labels = new Map(defaults.map((label) => [key(label), label]));
  const values = new Map();
  for (const raw of [...defaults, ...(configured || []), current]) {
    const value = clean(raw);
    if (!value) continue;
    const normalized = key(value);
    if (!values.has(normalized)) values.set(normalized, { value, label: labels.get(normalized) || value });
  }
  // Preserve the exact stored API value when editing older packaging names.
  if (clean(current)) values.set(key(current), { value: current, label: labels.get(key(current)) || clean(current) });
  return [...values.values()];
}

export const productPackageOptions = (rules, current) => unitOptions(packages, rules?.packages, current);
export const productMassUnitOptions = (rules, current) => unitOptions(massUnits, rules?.units, current);

export function productCategoryOptions(categories = [], currentId) {
  const unique = new Map();
  for (const category of categories) {
    if (category?.id && !unique.has(String(category.id))) unique.set(String(category.id), category);
  }
  const pathOf = (category) => {
    const names = [clean(category.categoryName) || 'Loại sản phẩm chưa có tên'];
    const visited = new Set([String(category.id)]);
    let parentId = category.parentId;
    while (parentId && !visited.has(String(parentId))) {
      visited.add(String(parentId));
      const parent = unique.get(String(parentId));
      if (!parent) break;
      names.unshift(clean(parent.categoryName));
      parentId = parent.parentId;
    }
    return names.filter(Boolean).join(' › ');
  };
  const paths = [...unique.values()].map((category) => ({ category, path: pathOf(category) }));
  const counts = new Map();
  paths.forEach(({ path }) => counts.set(key(path), (counts.get(key(path)) || 0) + 1));
  return paths.map(({ category, path }) => ({
    value: category.id,
    label: counts.get(key(path)) > 1 ? `${path} · ${clean(category.categoryCode) || 'Chưa có mã loại'}` : path,
    search: `${category.categoryName || ''} ${category.categoryCode || ''} ${path}`,
    disabled: category.status === 'inactive' && String(category.id) !== String(currentId),
  }));
}
