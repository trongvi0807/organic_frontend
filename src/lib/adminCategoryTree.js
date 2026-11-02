import { buildStoreCategoryTree } from './storeCategoryTree';

export function adminCategoryTree(categories = [], excludedId) {
  const unique = [...new Map(categories.filter((item) => item?.id).map((item) => [String(item.id), item])).values()];
  const children = new Map();
  unique.forEach((item) => {
    const key = String(item.parentId || '');
    if (!children.has(key)) children.set(key, []);
    children.get(key).push(String(item.id));
  });
  const excluded = new Set(), pending = excludedId ? [String(excludedId)] : [];
  while (pending.length) {
    const id = pending.pop();
    if (excluded.has(id)) continue;
    excluded.add(id); pending.push(...(children.get(id) || []));
  }
  const available = unique.filter((item) => !excluded.has(String(item.id)));
  const sort = (nodes) => nodes.map((node) => ({ ...node, children: sort(node.children) }))
    .sort((left, right) => left.name.localeCompare(right.name, 'vi'));
  return { categories: available, roots: sort(buildStoreCategoryTree(available)) };
}
