import { useState } from 'react';
import { ArrowRight, Check, Mail } from 'lucide-react';

export function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);
  return <section aria-labelledby="newsletter-title" className="rounded-2xl border border-[#dce5cf] bg-[#edf2e4] p-5 sm:p-6">
    <p className="!mb-2 flex items-center gap-2 text-[10px] font-medium tracking-[0.16em] text-[#73845c]"><Mail size={14} /> THÊM MỘT CHÚT TƯƠI LÀNH</p>
    <h3 id="newsletter-title" className="font-serif text-xl font-medium text-primary">Nhận tin từ Mộc</h3>
    <p className="!mt-2 text-xs leading-6 text-[#6f7a64]">Câu chuyện sống xanh, sản phẩm mới và những ưu đãi dành cho bạn.</p>
    <form aria-label="Đăng ký nhận tin (mô phỏng)" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); event.currentTarget.reset(); }} className="!mt-4 flex overflow-hidden rounded-xl border border-[#d8dfce] bg-white">
      <label htmlFor="footer-newsletter-email" className="sr-only">Email nhận bản tin</label>
      <input id="footer-newsletter-email" name="email" type="email" autoComplete="off" required maxLength={254} placeholder="Địa chỉ email của bạn" onChange={() => setSubmitted(false)} aria-describedby="footer-newsletter-status" className="min-w-0 flex-1 bg-white px-3 py-3 !text-base text-stone-500 placeholder:text-stone-400 sm:!text-xs" />
      <button type="submit" aria-label="Gửi đăng ký nhận tin mô phỏng" className="flex min-h-12 shrink-0 items-center gap-2 bg-primary px-4 !text-xs !font-medium text-white transition-colors hover:bg-primary-dark"><span>Gửi</span><ArrowRight size={14} /></button>
    </form>
    <p id="footer-newsletter-status" className="!mt-3 text-[10px] leading-5 text-[#6f7a64]">Biểu mẫu mô phỏng. Email không được lưu hoặc gửi đi.</p>
    <div role="status" aria-live="polite">{submitted && <p className="!mt-3 flex items-start gap-2 rounded-lg bg-white/70 p-3 text-xs leading-6 text-primary"><Check size={15} className="!mt-1 shrink-0" /><span>Đã hoàn tất thao tác mô phỏng. Bạn chưa đăng ký nhận tin thật.</span></p>}</div>
  </section>;
}
