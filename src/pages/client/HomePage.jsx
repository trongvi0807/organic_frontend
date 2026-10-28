import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BadgeCheck, MapPin, PackageCheck, Phone, ShoppingBag, Sprout } from 'lucide-react';
import { useHome } from '@/contexts/HomeContext';
import { Reveal } from '@/components/common/Reveal';
import { ResourceState } from '@/components/common/ResourceState';
import { ProductDetail } from '@/components/products/ProductDetail';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeCategories, HomeCategoryStories, HomeCollections, HomeOffers } from '@/components/home/HomeShopping';
import { HomeEditorial } from '@/components/home/HomeEditorial';
import { HomeCertifications } from '@/components/home/HomeCertifications';
import { FOOTER_CONFIG } from '@/constants/footer';
import '@/styles/home-page.css';

const shoppingLinks = [
  { icon: Sprout, title: 'Hiểu rõ nguồn gốc', text: 'Xem vùng trồng & cơ sở sản xuất', to: '/ve-cua-hang' },
  { icon: BadgeCheck, title: 'Đối chiếu chứng nhận', text: 'Đọc hồ sơ & thời hạn hiệu lực', to: '/ve-cua-hang#chung-nhan' },
  { icon: ShoppingBag, title: 'Chọn mua vừa đủ', text: 'So sánh quy cách & giá sản phẩm', to: '/san-pham' },
  { icon: PackageCheck, title: 'Theo dõi đơn hàng', text: 'Cập nhật hành trình trong tài khoản', to: '/don-hang' },
];

function HomeLoading() {
  return <div className="home-page moc-home-loading container" role="status" aria-label="Đang tải cửa hàng"><div><span /><span /><span /><span /></div><div /></div>;
}

export default function HomePage() {
  const { data: home, loading, error, reload } = useHome();
  const [selected, setSelected] = useState(null);
  if (loading) return <HomeLoading />;
  if (error || !home) return <div className="container moc-home-section"><ResourceState error={error || 'Chưa tải được thông tin cửa hàng.'} onRetry={reload} /></div>;
  const content = home.content;
  const allProducts = [...new Map([...home.featuredProducts, ...home.newProducts, ...home.certifiedProducts].map((product) => [product.id, product])).values()];
  return <div className="home-page">
    <HomeHero content={content} exploreHref={home.categories.length ? '#kham-pha-danh-muc' : '#san-pham'} />
    <div className="moc-home-shopping-links"><div className="container">{shoppingLinks.map(({ icon: Icon, title, text, to }) => <Link to={to} key={title}><span><Icon size={24} strokeWidth={1.3} /></span><div><strong>{title}</strong><small>{text}</small></div><ArrowUpRight size={14} /></Link>)}</div></div>
    <HomeCategories categories={home.categories} products={allProducts} />
    <HomeOffers products={allProducts} onView={setSelected} />
    <HomeCollections home={home} onView={setSelected} />
    <HomeCategoryStories categories={home.categories} products={allProducts} />
    <HomeEditorial origins={home.origins} highlights={content.highlights} faqs={content.faqs}>
      <HomeCertifications certificates={home.certifications} products={allProducts} />
    </HomeEditorial>
    <Reveal as="section" className="moc-home-contact" aria-labelledby="home-contact-title"><div className="container"><div><span className="moc-home-kicker">GHÉ MỘC, THÊM MỘT CHÚT XANH</span><h2 id="home-contact-title">Một giỏ hàng nhỏ.<br /><em>Nhiều niềm vui mỗi ngày.</em></h2><p>Cần tìm sản phẩm hoặc hỏi thêm trước khi chọn? Mộc luôn sẵn sàng lắng nghe bạn.</p><a href={`tel:${FOOTER_CONFIG.phone}`} className="moc-home-contact-address"><Phone size={16} />{FOOTER_CONFIG.phoneDisplay}</a><p className="moc-home-contact-address"><MapPin size={16} />{FOOTER_CONFIG.address}</p></div><Link to="/san-pham" className="moc-home-primary-link">Đi chợ cùng Mộc<ArrowUpRight size={19} /></Link></div></Reveal>
    {selected && <ProductDetail product={selected} onClose={() => setSelected(null)} />}
  </div>;
}
