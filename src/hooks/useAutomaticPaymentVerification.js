import { useEffect, useRef, useState } from 'react';
import { awaitingPayment, gatewayVerificationDelay, verifyReturnedPayment } from '@/services/client/paymentVerificationService';
import { errorMessage } from '@/lib/utils';

export function useAutomaticPaymentVerification({ username, payment, returnQuery, cancelled, onVerified, onRefresh }) {
  const current = useRef({ payment, onVerified, onRefresh });
  current.current = { payment, onVerified, onRefresh };
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const id = payment?.id, gateway = payment?.gateway, status = payment?.status;
  useEffect(() => {
    setBusy(false); setError('');
    if (!id || !awaitingPayment({ status }) || status === 'creating' || !gatewayVerificationDelay[gateway]) return;
    // Signed VNPay returns are already verified by resolvePaymentReturn. Do not
    // submit the same result or start QueryDR on every background GET.
    if (gateway === 'vnpay' && new URLSearchParams(returnQuery).has('vnp_SecureHash')) return;
    let active = true, timer, attempts = 0;
    async function verify() {
      if (!active || !awaitingPayment(current.current.payment)) return;
      if (document.visibilityState === 'hidden') { timer = setTimeout(verify, 3000); return; }
      setBusy(true);
      try {
        const result = await verifyReturnedPayment({ username, payment: current.current.payment, returnQuery, cancelled });
        if (!active) return;
        setError(''); current.current.onVerified(result);
        if (!awaitingPayment(result)) return;
      } catch (failure) {
        if (!active) return;
        setError(`Chưa xác minh được giao dịch: ${errorMessage(failure)} Hệ thống sẽ tiếp tục cập nhật; không thanh toán lại nếu đã bị trừ tiền.`);
        current.current.onRefresh({ background: true });
      } finally { if (active) setBusy(false); }
      // Provider calls are bounded. Read-only status polling continues after this,
      // so a later webhook confirmation still updates this page automatically.
      if (active && ++attempts < (gateway === 'vnpay' ? 1 : 6)) timer = setTimeout(verify, gatewayVerificationDelay[gateway]);
    }
    verify();
    return () => { active = false; clearTimeout(timer); };
  }, [username, id, gateway, status, returnQuery, cancelled]);
  return { busy, error };
}
