import { allPages } from './apiData';
import { checkoutService } from '@/services/client/checkoutService';
import { currency } from './utils';

export const voucherStatusLabels = {
  available: 'Chưa sử dụng', reserved: 'Đang giữ cho đơn hàng', used: 'Đã sử dụng',
  expired: 'Hết hạn', unavailable: 'Tạm ngừng sử dụng',
};

export function voucherBenefit(voucher) {
  const amount = voucher.discountType === 'percentage' ? `${voucher.discountValue}%` : currency(voucher.discountValue);
  return `Giảm ${amount}${voucher.maxDiscountAmount ? `, tối đa ${currency(voucher.maxDiscountAmount)}` : ''}`;
}

export const isOwnedVoucherCode = (code) => /^VC-/i.test(String(code || '').trim());

export async function loadCheckoutVouchers() {
  const [promotions, owned] = await Promise.all([
    allPages(checkoutService.promotions), allPages(checkoutService.vouchers),
  ]);
  return [...owned.filter((item) => item.usable).map((item) => ({
    ...item, promotionCode: item.voucherCode, owned: true,
  })), ...promotions];
}
