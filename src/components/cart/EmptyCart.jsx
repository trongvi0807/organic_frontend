import { ShoppingReturnLink } from './ShoppingReturnLink';
import { ArrowRight } from 'lucide-react';

export function EmptyCart() {
  return <section className="!mx-auto max-w-2xl rounded-3xl border border-line bg-[#fafbf7] px-6 py-14 text-center sm:py-20" aria-labelledby="empty-cart-title">
    <svg viewBox="0 0 240 190" role="img" aria-label="Túi mua sắm với những chiếc lá xanh" className="!mx-auto !mb-6 h-44 w-56">
      <ellipse cx="120" cy="164" rx="78" ry="10" fill="#e7ebdf" />
      <circle cx="121" cy="86" r="72" fill="#eff2e7" />
      <path d="M74 69h92l10 87H64Z" fill="#fffdf5" stroke="#a3b28b" strokeWidth="2" strokeLinejoin="round" />
      <path d="M98 77V58c0-29 44-29 44 0v19" fill="none" stroke="#6d8557" strokeWidth="3" strokeLinecap="round" />
      <path d="M120 135v-32m0 16c-24 1-30-11-28-23 17-1 28 9 28 23Zm0-9c0-20 12-30 28-28 0 19-10 29-28 28Z" fill="#dce6cb" stroke="#6d8557" strokeWidth="2" strokeLinejoin="round" />
      <path d="M48 108c-16-2-19-13-17-22 14 0 23 10 17 22Zm144-59c-1-15 9-23 22-22 0 14-9 25-22 22Z" fill="#cad8b8" />
      <circle cx="59" cy="42" r="3" fill="#a6b58a" /><circle cx="189" cy="126" r="4" fill="#c5d3b1" />
    </svg>
    <p className="!mb-3 text-[10px] font-medium uppercase tracking-[0.25em] text-[#7b8f5c]">NHỮNG ĐIỀU TƯƠI LÀNH ĐANG ĐỢI</p>
    <h2 id="empty-cart-title" className="font-serif text-3xl font-medium text-primary sm:text-4xl">Giỏ hàng của bạn còn trống</h2>
    <p className="!mx-auto !mt-4 max-w-sm text-sm leading-7 text-stone-500">Một chút rau xanh, một thức trà thơm…<br />Cùng tìm những lựa chọn lành cho ngày hôm nay.</p>
    <ShoppingReturnLink className="!mt-8 inline-flex min-h-12 items-center justify-center gap-4 rounded-2xl bg-primary px-6 py-3 text-sm font-medium !text-white transition-all duration-300 hover:bg-primary-dark hover:shadow-lg motion-safe:hover:-translate-y-0.5">Tiếp tục mua sắm <ArrowRight size={16} /></ShoppingReturnLink>
  </section>;
}
