import { useState } from 'react';
import { Reveal } from '@/components/common/Reveal';
import { BotanicalArt } from '@/components/common/BotanicalArt';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, Leaf, MapPin, ShieldCheck, Shapes, Sprout } from 'lucide-react';
import { useHome } from '@/contexts/HomeContext';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductDetail } from '@/components/products/ProductDetail';
import { ResourceState } from '@/components/common/ResourceState';
import { internalHref, dateText } from '@/lib/apiData';

export default function HomePage() {
  const { data: home, loading, error, reload } = useHome();
  const [selected, setSelected] = useState(null);
  const [collection, setCollection] = useState('featuredProducts');
  const [category, setCategory] = useState('');
  if (loading || error) return <div className="container"><ResourceState loading={loading} error={error} onRetry={reload} /></div>;
  const content = home.content;
  const banners = content.banners;
  const banner = banners[0];
  const collections = [
    { key: 'featuredProducts', title: 'Sản phẩm nổi bật' },
    { key: 'newProducts', title: 'Mới tại cửa hàng' },
    { key: 'certifiedProducts', title: 'Có chứng nhận hợp lệ' },
  ].filter((entry) => home[entry.key].length > 0);
  const current = collections.find((entry) => entry.key === collection)?.key || collections[0]?.key;
  const products = current ? home[current].filter((item) => !category || item.categoryId === category) : [];
  const allProducts = [...home.featuredProducts, ...home.newProducts, ...home.certifiedProducts];
  const stats = [
    ['availableProducts', 'Sản phẩm đang hiển thị', Leaf],
    ['categories', 'Danh mục sản phẩm', Shapes],
    ['growingRegions', 'Vùng / cơ sở sản xuất', MapPin],
    ['validCertifications', 'Chứng nhận hợp lệ', ShieldCheck],
  ].filter(([key]) => home.statistics[key] != null);
  return <>
    <section className="botanical-hero" aria-label="Khám phá cửa hàng"><div className="hero-backdrop"><img src={banner?.imageUrl || '/images/hero.jpg'} alt={banner?.imageAlt || (banner?.imageUrl ? banner.title : 'Ảnh minh họa rau củ tại cửa hàng')} fetchPriority="high" /></div><BotanicalArt className="botanical-art botanical-art-left" /><BotanicalArt className="botanical-art botanical-art-right" /><div className="botanical-hero-copy"><span className="eyebrow"><Leaf size={13} />{content.siteName} · GẦN THIÊN NHIÊN HƠN</span><h1>{content.headline}</h1><p>{content.introduction}</p><div className="botanical-hero-actions"><Link to={internalHref(banner?.buttonHref)} className="hero-cta">{banner?.buttonLabel || 'Khám phá sản phẩm'}<ArrowUpRight size={17} /></Link><a className="hero-secondary" href="#cau-chuyen">Về cửa hàng</a></div></div><div className="hero-image-caption"><div><small>{content.siteName}</small><h2>{banner?.title || 'Khám phá điều tươi lành.'}</h2>{banner?.subtitle && <p>{banner.subtitle}</p>}</div></div></section>
    {!!stats.length && <div className="container home-stats">{stats.map(([key,label,Icon]) => <div key={key}><Icon size={24} strokeWidth={1.3} /><strong>{home.statistics[key]}</strong><span>{label}</span></div>)}</div>}
    {banners.length > 1 && <Reveal as="section" className="container home-extra-banners">{banners.slice(1).map((item,index) => <Link key={index} to={internalHref(item.buttonHref)}>{item.imageUrl && <img src={item.imageUrl} alt={item.imageAlt || item.title} loading="lazy" />}<div><h2>{item.title}</h2>{item.subtitle && <p>{item.subtitle}</p>}<span>{item.buttonLabel} <ArrowRight size={15} /></span></div></Link>)}</Reveal>}
    {!!home.categories.length && <Reveal as="section" className="container category-section"><div className="section-heading"><div><span className="eyebrow">KHÁM PHÁ CỬA HÀNG</span><h2>Bạn muốn chọn gì hôm nay?</h2></div><Link className="text-link" to="/san-pham">Tất cả sản phẩm <ArrowRight size={16} /></Link></div><div className="category-grid">{home.categories.map((item,index) => { const image = allProducts.find((p) => p.categoryId === item.id && p.imageUrl)?.imageUrl; return <Link key={item.id} to={`/san-pham?category=${item.id}`} className={`category-tile category-tone-${index % 6}`}><span className="category-image">{image ? <img src={image} alt="" loading="lazy" /> : <Leaf size={28} strokeWidth={1} />}</span><h3>{item.name}</h3><span>{item.productCount} sản phẩm <ArrowUpRight size={13} /></span></Link>; })}</div></Reveal>}
    {!!collections.length && <Reveal as="section" className="products-section" id="san-pham"><div className="container"><div className="section-heading"><div><span className="eyebrow"><Leaf size={13} /> BỘ SƯU TẬP CỦA CỬA HÀNG</span><h2>Những lựa chọn dành cho bạn</h2><p>Khám phá các bộ sưu tập được cập nhật từ cửa hàng.</p></div><Link className="text-link" to="/san-pham">Xem toàn bộ sản phẩm <ArrowUpRight size={16} /></Link></div><div className="category-tabs" role="group" aria-label="Bộ sưu tập trang chủ">{collections.map((entry) => <button key={entry.key} className={current === entry.key ? 'active' : ''} aria-pressed={current === entry.key} onClick={() => { setCollection(entry.key); setCategory(''); }}>{entry.title}</button>)}</div><div className="home-collection-filter"><label>Lọc trong bộ sưu tập <select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Tất cả danh mục</option>{home.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><ResourceState empty={!products.length} />{products.length > 0 && <div className="product-grid">{products.map((item,index) => <ProductCard index={index} key={item.id} product={item} onView={setSelected} />)}</div>}</div></Reveal>}
    <Reveal as="section" className="container api-home-intro" id="cau-chuyen"><span className="intro-sprout"><Sprout size={48} strokeWidth={1} /></span><div><span className="eyebrow">VỀ {content.siteName}</span><h2>{content.headline}</h2><p>{content.introduction}</p></div></Reveal>
    {!!content.highlights.length && <Reveal as="section" className="container home-highlights" id="song-xanh">{content.highlights.map((item,index) => <article key={index}><Leaf size={25} strokeWidth={1.3} /><h3>{item.title}</h3><p>{item.description}</p></article>)}</Reveal>}
    {!!home.origins.length && <Reveal as="section" className="home-origins-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">MINH BẠCH NGUỒN GỐC</span><h2>Từ vùng trồng đến sản phẩm</h2></div></div><div className="public-info-grid">{home.origins.map((item) => <article key={item.id} className="public-origin-card"><MapPin size={25} strokeWidth={1.3} /><h3>{item.name}</h3><p>{[item.region,item.country].filter(Boolean).join(', ')}</p>{item.producerName && <strong>{item.producerName}</strong>}{item.description && <p>{item.description}</p>}<span>{item.productCount} sản phẩm liên quan</span></article>)}</div></div></Reveal>}
    {!!home.certifications.length && <Reveal as="section" className="container public-certifications"><div className="section-heading"><div><span className="eyebrow">THÔNG TIN CHỨNG NHẬN</span><h2>Chứng nhận đang hợp lệ</h2></div></div><div className="public-info-grid">{home.certifications.map((item) => <article key={item.id}><ShieldCheck size={26} strokeWidth={1.3} /><h3>{item.name}</h3><strong>{item.number}</strong><p>{item.issuingOrganization}</p><p>Cấp ngày {dateText(item.issuedAt)}</p><p>{item.expiresAt ? `Hết hạn ${dateText(item.expiresAt)}` : 'Không đặt ngày hết hạn'}</p><span>{item.productCount} sản phẩm liên quan</span></article>)}</div></Reveal>}
    {!!content.faqs.length && <Reveal as="section" className="container home-faq"><div className="section-heading"><div><span className="eyebrow">CÙNG BẠN TÌM HIỂU</span><h2>Câu hỏi thường gặp</h2></div></div>{content.faqs.map((item,index) => <details key={index}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</Reveal>}
    {selected && <ProductDetail product={selected} onClose={() => setSelected(null)} />}
  </>;
}
