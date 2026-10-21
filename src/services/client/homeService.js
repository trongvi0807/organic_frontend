import { DEMO_MODE, publicApi, unwrap } from '../api';
import { demoList, demoPage } from '../demoStore';
import { normalizeHomeProduct } from '@/lib/apiData';

export function normalizeHome(data) {
  return { ...data, content: { ...data.content, banners: data.content?.banners || [], highlights: data.content?.highlights || [], faqs: data.content?.faqs || [] },
    featuredProducts: (data.featuredProducts || []).map(normalizeHomeProduct), newProducts: (data.newProducts || []).map(normalizeHomeProduct), certifiedProducts: (data.certifiedProducts || []).map(normalizeHomeProduct), categories: data.categories || [], origins: data.origins || [], certifications: data.certifications || [], statistics: data.statistics || {} };
}
export const homeService = {
  async get() {
    if (!DEMO_MODE) return normalizeHome(unwrap(await publicApi.get('/home')));
    const products = demoPage('products', { size: 8 }, true).items;
    return { content: { siteName: 'Mộc', headline: 'Lành từ đất. Tốt cho bạn.', introduction: 'Thực phẩm hữu cơ và những lựa chọn tươi lành cho mỗi ngày.', banners: [], highlights: [], faqs: [] }, featuredProducts: products.slice(0, 4), newProducts: products, certifiedProducts: [], categories: demoList('categories').filter((item) => item.status === 'active').map((item) => ({ id: item.id, name: item.categoryName, productCount: products.filter((p) => p.categoryId === item.id).length })), origins: [], certifications: [], statistics: { availableProducts: products.length } };
  },
};
