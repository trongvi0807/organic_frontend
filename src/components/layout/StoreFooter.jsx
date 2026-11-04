import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUp, Clock3, Leaf, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { FOOTER_CONFIG } from '@/constants/footer';
import { PaymentBrand } from '@/components/checkout/PaymentBrand';
import '@/styles/store-footer.css';

function FooterLinks({ links }) {
  return <ul className="organic-footer-links">{links.map(item => <li key={item.label}>
    {item.to ? <Link to={item.to}>{item.label}</Link>
      : <a href={item.href} target="_blank" rel="noopener noreferrer">{item.label}</a>}
  </li>)}</ul>;
}

export function StoreFooter({ content }) {
  const config = FOOTER_CONFIG;
  const email = content?.contactEmail || config.emails[0];
  return <footer id="lien-he" aria-label="Thông tin cửa hàng và hỗ trợ" className="organic-store-footer">
    <div className="organic-footer-welcome"><div className="container organic-footer-welcome-inner">
      <div className="organic-footer-welcome-copy"><span className="organic-footer-leaf"><Leaf size={27} strokeWidth={1.4} /></span><div><p>CÙNG BẠN CHỌN ĐIỀU TỐT LÀNH</p><h2>Mỗi bữa ăn, thêm một chút xanh.</h2></div></div>
      <Link to="/diem-thuong" className="organic-footer-rewards">Điểm thưởng & ưu đãi<ArrowRight size={17} /></Link>
    </div></div>

    <div className="container organic-footer-content">
      <div className="organic-footer-brand-row"><div><Logo /><p>{config.company.description}</p></div><div className="organic-footer-opening"><Clock3 size={19} /><div><strong>Mở cửa & tư vấn</strong><p>{config.hours}</p></div></div></div>
      <div className="organic-footer-certificates"><span><ShieldCheck size={15} />Thông tin chứng nhận công bố</span>{config.certificationReferences.map(item => <a key={item.code} href="https://organicfood.vn/" target="_blank" rel="noopener noreferrer">{item.label}: <strong>{item.code}</strong></a>)}</div>
      <div className="organic-footer-columns">
        <section className="organic-footer-stores" aria-labelledby="footer-stores-title"><h3 id="footer-stores-title">Hệ thống cửa hàng</h3>
          <div className="organic-footer-branches">{config.branches.map(branch => <address key={branch.id} className="organic-footer-branch">
            <MapPin size={16} aria-hidden="true" /><div><strong>{branch.name}</strong><a className="organic-footer-address" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`} target="_blank" rel="noopener noreferrer">{branch.address}</a>
              {(branch.phone || branch.extension) && <p>{branch.phone && <a href={`tel:${branch.phone}`}>{branch.phoneDisplay}</a>}{branch.phone && branch.extension && <span> · </span>}{branch.extension && <a href={`tel:${config.phone}`}>{config.phoneDisplay} (phím {branch.extension})</a>}</p>}
            </div>
          </address>)}</div>
        </section>
        <nav aria-label="Chính sách và hỗ trợ khách hàng"><h3>Chính sách & hỗ trợ</h3><FooterLinks links={config.policyLinks} /></nav>
        <nav aria-label="Về Organicfood.vn"><h3>Về Organicfood.vn</h3><FooterLinks links={config.aboutLinks} /></nav>
        <section className="organic-footer-contact" aria-labelledby="footer-contact-title"><h3 id="footer-contact-title">Kết nối với chúng tôi</h3>
          <a className="organic-footer-hotline" href={`tel:${config.phone}`}><Phone size={19} /><span><small>Tổng đài tư vấn</small><strong>{config.phoneDisplay}</strong></span></a>
          {email && <a className="organic-footer-email" href={`mailto:${email}`}><Mail size={15} />{email}</a>}
          <p>Giao hàng: {config.deliveryHours}</p>
          <div className="organic-footer-feedback"><span>Phản hồi chất lượng & dịch vụ</span><a href={`tel:${config.feedbackPhone}`}>{config.feedbackPhoneDisplay} · Ms Huế</a></div>
          <h4>Phương thức thanh toán</h4><div className="organic-footer-payments">{config.paymentMethods.map(method => <Link key={method.id} to="/phuong-thuc-thanh-toan" title={method.label} aria-label={method.description}><PaymentBrand gateway={method.gateway} className="!h-9 !w-14 !rounded-md !border-0 !bg-transparent !p-1" /><span className="sr-only">{method.label}</span></Link>)}</div>
        </section>
      </div>
      <div className="organic-footer-bottom"><p>© {new Date().getFullYear()} organicfood.vn · {config.company.name}.<br /><span>Mã số doanh nghiệp: {config.company.taxCode}. <a href="http://online.gov.vn/Home/WebDetails/48245" target="_blank" rel="noopener noreferrer">Thông tin Organicfood.vn tại Bộ Công Thương</a>.</span></p><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}>Về đầu trang<ArrowUp size={15} /></button></div>
    </div>
  </footer>;
}
