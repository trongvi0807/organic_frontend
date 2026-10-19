import { demoCategories, demoProducts } from '@/constants/demo';
import { readStorage, writeStorage } from '@/lib/storage';

const key = (type) => `moc.demo.${type}.v1`;
export const demoList = (type) => readStorage(key(type), type === 'products' ? demoProducts : demoCategories);
export function demoSave(type, id, values) {
  const list = demoList(type);
  const item = { ...values, id: id || crypto.randomUUID() };
  const index = list.findIndex((entry) => entry.id === id);
  if (id && index < 0) throw new Error('Không tìm thấy dữ liệu.');
  if (index >= 0) list[index] = { ...list[index], ...item };
  else list.unshift(item);
  writeStorage(key(type), list);
  return item;
}
export function demoDelete(type, id) {
  const list = demoList(type);
  if (type === 'categories') {
    if (demoList('products').some((product) => product.categoryId === id)) throw new Error('Danh mục đang có sản phẩm. Hãy chuyển sản phẩm sang danh mục khác trước.');
    writeStorage(key(type), list.filter((item) => item.id !== id));
  } else {
    // Match backend semantics: DELETE deactivates a product rather than removing it.
    writeStorage(key(type), list.map((item) => item.id === id ? { ...item, status: 'inactive' } : item));
  }
}
export function demoPage(type, params = {}, publicOnly = false) {
  const { page = 0, size = 8, keyword = '', categoryId, status } = params;
  let items = demoList(type).filter((item) => (!publicOnly || item.status === 'active') && (!status || item.status === status));
  if (keyword) items = items.filter((item) => `${item.productName || item.categoryName} ${item.productCode || item.categoryCode}`.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')));
  if (categoryId) items = items.filter((item) => item.categoryId === categoryId);
  if (type === 'products') items = items.map((item) => ({ ...item, categoryName: demoList('categories').find((category) => category.id === item.categoryId)?.categoryName || 'Chưa phân loại' }));
  const totalElements = items.length;
  if (params.sortBy === 'minPrice') items.sort((a, b) => (a.minPrice - b.minPrice) * (params.direction === 'desc' ? -1 : 1));
  return { items: items.slice(page * size, (page + 1) * size), page, size, totalElements, totalPages: Math.ceil(totalElements / size), hasNext: (page + 1) * size < totalElements };
}
