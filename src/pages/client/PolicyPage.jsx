import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Coins, CreditCard, FileText, Leaf, Mail, Phone, RotateCcw, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { POLICY_PAGES, policyPath } from '@/constants/policies';
import { FOOTER_CONFIG } from '@/constants/footer';
import { PaymentBrand } from '@/components/checkout/PaymentBrand';
import '@/styles/store-policies.css';

const icons = { points: Coins, returns: RotateCcw, delivery: Truck, privacy: ShieldCheck, payment: CreditCard, shopping: ShoppingBag, terms: FileText };

export default function PolicyPage({ slug }) {
  const page = POLICY_PAGES.find(item => item.slug === slug);
  if (!page) return null;
  const Icon = icons[page.icon];
  const sectionId = index => `${slug}-muc-${index + 1}`;
  return <div className="store-policy-page">
    <div className="container">
      <nav aria-label="Đường dẫn trang" className="policy-breadcrumb"><Link to="/">Trang chủ</Link><ChevronRight size={12} /><span>Chính sách & hỗ trợ</span><ChevronRight size={12} /><span aria-current="page">{page.title}</span></nav>
      <header className="policy-hero"><div><p><Leaf size={14} />MUA SẮM AN TÂM CÙNG ORGANICFOOD.VN</p><h1>{page.title}</h1><span>{page.summary}</span></div><span className="policy-hero-icon" aria-hidden="true"><Icon size={40} strokeWidth={1.25} /></span></header>
      <div className="policy-layout">
        <aside className="policy-sidebar">
          <nav aria-label="Các trang chính sách"><h2>Thông tin dành cho bạn</h2><ul>{POLICY_PAGES.map(item => {
            const ItemIcon = icons[item.icon], active = item.slug === slug;
            return <li key={item.slug}><Link to={policyPath(item.slug)} aria-current={active ? 'page' : undefined}><ItemIcon size={17} /><span>{item.title}</span><ChevronRight size={13} /></Link></li>;
          })}</ul></nav>
          <div className="policy-support"><h3>Bạn cần hỗ trợ thêm?</h3><p>Cửa hàng sẵn sàng lắng nghe bạn từ 7h đến 20h mỗi ngày.</p><a href={`tel:${FOOTER_CONFIG.phone}`}><Phone size={16} />{FOOTER_CONFIG.phoneDisplay}</a><a href={`mailto:${FOOTER_CONFIG.emails[0]}`}><Mail size={15} />{FOOTER_CONFIG.emails[0]}</a></div>
        </aside>
        <article className="policy-article" aria-label={page.title}>
          <div className="policy-document-meta"><span>HƯỚNG DẪN & THÔNG TIN MUA HÀNG</span><span>Cập nhật 04-11-2026</span></div>
          <nav className="policy-toc" aria-label="Nội dung trong trang"><h2>Nội dung chính</h2><ol>{page.sections.map((section, index) => <li key={section.title}><a href={`#${sectionId(index)}`}>{section.title}</a></li>)}</ol></nav>
          {page.icon === 'payment' && <div className="policy-payment-methods" aria-label="Các hình thức thanh toán">{FOOTER_CONFIG.paymentMethods.map(method => <div key={method.id}><PaymentBrand gateway={method.gateway} /><span>{method.label}</span></div>)}</div>}
          {page.sections.map((section, index) => <section key={section.title} id={sectionId(index)} className="policy-section">
            <h2><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</h2>
            {section.paragraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets && <ul>{section.bullets.map(text => <li key={text}>{text}</li>)}</ul>}
            {section.steps && <ol className="policy-steps">{section.steps.map((text, step) => <li key={text}><span>{step + 1}</span><p>{text}</p></li>)}</ol>}
          </section>)}
          <div className="policy-next-step"><div><strong>Tiếp tục ngay trên cửa hàng</strong><p>Thông tin đơn hàng và các yêu cầu của bạn được theo dõi trong tài khoản.</p></div><Link to={page.action.to}>{page.action.label}<ArrowRight size={16} /></Link></div>
        </article>
      </div>
    </div>
  </div>;
}
