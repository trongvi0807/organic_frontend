import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Leaf, SearchX, ShieldCheck, ShoppingBag, Sparkles, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductCard } from '@/components/products/ProductCard';
import { Reveal } from '@/components/common/Reveal';
import { safeMediaUrl } from '@/lib/productDetail';
import { Select } from '@/components/ui/field';
import { discountedProductCards, shoppingCategories } from '@/lib/homeMerchandising';

const categoryHref = (id) => `/san-pham?category=${encodeURIComponent(id)}`;
const imageFor = (category, products) =>
  safeMediaUrl(products.find((item) => item.categoryId === category.id && safeMediaUrl(item.imageUrl))?.imageUrl);

function CategoryImage({ src, name }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <img src={src} alt={name || 'Danh mục thực phẩm'} loading="lazy" width="180" height="180" onError={() => setFailed(true)} />
  ) : (
    <Leaf size={36} strokeWidth={1.2} />
  );
}

export function HomeCategories({ categories, products }) {
  // Max 8 categories according to existing logic, excluding any combo categories
  const popular = shoppingCategories(categories)
    .filter((item) => Number(item.productCount) > 0)
    .sort((a, b) => Number(b.productCount) - Number(a.productCount) || String(a.name).localeCompare(String(b.name), 'vi'))
    .slice(0, 8);

  if (!popular.length) return null;

  return (
    <section id="kham-pha-danh-muc" className="container moc-home-section moc-home-categories" aria-labelledby="home-category-title">
      <Reveal className="moc-home-section-heading">
        <div>
          <span className="moc-home-kicker">
            <Sparkles size={14} className="text-[#1B4D2E]" />
            ĐI CHỢ THEO CÁCH CỦA BẠN
          </span>
          <h2 id="home-category-title">Hôm nay, mình chọn gì?</h2>
          <p>Khám phá thực phẩm tươi mới theo từng nhóm nhu cầu hàng ngày.</p>
        </div>
        <Link to="/san-pham" className="moc-home-underlined-link">
          <span>Toàn bộ danh mục</span>
          <ArrowUpRight size={16} />
        </Link>
      </Reveal>

      <div className="moc-home-category-grid">
        {popular.map((item, index) => (
          <Reveal key={item.id} delay={(index % 4) * 45}>
            <Link to={categoryHref(item.id)} className={`moc-home-category-card moc-home-tone-${index % 4}`}>
              <div className="moc-home-category-image-wrap">
                <span className="moc-home-category-image">
                  <CategoryImage key={imageFor(item, products)} src={imageFor(item, products)} name={item.name} />
                </span>
              </div>
              <h3 className="moc-home-category-name">{item.name}</h3>
              <span className="moc-home-category-count">
                {item.productCount} sản phẩm
                <ArrowUpRight size={13} />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function HomeOffers({ products, onView }) {
  // Only display products that truly have discounts according to available data
  const offers = discountedProductCards(products).slice(0, 8);
  if (!offers.length) return null;

  return (
    <section className="moc-home-offers moc-home-section" id="uu-dai" aria-labelledby="home-offers-title">
      <div className="container">
        <Reveal className="moc-home-section-heading">
          <div>
            <span className="moc-home-kicker moc-home-kicker--offer">
              <Tag size={14} />
              GIÁ TỐT TỪ CỬA HÀNG
            </span>
            <h2 id="home-offers-title">Chọn điều lành, thêm tiết kiệm.</h2>
            <p>Những sản phẩm đang giảm giá thực tế hôm nay, chọn mua từng món bạn yêu thích.</p>
          </div>
          <Link className="moc-home-underlined-link" to="/san-pham">
            <span>Xem tất cả ưu đãi</span>
            <ArrowRight size={16} />
          </Link>
        </Reveal>

        <div className="product-grid">
          {offers.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} onView={onView} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeCollections({ home, onView }) {
  const [collection, setCollection] = useState('availableProducts');
  const [category, setCategory] = useState('');

  // Products with valid discount shown in HomeOffers
  const discountedIds = new Set(discountedProductCards(home.discountedProducts || []).map((p) => p.id));

  const availableProducts = [
    ...new Map(
      [...(home.featuredProducts || []), ...(home.newProducts || []), ...(home.certifiedProducts || [])].map((product) => [
        product.id,
        product,
      ])
    ).values(),
  ];

  // Avoid repeating the same products shown in HomeOffers if there are enough products
  const filterDeduplicated = (list) => {
    const deduped = list.filter((p) => !discountedIds.has(p.id));
    return deduped.length >= 4 ? deduped : list;
  };

  const groups = {
    availableProducts: filterDeduplicated(availableProducts),
    featuredProducts: filterDeduplicated(home.featuredProducts || []),
    newProducts: filterDeduplicated(home.newProducts || []),
    certifiedProducts: filterDeduplicated(home.certifiedProducts || []),
  };

  const collections = [
    { key: 'availableProducts', label: 'Sản phẩm còn hàng', icon: ShoppingBag },
    { key: 'featuredProducts', label: 'organicfood.vn chọn lọc', icon: Leaf },
    { key: 'newProducts', label: 'Mới tại cửa hàng', icon: Sparkles },
    { key: 'certifiedProducts', label: 'Có chứng nhận hợp lệ', icon: ShieldCheck },
  ].filter((item) => groups[item.key] && groups[item.key].length > 0);

  const current = collections.find((item) => item.key === collection)?.key || collections[0]?.key;
  const items = current ? groups[current] : [];

  const availableCategories = (home.categories || []).filter((item) =>
    items.some((product) => product.categoryId === item.id)
  );
  const chosenCategory = availableCategories.some((item) => item.id === category) ? category : '';
  const products = items.filter((item) => !chosenCategory || item.categoryId === chosenCategory).slice(0, 8);

  return (
    <section className="container moc-home-section moc-home-collections" id="san-pham" aria-labelledby="home-collections-title">
      <Reveal className="moc-home-section-heading">
        <div>
          <span className="moc-home-kicker">
            <Leaf size={14} className="text-[#1B4D2E]" />
            MỘT GIỎ HÀNG, NHIỀU ĐIỀU LÀNH
          </span>
          <h2 id="home-collections-title">Dành cho bữa ăn mỗi ngày.</h2>
          <p>Tìm món quen, thử vị mới và chọn quy cách phù hợp với gia đình bạn.</p>
        </div>
        <Link to="/san-pham" className="moc-home-underlined-link">
          <span>Xem tất cả sản phẩm</span>
          <ArrowUpRight size={16} />
        </Link>
      </Reveal>

      {!!collections.length && (
        <div className="moc-home-collection-toolbar">
          <div className="moc-home-collection-tabs" role="tablist" aria-label="Chọn bộ sưu tập">
            {collections.map(({ key, label, icon: Icon }) => (
              <button
                type="button"
                role="tab"
                key={key}
                aria-selected={current === key}
                aria-pressed={current === key}
                onClick={() => {
                  setCollection(key);
                  setCategory('');
                }}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {availableCategories.length > 1 && (
            <label className="moc-home-category-filter">
              <span>Lọc danh mục:</span>
              <Select
                aria-label="Lọc danh mục trong bộ sưu tập"
                value={chosenCategory}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">Tất cả danh mục ({availableCategories.length})</option>
                {availableCategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </label>
          )}
        </div>
      )}

      {products.length ? (
        <div className="product-grid" key={`${current}:${chosenCategory}`}>
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} onView={onView} />
          ))}
        </div>
      ) : (
        <div className="moc-home-empty">
          <SearchX size={32} strokeWidth={1.3} />
          <h3>Bộ sưu tập đang được chuẩn bị</h3>
          <p>Bạn có thể khám phá thêm các sản phẩm khác trong toàn bộ danh mục.</p>
          <Link to="/san-pham" className="moc-home-primary-link">
            <span>Khám phá sản phẩm</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </section>
  );
}

export function HomeCategoryStories({ categories, products }) {
  const picks = shoppingCategories(categories)
    .filter((item) => imageFor(item, products))
    .slice(0, 2);

  if (!picks.length) return null;

  return (
    <section className="container moc-home-category-stories" aria-label="Gợi ý chuyên mục theo mùa">
      {picks.map((item, index) => (
        <Reveal key={item.id} delay={index * 80}>
          <Link to={categoryHref(item.id)} className={`moc-home-category-story moc-home-story-tone-${index % 2}`}>
            <div className="moc-home-category-story-content">
              <span className="moc-home-kicker">GỢI Ý THEO MÙA</span>
              <h2>{item.name}</h2>
              <p className="moc-home-story-subtitle">Tươi hái tự nhiên, tròn vị cho bữa cơm sum vầy.</p>
              <span className="moc-home-story-cta">
                <span>Khám phá nhóm này</span>
                <ArrowUpRight size={17} />
              </span>
            </div>
            <div className="moc-home-category-story-image">
              <CategoryImage key={imageFor(item, products)} src={imageFor(item, products)} name={item.name} />
            </div>
          </Link>
        </Reveal>
      ))}
    </section>
  );
}
