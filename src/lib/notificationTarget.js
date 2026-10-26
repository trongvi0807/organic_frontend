export function notificationTarget(data = {}) {
  return data.variantId ? `/admin/inventory?variantId=${encodeURIComponent(data.variantId)}` : '/admin/notifications';
}
