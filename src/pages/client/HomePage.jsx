import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BadgeCheck, MapPin, PackageCheck, Phone, ShoppingBag, Sprout, ShieldCheck, Truck } from 'lucide-react';
import { useHome } from '@/contexts/HomeContext';
import { Reveal } from '@/components/common/Reveal';
import { ResourceState } from '@/components/common/ResourceState';
import { ProductDetail } from '@/components/products/ProductDetail';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeCategories, HomeCategoryStories, HomeCollections, HomeOffers } from '@/components/home/HomeShopping';
import { HomeEditorial } from '@/components/home/HomeEditorial';
import { HomeCertifications } from '@/components/home/HomeCertifications';
import { FOOTER_CONFIG } from '@/constants/footer';
import { PromotionBanners } from '@/components/promotions/PromotionBanners';
import '@/styles/home-page.css';

const trustPillLinks = [
  { icon: Sprout, title: 'Hiểu rõ nguồn gốc', text: 'Vùng trồng & cơ sở sản xuất', to: '/ve-cua-hang' },
  { icon: BadgeCheck, title: 'Đối chiếu chứng nhận', text: 'Hồ sơ thật & thời hạn hiệu lực', to: '/ve-cua-hang#chung-nhan' },
  { icon: ShoppingBag, title: 'Chọn mua vừa đủ', text: 'So sánh quy cách & bảng giá', to: '/san-pham' },
  { icon: PackageCheck, title: 'Giao tươi tận nơi', text: 'Theo dõi đơn hàng tiện lợi', to: '/don-hang' },
];

function HomeLoading() {
  return (
    <div className="home-page moc-home-loading container" role="status" aria-label="Đang tải thông tin cửa hàng">
      <div className="moc-home-loading-content">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="moc-home-loading-visual" />
    </div>
  );
}

export default function HomePage() {
  const { data: home, loading, error, reload } = useHome();
  const [selected, setSelected] = useState(null);

  const allProducts = useMemo(() => {
    if (!home) return [];
    return [
      ...new Map(
        [
          ...(home.featuredProducts || []),
          ...(home.newProducts || []),
          ...(home.certifiedProducts || []),
          ...(home.discountedProducts || []),
        ].map((product) => [product.id, product])
      ).values(),
    ];
  }, [home]);

  if (loading) return <HomeLoading />;
  if (error || !home) {
    return (
      <div className="container moc-home-section">
        <ResourceState error={error || 'Chưa tải được thông tin cửa hàng.'} onRetry={reload} />
      </div>
    );
  }

  const content = home.content || {};

  return (
    <div className="home-page">
      {/* 1. HERO BANNER */}
      <HomeHero content={content} exploreHref={home.categories?.length ? '#kham-pha-danh-muc' : '#san-pham'} />

      {/* 2. TRUST & DISCOVERY PILLS */}
      <section className="moc-home-trust-bar" aria-label="Cam kết thương hiệu & Hướng dẫn mua sắm">
        <div className="container">
          <div className="moc-home-trust-grid">
            {trustPillLinks.map(({ icon: Icon, title, text, to }, idx) => (
              <Reveal key={title} delay={idx * 35}>
                <Link to={to} className="moc-home-trust-card">
                  <span className="moc-home-trust-icon">
                    <Icon size={22} strokeWidth={1.4} />
                  </span>
                  <div className="moc-home-trust-text">
                    <strong>{title}</strong>
                    <small>{text}</small>
                  </div>
                  <ArrowUpRight size={14} className="moc-home-trust-arrow" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3. DANH MỤC "HÔM NAY, MÌNH CHỌN GÌ?" */}
      <HomeCategories categories={home.categories || []} products={allProducts} />

      {/* 4. BANNER COMBO TIẾT KIỆM (Combo Carousel 6s) */}
      <PromotionBanners />

      {/* 5. ƯU ĐÃI THỰC TẾ "CHỌN ĐIỀU LÀNH, THÊM TIẾT KIỆM" */}
      <HomeOffers products={home.discountedProducts || []} onView={setSelected} />

      {/* 6. BỘ SƯU TẬP MỖI NGÀY */}
      <HomeCollections home={home} onView={setSelected} />

      {/* 7. GỢI Ý CHUYÊN MỤC THEO MÙA */}
      <HomeCategoryStories categories={home.categories || []} products={allProducts} />

      {/* 8. NGUỒN GỐC, GIÁ TRỊ, CHỨNG NHẬN, GÓC ĐỌC & HỎI ĐÁP */}
      <HomeEditorial origins={home.origins} highlights={content.highlights} faqs={content.faqs}>
        <HomeCertifications certificates={home.certifications} products={allProducts} />
      </HomeEditorial>

      {/* 9. CONTACT & STORE CTA */}
      <Reveal as="section" className="moc-home-contact" aria-labelledby="home-contact-title">
        <div className="container">
          <div className="moc-home-contact-info">
            <span className="moc-home-kicker">GHÉ ORGANICFOOD.VN, THÊM MỘT CHÚT XANH</span>
            <h2 id="home-contact-title">
              Một giỏ hàng nhỏ.<br />
              <em>Nhiều niềm vui mỗi ngày.</em>
            </h2>
            <p>
              Cần tìm sản phẩm hoặc muốn hỏi thêm trước khi đặt hàng? Đội ngũ organicfood.vn luôn sẵn sàng đồng hành cùng bạn.
            </p>
            <div className="moc-home-contact-links">
              <a href={`tel:${FOOTER_CONFIG.phone}`} className="moc-home-contact-address">
                <Phone size={16} />
                <span>Hotline: {FOOTER_CONFIG.phoneDisplay}</span>
              </a>
              <p className="moc-home-contact-address">
                <MapPin size={16} />
                <span>{FOOTER_CONFIG.address}</span>
              </p>
            </div>
          </div>
          <Link to="/san-pham" className="moc-home-primary-link moc-home-primary-link--light">
            <span>Đi chợ cùng organicfood.vn</span>
            <ArrowUpRight size={19} />
          </Link>
        </div>
      </Reveal>

      {/* PRODUCT QUICK VIEW MODAL */}
      {selected && <ProductDetail product={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
