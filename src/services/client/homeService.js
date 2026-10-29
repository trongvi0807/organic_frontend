import { DEMO_MODE, publicApi, unwrap } from '../api';
import { demoList, demoPage } from '../demoStore';
import { normalizeHomeProduct } from '@/lib/apiData';

export function normalizeHome(data) {
  return { ...data, content: { ...data.content, banners: data.content?.banners || [], highlights: data.content?.highlights || [], faqs: data.content?.faqs || [] },
    featuredProducts: (data.featuredProducts || []).map(normalizeHomeProduct), newProducts: (data.newProducts || []).map(normalizeHomeProduct), certifiedProducts: (data.certifiedProducts || []).map(normalizeHomeProduct), categories: data.categories || [], origins: data.origins || [], certifications: (data.certifications || []).map((item) => ({ ...item, status: item.status || 'verified', currentlyValid: item.currentlyValid ?? (!item.status || item.status === 'verified') })), statistics: data.statistics || {} };
}
export const homeService = {
  async content() { return DEMO_MODE ? (await this.get()).content : unwrap(await publicApi.get('/home/content')); },
  async products(section = 'featured') {
    const keys = { featured:'featuredProducts', newest:'newProducts', certified:'certifiedProducts' };
    if (!keys[section]) throw new Error('Bộ sưu tập phải là featured, newest hoặc certified.');
    return DEMO_MODE ? (await this.get())[keys[section]] : (unwrap(await publicApi.get('/home/products', { params:{section} })) || []).map(normalizeHomeProduct);
  },
  async categories() { return DEMO_MODE ? (await this.get()).categories : unwrap(await publicApi.get('/home/categories')); },
  async origins() { return DEMO_MODE ? (await this.get()).origins : unwrap(await publicApi.get('/home/origins')); },
  async certifications() { return DEMO_MODE ? (await this.get()).certifications : unwrap(await publicApi.get('/home/certifications')); },
  async statistics() { return DEMO_MODE ? (await this.get()).statistics : unwrap(await publicApi.get('/home/statistics')); },
  async get() {
    if (!DEMO_MODE) return normalizeHome(unwrap(await publicApi.get('/home')));
    const products = demoPage('products', { size: 8 }, true).items;
    return { content: { siteName: 'Mộc', headline: 'Lành từ đất. Tốt cho bạn.', introduction: 'Thực phẩm hữu cơ và những lựa chọn tươi lành cho mỗi ngày.', banners: [], highlights: [], faqs: [] }, featuredProducts: products.slice(0, 4), newProducts: products, certifiedProducts: [], categories: demoList('categories').filter((item) => item.status === 'active').map((item) => ({ id: item.id, name: item.categoryName, productCount: products.filter((p) => p.categoryId === item.id).length })), origins: [], certifications: [], statistics: { availableProducts: products.length } };
  },
};
