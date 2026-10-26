// Cloudinary processing can outlast the 15-second timeout used by ordinary API calls.
export const AVATAR_UPLOAD_TIMEOUT_MS = 60_000;

export function avatarUploadError(error) {
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return 'Hết thời gian chờ tải ảnh. Máy chủ có thể vẫn đang xử lý; hãy tải lại hồ sơ để kiểm tra trước khi thử lại.';
  }
  const status = error.response?.status;
  if (status) {
    const message = typeof error.response.data?.message === 'string' ? error.response.data.message : null;
    const fallback = status === 413
      ? 'Máy chủ hoặc proxy từ chối dung lượng tệp. Ảnh tối đa 5 MB.'
      : status === 415
        ? 'Máy chủ không nhận được ảnh đúng định dạng multipart. Vui lòng thử lại với ảnh JPEG, PNG hoặc WebP.'
        : 'Máy chủ chưa thể cập nhật ảnh. Vui lòng thử lại.';
    return `Tải ảnh thất bại (HTTP ${status}): ${message || fallback}`;
  }
  if (error.code === 'ERR_NETWORK') return 'Không kết nối được máy chủ để tải ảnh. Vui lòng kiểm tra kết nối và tải lại hồ sơ.';
  return error.message || 'Không thể tải ảnh đại diện. Vui lòng thử lại.';
}
