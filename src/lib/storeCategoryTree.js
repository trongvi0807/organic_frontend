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

// Build actual nested nodes for the category explorer; never merge distinct category IDs.
export function buildStoreCategoryTree(categories = []) {
  const byId = new Map(categories.filter((item) => item?.id).map((item) => [String(item.id), item]));
  const children = new Map(), visited = new Set();
  for (const item of byId.values()) {
    const parent = String(item.parentId || '');
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(item);
  }
  function node(item, ancestors = new Set()) {
    const id = String(item.id);
    if (ancestors.has(id)) return null;
    visited.add(id);
    const path = new Set([...ancestors, id]);
    return { ...item, name: nameOf(item), children: (children.get(id) || []).map((child) => node(child, path)).filter(Boolean) };
  }
  const roots = [...byId.values()].filter((item) => !item.parentId || !byId.has(String(item.parentId))).map((item) => node(item));
  // Orphan/cyclic records cannot hang the menu or hide every category.
  for (const item of byId.values()) if (!visited.has(String(item.id))) roots.push(node(item));
  return roots;
}

// A single umbrella category remains a visible link, while its children are immediately selectable.
export function storeCategoryMenuEntries(categories = []) {
  const roots = buildStoreCategoryTree(categories);
  const parent = roots.length === 1 && roots[0].children.length ? roots[0] : null;
  return { parent, items: parent ? parent.children : roots };
}
