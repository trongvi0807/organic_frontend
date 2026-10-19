import { beforeEach, describe, expect, it, vi } from 'vitest';
import { demoDelete, demoList, demoPage, demoSave } from './demoStore';

beforeEach(() => {
  const values = new Map();
  vi.stubGlobal('localStorage', { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) });
});

describe('Demo catalog matches backend behavior', () => {
  it('filters by category, keyword and status before applying pagination', () => {
    const result = demoPage('products', { categoryId: 'fruits', keyword: 'hữu cơ', status: 'active', page: 1, size: 1 });
    expect(result.totalElements).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].categoryId).toBe('fruits');
    expect(result.hasNext).toBe(false);
  });
  it('deactivates deleted products and hides them from public listing', () => {
    demoDelete('products', 'p1');
    expect(demoList('products').find((item) => item.id === 'p1').status).toBe('inactive');
    expect(demoPage('products', { size: 100 }, true).items.some((item) => item.id === 'p1')).toBe(false);
  });
  it('blocks deleting categories that have products', () => {
    expect(() => demoDelete('categories', 'fruits')).toThrow('Danh mục đang có sản phẩm');
    expect(demoList('categories').some((item) => item.id === 'fruits')).toBe(true);
  });
  it('keeps existing fields on update and resolves the current category name', () => {
    demoSave('categories', 'fruits', { categoryName: 'Trái cây theo mùa' });
    const item = demoPage('products', { categoryId: 'fruits' }).items[0];
    expect(item.categoryName).toBe('Trái cây theo mùa');
    expect(demoList('categories').find((category) => category.id === 'fruits').categoryCode).toBe('TRAI_CAY');
  });
  it('persists newly created records', () => {
    const item = demoSave('categories', null, { categoryName: 'Mới', categoryCode: 'MOI', status: 'active' });
    expect(demoList('categories').find((category) => category.id === item.id).categoryName).toBe('Mới');
    demoDelete('categories', item.id);
    expect(demoList('categories').some((category) => category.id === item.id)).toBe(false);
  });
});
