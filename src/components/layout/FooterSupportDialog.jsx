import { Phone, ArrowRight, Info, CreditCard, Banknote, Landmark, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '@/components/ui/dialog';
import { FOOTER_CONFIG, FOOTER_TOPICS } from '@/constants/footer';

export const paymentIcons = { cash: Banknote, bank: Landmark, wallet: Smartphone, card: CreditCard };

export function FooterSupportDialog({ topic, onClose, faqs = [] }) {
  // Keep the current content during Radix's exit animation.
  const [retainedTopic, setRetainedTopic] = useState(topic);
  useEffect(() => { if (topic) setRetainedTopic(topic); }, [topic]);
  const activeTopic = topic || retainedTopic;
  const social = activeTopic?.startsWith('social:') ? FOOTER_CONFIG.socialLinks.find((item) => `social:${item.platform}` === activeTopic) : null;
  const data = social ? { title: `Kết nối với Mộc trên ${social.label}`, description: 'Kênh mạng xã hội đang được chuẩn bị.', demo: true, steps: [['Thông tin mô phỏng', `Biểu tượng ${social.label} đang dùng để minh họa giao diện. Trang chính thức sẽ được cập nhật khi cửa hàng công bố.`]] }
    : activeTopic === 'payment' ? { title: 'Phương thức thanh toán', description: FOOTER_CONFIG.paymentDemo ? 'Các hình thức dự kiến được thể hiện trong bản mô phỏng.' : 'Chọn phương thức đang được bật tại bước thanh toán.', demo: FOOTER_CONFIG.paymentDemo }
    : activeTopic === 'faq' ? { title: 'Câu hỏi thường gặp', description: 'Thông tin hỗ trợ từ cửa hàng.' }
    : FOOTER_TOPICS[activeTopic];
  return <Modal open={Boolean(topic)} onOpenChange={(open) => { if (!open) onClose(); }} title={data?.title || 'Hỗ trợ khách hàng'} description={data?.description || 'Liên hệ Mộc để được tư vấn.'}>
    <div className="space-y-5">
      {data?.demo && <div className="flex items-start gap-2 rounded-xl bg-[#f5f1df] px-4 py-3 text-xs leading-6 text-[#88713f]"><Info size={16} className="!mt-1 shrink-0" /><p>Nội dung mô phỏng. Thông tin và điều kiện chính thức sẽ được cửa hàng cập nhật trước khi áp dụng.</p></div>}
      {data?.steps?.map(([title, body], index) => <section key={title} className="flex gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sage text-[10px] font-semibold text-primary">{String(index + 1).padStart(2, '0')}</span><div><h3 className="text-sm font-semibold text-primary">{title}</h3><p className="!mt-2 text-xs leading-7 text-stone-500">{body}</p></div></section>)}
      {activeTopic === 'payment' && <><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{FOOTER_CONFIG.paymentMethods.map((method) => { const Icon = paymentIcons[method.id] || CreditCard; return <div key={method.id} className="flex items-center gap-3 rounded-xl border border-line bg-cream p-4"><Icon size={23} strokeWidth={1.4} className="shrink-0 text-[#7c8e61]" /><div><h3 className="text-xs font-semibold text-primary">{method.label}</h3><p className="!mt-1 text-[10px] leading-5 text-stone-500">{method.description}</p></div></div>; })}</div><p className="text-xs leading-7 text-stone-500">Đăng nhập, chọn hàng và đến bước Thanh toán. Chỉ các phương thức được backend cấu hình đầy đủ mới có thể chọn. Theo dõi kết quả trong chi tiết đơn hàng.</p></>}
      {activeTopic === 'faq' && (faqs.length ? faqs.map((faq) => <details key={faq.question} className="rounded-xl border border-line p-4"><summary className="cursor-pointer text-sm font-medium text-primary">{faq.question}</summary><p className="!mt-3 whitespace-pre-line text-xs leading-7 text-stone-500">{faq.answer}</p></details>) : <p className="text-sm leading-7 text-stone-500">Bạn có thể gọi hotline để được tư vấn về sản phẩm, quy cách và thông tin mua hàng.</p>)}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5"><a href={`tel:${FOOTER_CONFIG.phone}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sage px-4 text-xs font-medium text-primary"><Phone size={14} />{FOOTER_CONFIG.phoneDisplay}</a><Link to={activeTopic === 'membership' ? '/dang-ky' : '/san-pham'} onClick={onClose} className="inline-flex min-h-11 items-center gap-2 text-xs font-medium text-primary">{activeTopic === 'membership' ? 'Đăng ký thành viên' : 'Khám phá sản phẩm'}<ArrowRight size={14} /></Link></div>
    </div>
  </Modal>;
}
