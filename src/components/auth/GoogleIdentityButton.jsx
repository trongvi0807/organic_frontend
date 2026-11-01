import { useEffect, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { googleAuthService, loadGoogleIdentity } from '@/services/auth/googleAuthService';
import { errorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// GIS owns the button markup and popup. Nonce and Client ID come from the server;
// Google credentials remain transient and are never saved in browser storage.
export function GoogleIdentityButton({ mode = 'login', rememberMe = false, getCurrentPassword, onSuccess, onBusyChange, disabled = false }) {
  const element = useRef(null), latest = useRef({});
  latest.current = { rememberMe, getCurrentPassword, onSuccess, onBusyChange };
  const [revision, setRevision] = useState(0), [phase, setPhase] = useState('loading'), [error, setError] = useState('');
  useEffect(() => {
    if (disabled) return;
    let active = true, consumed = false, expiry;
    const target = element.current;
    setPhase('loading'); setError('');
    function fail(message) {
      if (!active) return;
      target.replaceChildren(); setPhase('error'); setError(message);
    }
    (async () => {
      try {
        const sdk = await loadGoogleIdentity();
        if (!active) return;
        const challenge = await googleAuthService.challenge(mode, () => active);
        if (!active) return;
        if (!challenge?.clientId || !challenge.nonce || !(challenge.expiresIn > 0)) throw new Error('Chưa nhận được phiên đăng nhập Google. Vui lòng thử lại.');
        sdk.initialize({
          client_id: challenge.clientId, nonce: challenge.nonce, ux_mode: 'popup', auto_select: false,
          callback: async (result) => {
            if (!active || consumed) return;
            consumed = true; clearTimeout(expiry); target.replaceChildren();
            setPhase('submitting'); latest.current.onBusyChange?.(true);
            try {
              if (!result?.credential) throw new Error('Google chưa gửi thông tin xác thực. Vui lòng thử lại.');
              const data = mode === 'link'
                ? await googleAuthService.link(result.credential, latest.current.getCurrentPassword?.())
                : await googleAuthService.login(result.credential, latest.current.rememberMe);
              if (active) { setPhase('done'); await latest.current.onSuccess(data); }
            } catch (failure) {
              const code = failure.response?.data?.name;
              fail(code === 'GOOGLE_LINK_REQUIRED'
                ? 'Email này đã có tài khoản. Hãy đăng nhập bằng mật khẩu, sau đó mở Tài khoản → Liên kết Google.'
                : errorMessage(failure));
            } finally { latest.current.onBusyChange?.(false); }
          },
        });
        sdk.renderButton(target, { type: 'standard', theme: 'outline', size: 'large', text: mode === 'link' ? 'continue_with' : 'signin_with', locale: 'vi', width: Math.min(360, target.clientWidth || 300) });
        setPhase('ready');
        expiry = setTimeout(() => { consumed = true; fail('Phiên Google đã hết hạn. Bấm thử lại để tiếp tục.'); }, Math.min(challenge.expiresIn, 300) * 1000);
      } catch (failure) { fail(errorMessage(failure)); }
    })();
    return () => { active = false; consumed = true; clearTimeout(expiry); target?.replaceChildren(); };
  }, [mode, revision, disabled]);
  return <div className="space-y-3 text-center" aria-busy={phase === 'submitting'}>
    <div ref={element} className={`flex min-h-11 justify-center ${disabled ? 'pointer-events-none opacity-50' : ''}`} />
    {!disabled && ['loading', 'submitting'].includes(phase) && <p role="status" className="flex items-center justify-center gap-2 text-xs text-stone-500"><LoaderCircle size={15} className="animate-spin motion-reduce:animate-none" />{phase === 'loading' ? 'Đang tải nút Google…' : 'Đang xác minh tài khoản…'}</p>}
    {!disabled && error && <><p role="alert" className="text-xs leading-6 text-red-700">{error}</p><Button type="button" variant="outline" size="sm" onClick={() => setRevision((value) => value + 1)}>Thử lại Google</Button></>}
  </div>;
}
