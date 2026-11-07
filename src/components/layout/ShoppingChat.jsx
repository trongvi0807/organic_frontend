import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, X } from 'lucide-react';
import { api, DEMO_MODE, unwrap } from '@/services/api';
import { Button } from '@/components/ui/button';
import { orderBadge, paymentBadge } from '@/lib/customerOrders';
import { currency, errorMessage } from '@/lib/utils';

const suggestions = ['Gợi ý sản phẩm cho tôi', 'Cách mua và thanh toán?', 'Đơn gần nhất của tôi ở đâu?'];

export function ShoppingChat({ user }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [turns, setTurns] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(null);
  const bottom = useRef(null);
  const input = useRef(null);
  const launcher = useRef(null);

  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => { if (open) bottom.current?.scrollIntoView({ block: 'nearest' }); }, [open, turns, busy, error]);

  function close() {
    setOpen(false);
    launcher.current?.focus();
  }

  async function send(value) {
    const text = value.trim();
    if (!text || pending.current) return;
    const request = new AbortController();
    pending.current = request;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const history = turns.slice(-8).map(turn => ({ role: turn.role, text: turn.text.slice(0, 2000) }));
      const reply = unwrap(await api.post('/shopping-chat', { message: text, history }, {
        signal: request.signal, timeout: 60000,
      }));
      setTurns(old => [...old, { role: 'user', text }, { role: 'assistant', text: reply.answer, ...reply }].slice(-20));
    } catch (failure) {
      if (!request.signal.aborted) {
        setError(errorMessage(failure));
        setMessage(text);
      }
    } finally {
      pending.current = null;
      if (!request.signal.aborted) setBusy(false);
    }
  }

  if (DEMO_MODE) return null;
  return <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
    {open && <section role="dialog" aria-label="Trợ lý Organic Food" className="mb-3 flex h-[min(34rem,70dvh)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-xl" onKeyDown={event => { if (event.key === 'Escape') close(); }}>
      <header className="flex items-center justify-between gap-2 bg-primary px-4 py-3 text-white">
        <div><strong>Trợ lý Organic Food</strong><p className="!mt-1 text-xs text-white/85">Tư vấn sản phẩm và theo dõi đơn hàng</p></div>
        <button type="button" className="rounded-lg p-2 hover:bg-white/15" aria-label="Đóng trợ lý" onClick={close}><X size={19}/></button>
      </header>
      <div role="log" aria-label="Hội thoại" className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        <p className="rounded-xl bg-sage p-3">Xin chào! Bạn muốn tìm sản phẩm, kiểm tra giá và tồn kho hay theo dõi đơn hàng?</p>
        {!turns.length && <div className="flex flex-wrap gap-2">{suggestions.map(item => <Button key={item} type="button" size="sm" variant="outline" disabled={busy} onClick={() => send(item)}>{item}</Button>)}</div>}
        {turns.map((turn, index) => <div key={index} className={turn.role === 'user' ? 'ml-8 rounded-xl bg-primary p-3 text-white' : 'mr-2 rounded-xl bg-sage p-3'}>
          <p className="whitespace-pre-wrap break-words">{turn.text}</p>
          {turn.products?.map(product => <div key={product.slug} className="mt-2 rounded-lg border border-line bg-white p-2">
            <Link onClick={close} className="font-semibold underline" to={'/san-pham/' + encodeURIComponent(product.slug)}>{product.name}</Link>
            {product.price != null && <p className="text-xs">{product.variant} · {currency(product.price)}{product.available != null && ' · ' + (product.available > 0 ? 'Còn ' + product.available : 'Hết hàng')}</p>}
          </div>)}
          {turn.orders?.map(order => <div key={order.id} className="mt-2 rounded-lg border border-line bg-white p-2">
            <Link onClick={close} className="font-semibold underline" to={'/don-hang/' + order.id}>{order.code}</Link>
            <p className="text-xs">{orderBadge(order)[0]} · {paymentBadge(order)[0]}</p>
          </div>)}
        </div>)}
        {busy && <p role="status" className="text-stone-500">Đang tìm thông tin…</p>}
        {error && <p role="alert" className="rounded-lg bg-amber-50 p-2 text-amber-900">{error}</p>}
        <div ref={bottom}/>
      </div>
      <form className="flex gap-2 border-t border-line p-3" onSubmit={event => { event.preventDefault(); send(message); }}>
        <input ref={input} className="input min-w-0 flex-1" value={message} maxLength={1200} onChange={event => setMessage(event.target.value)} aria-label="Tin nhắn" placeholder="Nhập câu hỏi của bạn…" disabled={busy}/>
        <Button type="submit" size="icon" aria-label="Gửi tin nhắn" disabled={busy || !message.trim()}><Send size={17}/></Button>
      </form>
      {!user && <p className="px-3 pb-3 text-xs text-stone-500"><Link className="underline" to="/dang-nhap" onClick={close}>Đăng nhập</Link> để tra cứu đơn hàng.</p>}
    </section>}
    <button ref={launcher} type="button" aria-expanded={open} aria-label={open ? 'Thu gọn trợ lý' : 'Mở trợ lý Organic Food'} onClick={() => open ? close() : setOpen(true)} className="ml-auto flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg">
      {open ? <X size={20}/> : <MessageCircle size={20}/>}<span>Trợ lý AI</span>
    </button>
  </div>;
}
