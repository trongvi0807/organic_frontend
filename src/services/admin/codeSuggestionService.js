import api, { unwrap } from '../api';
import { requireBackend } from '../backendGuard';

const endpoints = {
  products: '/admin/products/next-code',
  variants: '/admin/products/next-variant-code',
  categories: '/admin/categories/next-code',
  suppliers: '/suppliers/next-code',
  customers: '/customers/next-code',
  origins: '/origins/next-code',
};

export async function loadCodeSuggestion(kind) {
  requireBackend();
  const endpoint = endpoints[kind];
  if (!endpoint) throw new Error('Chưa hỗ trợ xem trước mã cho loại thông tin này.');
  const data = unwrap(await api.get(endpoint));
  const code = data?.code || data?.originCode;
  if (!code || typeof code !== 'string') throw new Error('Chưa lấy được mã dự kiến. Vui lòng thử lại.');
  return { code, reserved: data.reserved === true };
}
