import { describe, expect, it } from 'vitest';
import { buildStoreCategoryTree, storeCategoryMenuEntries, storeCategoryPath } from './storeCategoryTree';

const categories = [
  { id: 'food', categoryName: 'Thực phẩm', parentId: null },
  { id: 'vegetable', categoryName: 'Rau củ', parentId: 'food' },
  { id: 'leaf', categoryName: 'Rau lá', parentId: 'vegetable' },
  { id: 'spinach', categoryName: 'Cải bó xôi', parentId: 'leaf' },
  { id: 'fruit', categoryName: 'Trái cây', parentId: null },
];
describe('Store category hierarchy', () => {
  it('keeps four real nested levels and resolves the selected category to its root', () => {
    const roots = buildStoreCategoryTree(categories);
    expect(roots.map((item) => item.name)).toEqual(['Thực phẩm', 'Trái cây']);
    expect(roots[0].children[0].children[0].children[0].name).toBe('Cải bó xôi');
    expect(storeCategoryPath(categories, 'spinach').map((item) => item.id)).toEqual(['food', 'vegetable', 'leaf', 'spinach']);
  });
  it('preserves different categories with the same name instead of merging identities', () => {
    const roots = buildStoreCategoryTree([{ id: 'a', name: 'Rau' }, { id: 'b', name: 'Rau' }]);
    expect(roots.map((item) => item.id)).toEqual(['a', 'b']);
  });
  it('retains orphans and breaks cycles without infinite recursion', () => {
    const roots = buildStoreCategoryTree([{ id: 'orphan', name: 'Orphan', parentId: 'missing' }, { id: 'a', name: 'A', parentId: 'b' }, { id: 'b', name: 'B', parentId: 'a' }]);
    expect(roots[0].id).toBe('orphan');
    expect(roots[1].children[0].id).toBe('b');
    expect(roots[1].children[0].children).toEqual([]);
  });
  it('shows the children of one umbrella category directly while keeping its own navigation link', () => {
    const data = categories.filter((entry) => entry.id !== 'fruit');
    const menu = storeCategoryMenuEntries(data);
    expect(menu.parent.id).toBe('food');
    expect(menu.items.map((entry) => entry.id)).toEqual(['vegetable']);
    expect(menu.items[0].children[0].children[0].id).toBe('spinach');
    expect(storeCategoryMenuEntries(categories).parent).toBeNull();
    expect(storeCategoryMenuEntries(categories).items.map((entry) => entry.id)).toEqual(['food', 'fruit']);
    expect(storeCategoryMenuEntries([{ id: 'only', name: 'Rau' }]).items[0].id).toBe('only');
  });
});
