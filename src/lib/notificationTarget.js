export function notificationTarget(data = {}) {
  if (data.type === 'CUSTOMER_INBOX') {
    const target = typeof data.target === 'string' ? data.target : '';
    const id = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
    if (new RegExp(`^/don-hang/${id}$`).test(target) || new RegExp(`^/(phan-hoi\\?feedbackId|doi-tra\\?requestId)=${id}$`).test(target)) return target;
    return '/tai-khoan';
  }
  return data.variantId ? `/admin/inventory?variantId=${encodeURIComponent(data.variantId)}` : '/admin/notifications';
}
