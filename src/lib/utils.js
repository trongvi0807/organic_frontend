import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) { return twMerge(clsx(inputs)); }
export const currency = (value) => value == null ? 'Liên hệ' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
export const slugify = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export function errorMessage(error) {
  return error.response?.data?.message || error.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
}
