import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) { return twMerge(clsx(inputs)); }
export const currency = (value) => value == null ? 'Liên hệ' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
export const slugify = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export function errorMessage(error) {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === 'ECONNABORTED') return 'Máy chủ phản hồi quá lâu. Vui lòng kiểm tra kết nối và thử lại.';
  if (error.code === 'ERR_NETWORK') return 'Không thể kết nối với cửa hàng. Vui lòng kiểm tra mạng và thử lại.';
  const status = error.response?.status;
  const messages = { 400: 'Thông tin gửi lên chưa hợp lệ.', 401: 'Phiên đăng nhập đã hết hạn.', 403: 'Bạn chưa có quyền thực hiện thao tác này.', 404: 'Không tìm thấy thông tin bạn cần. Vui lòng tải lại trang và thử lại.', 409: 'Dữ liệu đã thay đổi hoặc bị trùng. Vui lòng tải lại để kiểm tra.', 413: 'Tệp vượt quá dung lượng cho phép.', 422: 'Dữ liệu chưa đáp ứng quy tắc nghiệp vụ.', 500: 'Máy chủ gặp lỗi khi xử lý yêu cầu.', 502: 'Máy chủ chưa kết nối được dịch vụ liên quan.', 503: 'Dịch vụ tạm thời chưa sẵn sàng. Vui lòng thử lại.' };
  return messages[status] || error.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
}
