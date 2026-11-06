import { BellRing } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { pushAvailability } from '@/services/pushNotifications';
import { Button } from '@/components/ui/button';

export function PushNotificationSettings({ compact = false }) {
  const push = useNotifications();
  if (!push?.pushAllowed) return null;
  const reason = pushAvailability();
  return <section aria-label="Cài đặt thông báo đẩy" className={compact ? 'space-y-3 rounded-xl bg-sage p-4' : '!my-6 rounded-2xl border border-line bg-[#f5f8f0] p-5 sm:p-6'}>
    <div className={compact ? 'space-y-3' : 'flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between'}>
      <div className="flex min-w-0 gap-3"><BellRing className="mt-1 shrink-0 text-primary" size={compact ? 18 : 23}/><div className="min-w-0">
        <h2 className={compact ? '!font-sans !text-xs !font-semibold' : '!font-sans !text-lg !font-semibold'}>{push.enabled ? 'Đang nhận thông báo trên thiết bị này' : 'Nhận thông báo đơn hàng'}</h2>
        <p className="!mt-2 text-xs leading-6 text-stone-600">Bật để nhận cập nhật đơn hàng, phản hồi và đổi trả khi bạn không mở website.</p>
        {!compact && <p className="!mt-2 text-xs leading-6 text-stone-500">Áp dụng cho trình duyệt và thiết bị này. Trình duyệt cần được phép chạy nền; khi đăng xuất, thiết bị sẽ được gỡ khỏi tài khoản.</p>}
      </div></div>
      <Button type="button" className="shrink-0" size={compact ? 'sm' : 'default'} disabled={push.busy || (!push.enabled && !!reason)} onClick={push.toggle}>{push.busy ? 'Đang cập nhật…' : push.enabled ? 'Tắt trên thiết bị này' : 'Bật thông báo'}</Button>
    </div>
    {(push.error || reason) && <p role="status" className="!mt-3 text-xs leading-6 text-amber-800">{push.error || reason}</p>}
  </section>;
}
