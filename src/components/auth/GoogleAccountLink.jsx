import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Modal } from '@/components/ui/dialog';
import { GoogleIdentityButton } from './GoogleIdentityButton';

export function GoogleAccountLink() {
  const [open, setOpen] = useState(false);
  return <section className="!my-6 rounded-2xl border border-line bg-white p-5 sm:p-6">
    <h2 className="!font-sans !text-base font-semibold text-primary">Đăng nhập bằng Google</h2>
    <p className="!my-3 text-sm leading-7 text-stone-500">Liên kết Google có cùng email với hồ sơ để lần sau đăng nhập thuận tiện hơn. Đơn hàng và điểm thành viên vẫn thuộc tài khoản hiện tại.</p>
    <Button variant="outline" onClick={() => setOpen(true)}>Liên kết Google</Button>
    {open && <LinkDialog onClose={() => setOpen(false)} />}
  </section>;
}

function LinkDialog({ onClose }) {
  const [password, setPassword] = useState(''), [ready, setReady] = useState(false), [busy, setBusy] = useState(false);
  return <Modal open title="Liên kết tài khoản Google" description="Chọn Google có email trùng với email trong hồ sơ hiện tại." onOpenChange={(value) => { if (!value && !busy) onClose(); }}>
    <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); setReady(true); }}>
      <Field label="Mật khẩu tài khoản hiện tại" hint="Nhập mật khẩu nếu tài khoản được tạo bằng tên đăng nhập và mật khẩu. Tài khoản chỉ dùng Google có thể để trống.">
        <Input type="password" autoComplete="current-password" maxLength={200} value={password} disabled={busy} onChange={(event) => { setPassword(event.target.value); setReady(false); }} />
      </Field>
      {!ready && <Button type="submit" disabled={busy}>Tiếp tục liên kết</Button>}
    </form>
    {ready && <div className="!mt-5"><GoogleIdentityButton mode="link" getCurrentPassword={() => password} onBusyChange={setBusy} onSuccess={() => { setPassword(''); toast.success('Đã liên kết Google. Bạn có thể dùng Google để đăng nhập lần sau.', { position: 'top-left' }); onClose(); }} /></div>}
  </Modal>;
}
