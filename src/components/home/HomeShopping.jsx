import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Leaf, SearchX, ShieldCheck, ShoppingBag, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductCard } from '@/components/products/ProductCard';
import { Reveal } from '@/components/common/Reveal';
import { safeMediaUrl } from '@/lib/productDetail';
import { Select } from '@/components/ui/field';

const categoryHref = (id) => `/san-pham?category=${encodeURIComponent(id)}`;
const imageFor = (category, products) => safeMediaUrl(products.find((item) => item.categoryId === category.id && safeMediaUrl(item.imageUrl))?.imageUrl);
function CategoryImage({ src }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? <img src={src} alt="" loading="lazy" width="180" height="180" onError={() => setFailed(true)} /> : <Leaf size={38} strokeWidth={1.1} />;
}
export function HomeCategories({ categories, products }) {
  if (!categories.length) return null;
  return <section id="kham-pha-danh-muc" className="container moc-home-section moc-home-categories" aria-labelledby="home-category-title">
    <Reveal className="moc-home-section-heading"><div><span className="moc-home-kicker">ĐI CHỢ THEO CÁCH CỦA BẠN</span><h2 id="home-category-title">Hôm nay, mình chọn gì?</h2></div><Link to="/san-pham" className="moc-home-underlined-link">Toàn bộ danh mục<ArrowUpRight size={16} /></Link></Reveal>
    <div className="moc-home-category-grid">{categories.map((item, index) => <Reveal key={item.id} delay={(index % 4) * 40}><Link to={categoryHref(item.id)} className={`moc-home-category-card moc-home-tone-${index % 4}`}><span className="moc-home-category-image"><CategoryImage key={imageFor(item, products)} src={imageFor(item, products)} /></span><h3>{item.name}</h3><span>{item.productCount != null ? `${item.productCount} sản phẩm` : 'Khám phá danh mục'}<ArrowUpRight size={14} /></span></Link></Reveal>)}</div>
  </section>;
}

export function HomeOffers({ products, onView }) {
  const offers = products.filter((item) => Number(item.minPrice) > 0 && Number(item.compareAtPrice) > Number(item.minPrice)).slice(0, 4);
  if (!offers.length) return null;
  return <section className="moc-home-offers moc-home-section" id="uu-dai" aria-labelledby="home-offers-title"><div className="container">
    <Reveal className="moc-home-section-heading"><div><span className="moc-home-kicker"><Tag size={14} />GIÁ TỐT TỪ CỬA HÀNG</span><h2 id="home-offers-title">Chọn điều lành, thêm tiết kiệm.</h2><p>Những sản phẩm có giá ưu đãi trong bộ sưu tập của Mộc.</p></div><a className="moc-home-underlined-link" href="#san-pham">Khám phá thêm<ArrowRight size={16} /></a></Reveal>
    <div className="product-grid">{offers.map((product, index) => <ProductCard key={product.id} product={product} index={index} onView={onView} />)}</div>
  </div></section>;
}

export function HomeCollections({ home, onView }) {
  const [collection, setCollection] = useState('featuredProducts'), [category, setCategory] = useState('');
  const collections = [{ key: 'featuredProducts', label: 'Mộc chọn lọc', icon: Leaf }, { key: 'newProducts', label: 'Mới tại cửa hàng', icon: ShoppingBag }, { key: 'certifiedProducts', label: 'Có chứng nhận hợp lệ', icon: ShieldCheck }].filter((item) => home[item.key].length);
  const current = collections.find((item) => item.key === collection)?.key || collections[0]?.key;
  const items = current ? home[current] : [];
  const availableCategories = home.categories.filter((item) => items.some((product) => product.categoryId === item.id));
  const chosenCategory = availableCategories.some((item) => item.id === category) ? category : '';
  const products = items.filter((item) => !chosenCategory || item.categoryId === chosenCategory).slice(0, 8);
  return <section className="container moc-home-section moc-home-collections" id="san-pham" aria-labelledby="home-collections-title">
    <Reveal className="moc-home-section-heading"><div><span className="moc-home-kicker">MỘT GIỎ HÀNG, NHIỀU ĐIỀU LÀNH</span><h2 id="home-collections-title">Dành cho bữa ăn mỗi ngày.</h2><p>Tìm món quen, thử vị mới và chọn quy cách phù hợp với bạn.</p></div><Link to="/san-pham" className="moc-home-underlined-link">Xem tất cả sản phẩm<ArrowUpRight size={16} /></Link></Reveal>
    {!!collections.length && <div className="moc-home-collection-toolbar"><div className="moc-home-collection-tabs" role="group" aria-label="Chọn bộ sưu tập">{collections.map(({ key, label, icon: Icon }) => <button type="button" key={key} aria-pressed={current === key} onClick={() => { setCollection(key); setCategory(''); }}><Icon size={15} />{label}</button>)}</div>{availableCategories.length > 1 && <label className="moc-home-category-filter">Danh mục<Select aria-label="Lọc danh mục trong bộ sưu tập" value={chosenCategory} onChange={(event) => setCategory(event.target.value)}><option value="">Tất cả danh mục</option>{availableCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label>}</div>}
    {products.length ? <div className="product-grid" key={`${current}:${chosenCategory}`}>{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} onView={onView} />)}</div> : <div className="moc-home-empty"><SearchX size={30} strokeWidth={1.3} /><h3>Bộ sưu tập đang được chuẩn bị</h3><p>Bạn có thể xem các sản phẩm khác trong danh mục.</p><Link to="/san-pham" className="moc-home-underlined-link">Khám phá sản phẩm<ArrowRight size={16} /></Link></div>}
  </section>;
}

export function HomeCategoryStories({ categories, products }) {
  const picks = categories.filter((item) => imageFor(item, products)).slice(0, 2);
  if (!picks.length) return null;
  return <section className="container moc-home-category-stories" aria-label="Khám phá thêm các nhóm sản phẩm">{picks.map((item, index) => <Reveal key={item.id}><Link to={categoryHref(item.id)} className={`moc-home-category-story moc-home-tone-${index + 1}`}><div><span className="moc-home-kicker">THÊM LỰA CHỌN CHO GIỎ HÀNG</span><h2>{item.name}</h2><span className="moc-home-underlined-link">Khám phá ngay<ArrowUpRight size={17} /></span></div><div className="moc-home-category-story-image"><CategoryImage key={imageFor(item, products)} src={imageFor(item, products)} /></div></Link></Reveal>)}</section>;
}
