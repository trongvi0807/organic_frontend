import api, { unwrap } from '../api';
export const salesReportService = {
  revenue: async params => {
    const data = unwrap(await api.get('/reports/revenue', { params }));
    const validAmount = value => value != null && Number.isFinite(Number(value));
    if (!data?.summary || !data.previousSummary || !Array.isArray(data.periods) || !Array.isArray(data.categories)
      || !['grossSales','discounts','salesAfterDiscount','refunds','salesNet','liquidationRevenue','totalNet','shippingFees','orderCount'].every(key => validAmount(data.summary[key]))
      || !validAmount(data.previousSummary.totalNet)) throw new Error('Chưa nhận đủ số liệu báo cáo doanh thu. Vui lòng thử lại.');
    return data;
  },
  bestSellers: async params => unwrap(await api.get('/reports/best-selling-products', { params })),
  categories: async () => unwrap(await api.get('/reports/product-categories')),
};
