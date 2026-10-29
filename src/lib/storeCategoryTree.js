const nameOf = (category) => category?.categoryName || category?.name || '';

// Keep the API identity: two different IDs must never be merged just because names match.
export function storeCategoryPath(categories = [], categoryId, fallback = '') {
  const byId = new Map(categories.filter((item) => item?.id).map((item) => [String(item.id), item]));
  const path = [], visited = new Set();
  let current = byId.get(String(categoryId || ''));
  while (current && !visited.has(String(current.id))) {
    visited.add(String(current.id));
    path.unshift({ ...current, name: nameOf(current) });
    const parent = byId.get(String(current.parentId || ''));
    if (!parent && current.parentId && current.parentName) path.unshift({ id: current.parentId, name: current.parentName });
    current = parent;
  }
  return path.length ? path : fallback ? [{ id: categoryId, name: fallback }] : [];
}

export function storeCategoryLabel(categories, categoryId, fallback) {
  return storeCategoryPath(categories, categoryId, fallback).map((item) => item.name).filter(Boolean).join(' › ');
}

export function storeCategoryOptions(categories = []) {
  const unique = [...new Map(categories.filter((item) => item?.id).map((item) => [String(item.id), item])).values()];
  return unique.map((item) => ({ ...item, label: storeCategoryLabel(unique, item.id, nameOf(item)) }))
    .sort((left, right) => left.label.localeCompare(right.label, 'vi'));
}
