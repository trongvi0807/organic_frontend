import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { publishPaymentUpdate } from './useOrderRefresh';
export function usePaymentConfirmation(id, status) {
  const { user } = useAuth(), announced = useRef(new Set());
  useEffect(() => {
    if (!id || status !== 'paid') return;
    const key = `moc.payment.confirmed:${user?.username}:${id}`;
    if (announced.current.has(key)) return;
    announced.current.add(key);
    let seen = false;
    try { seen = sessionStorage.getItem(key) === 'paid'; sessionStorage.setItem(key, 'paid'); } catch { /* Component ref still prevents repeats. */ }
    if (!seen) { toast.success('Thanh toán thành công! Hệ thống đã xác nhận nhận đủ tiền.', { position: 'top-left', id: key, duration: 6000 }); publishPaymentUpdate(); }
  }, [id, status, user?.username]);
}
