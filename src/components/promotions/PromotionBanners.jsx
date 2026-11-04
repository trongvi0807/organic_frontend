import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, Leaf, Plus, ShoppingBag, TicketPercent } from 'lucide-react';
import { toast } from 'sonner';
import { useShop } from '@/contexts/ShopContext';
import { useStoreOffers } from '@/hooks/useStoreOffers';
import { comboAdditions, comboEstimate, comboProgress, offerActive, offerBenefit, offerVariant } from '@/lib/storeOffers';
import { currency, errorMessage } from '@/lib/utils';
import { safeMediaUrl } from '@/lib/productDetail';
import { ComboCarousel } from './ComboCarousel';
import '@/styles/store-promotions.css';

const productHref = product => `/san-pham/${encodeURIComponent(product.slug)}`;
const endDate = value => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export function PromotionBanners({ mode = 'home', productId }) {
  const source = useStoreOffers();
  const { cart, cartBusy, cartLoading } = useShop();
  const [expanded, setExpanded] = useState(false);
  const offers = source.offers.filter(offer => offer.promotionType === 'combo' &&
    (mode === 'home' || (mode === 'product' ? offer.products.some(p => p.productId === productId) : comboProgress(offer, cart).related)));
  if (source.loading && !source.data) return null;
  if (!offers.length && !source.error && !source.refreshError) return null;
  const carousel = mode !== 'cart';
  const shown = carousel || expanded ? offers : offers.slice(0, 2);
  return <section className={`store-promotions store-promotions--${mode}`} aria-label={mode === 'cart' ? 'Gợi ý combo cho giỏ hàng' : 'Chương trình khuyến mãi'}>
    <div className={mode === 'home' ? 'container' : ''}>
      <div className="store-promotions-heading"><div><span className="store-promotions-kicker"><TicketPercent size={15} />ƯU ĐÃI ĐANG DIỄN RA</span><h2>{mode === 'home' ? 'Mua cùng nhau, thêm ưu đãi.' : mode === 'product' ? 'Mua kèm để tiết kiệm hơn' : 'Thêm vừa đủ, nhận ưu đãi'}</h2><p>{mode === 'home' ? 'Chọn những món bạn cần, xem rõ giá và điều kiện trước khi mua.' : mode === 'product' ? 'Các combo đang áp dụng cho sản phẩm bạn đang xem.' : 'Gợi ý dựa trên những sản phẩm bạn đã chọn để thanh toán.'}</p></div>{offers.length > shown.length && <button className="store-promotions-more" onClick={() => setExpanded(true)}>Xem tất cả ({offers.length}) <ArrowUpRight size={16} /></button>}</div>
      {(source.error || source.refreshError) && <p role="status" className="store-promotions-error">Chưa cập nhật được ưu đãi. <button onClick={() => source.reload()}>Tải lại</button></p>}
      {offers.length > 0 && (carousel
        ? <ComboCarousel offers={offers} busy={cartBusy || cartLoading}>{offer => <PromotionCard offer={offer} mode={mode} productId={productId} now={source.now} onRefresh={source.reload} />}</ComboCarousel>
        : <div className="store-promotions-grid">{shown.map(offer => <PromotionCard key={offer.id} offer={offer} mode={mode} productId={productId} now={source.now} onRefresh={source.reload} />)}</div>)}
    </div>
  </section>;
}

export function PromotionCard({ offer, mode = 'home', productId, now = Date.now(), onRefresh = () => {} }) {
  const { cart, addComboToCart, cartBusy, cartLoading, cartAllowed, promoCode, setPromoCode } = useShop();
  const [choices, setChoices] = useState({}), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false);
  const renderedAt = Date.now();
  const combo = offer.promotionType === 'combo', completing = mode === 'cart';
  const progress = combo ? comboProgress(offer, cart) : null;
  const resolved = Object.fromEntries(offer.products.map(p => {
    const needed = completing ? progress.missing.find(m => m.productId === p.productId)?.missingQuantity ?? 0 : p.requiredQuantity;
    return [p.productId, offerVariant(p, choices, cart, needed)?.id];
  }));
  const estimate = combo ? comboEstimate(offer, resolved) : null;
  let additions = [], stockError = '';
  if (combo) { try { additions = comboAdditions(offer, cart, resolved, completing); } catch (failure) { stockError = errorMessage(failure); } }
  const others = offer.products.filter(p => p.productId !== productId);
  const summary = mode === 'product' ? `Mua cùng ${others.map(p => p.productName).join(' + ')} để được ${offerBenefit(offer)}.`
    : completing ? progress.sets ? `Giỏ đã đủ ${progress.sets} bộ. Chọn mã ${offer.promotionCode} để kiểm tra ưu đãi.`
      : `Thêm ${progress.missing.map(p => `${p.missingQuantity} × ${p.productName}`).join(' + ')} để đủ một bộ dùng mã ${offer.promotionCode}.`
      : offer.description;
  async function add() {
    if (lock.current) return;
    if (!offerActive(offer, now + Math.max(0, Date.now() - renderedAt))) { setError('Chương trình đã hết hạn. Hãy xem ưu đãi khác.'); onRefresh(); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      if (completing && !progress.missing.length) {
        setPromoCode(offer.promotionCode);
        toast.success(`Đã chọn mã ${offer.promotionCode}`, { description: 'Ưu đãi được kiểm tra lại khi thanh toán.' });
      } else {
        const items = comboAdditions(offer, cart, resolved, completing);
        if (await addComboToCart(offer, items)) onRefresh({ background: true });
        else { setError('Chưa thêm được combo. Kiểm tra thông báo giỏ hàng rồi thử lại.'); onRefresh({ background: true }); }
      }
    } catch (failure) { setError(errorMessage(failure)); }
    finally { lock.current = false; setBusy(false); }
  }
  const banner = combo && !completing;
  const heading = <>
    <div className="store-offer-top"><span className="store-offer-badge">{combo ? 'COMBO' : 'ƯU ĐÃI'} · {offerBenefit(offer)}</span><span className="store-offer-code">{offer.promotionCode}</span></div>
    <h3>{offer.name}</h3>{summary && <p className="store-offer-description">{summary}</p>}
  </>;
  const products = <div className="store-offer-products">{offer.products.map((product, index) => {
      const variant = offerVariant(product, resolved);
      const image = safeMediaUrl(product.imageUrl);
      return <div className="store-offer-product" key={product.productId}>
        {combo && index > 0 && <span className="store-offer-plus" aria-hidden="true"><Plus size={14} /></span>}
        <Link to={productHref(product)} className="store-offer-image"><ShoppingBag size={27} aria-hidden="true" />{image && <img key={image} src={image} alt={product.productName} loading="lazy" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />}<span>{combo ? `${product.requiredQuantity} ×` : 'Từ'}</span></Link>
        <Link className="store-offer-product-name" to={productHref(product)}>{product.productName}</Link>
        <strong className="store-offer-unit-price">{currency(variant?.price)}</strong>
        {combo && <label className="store-offer-variant"><span className="sr-only">Quy cách {product.productName}</span><select value={variant?.id || ''} onChange={event => { setChoices(old => ({ ...old, [product.productId]: event.target.value })); setError(''); }} disabled={busy || cartBusy}>{product.variants.map(v => <option key={v.id} value={v.id}>{v.variantName} · {currency(v.price)}{v.availableQuantity < product.requiredQuantity ? ' · Thiếu hàng' : ''}</option>)}</select></label>}
      </div>;
    })}</div>;
  const terms = <div className="store-offer-terms"><span>Đến {endDate(offer.endsAt)}</span>{Number(offer.minOrderValue) > 0 && <span>Đơn từ {currency(offer.minOrderValue)}</span>}{offer.maxDiscountAmount != null && <span>Giảm tối đa {currency(offer.maxDiscountAmount)}/đơn</span>}{offer.productCount > offer.products.length && <span>Và {offer.productCount - offer.products.length} sản phẩm khác</span>}</div>;
  const pricing = combo && !completing && <div className="store-offer-pricing"><div><small>Giá combo theo quy cách đã chọn</small><strong>{currency(estimate.total)}</strong>{estimate.discount > 0 && <del>{currency(estimate.subtotal)}</del>}</div>{estimate.discount > 0 && <span>Tiết kiệm {currency(estimate.discount)}</span>}</div>;
  const action = <>
    {combo ? <><button type="button" className="store-offer-action" disabled={busy || cartBusy || cartLoading || !cartAllowed || !!stockError || !offerActive(offer, now) || completing && !additions.length && promoCode === offer.promotionCode} onClick={add}>{busy ? 'Đang thêm…' : completing && !progress.missing.length ? <><Check size={17} />{promoCode === offer.promotionCode ? 'Đã chọn mã này' : `Chọn mã ${offer.promotionCode}`}</> : <><ShoppingBag size={17} />{completing ? 'Thêm món còn thiếu' : 'Thêm combo vào giỏ'}</>}</button><p className="store-offer-footnote">{stockError || (completing ? 'Chỉ tính các món đã chọn. Ưu đãi được kiểm tra lại khi thanh toán.' : 'Ưu đãi áp dụng khi mua đủ sản phẩm trong combo.')}</p></>
      : <Link className="store-offer-action" to={productHref(offer.products[0])}>Chọn sản phẩm <ArrowUpRight size={17} /></Link>}
    {error && <p role="alert" className="store-offer-error">{error}</p>}
  </>;
  return <article className={`store-offer ${banner ? 'store-offer--banner' : completing ? 'store-offer--compact' : ''}`}>
    {banner ? <>
      <div className="store-offer-copy">{heading}{pricing}{terms}{action}</div>
      <div className="store-offer-visual"><div className="store-offer-visual-heading"><span><Leaf size={14} aria-hidden="true" />Chọn cùng nhau</span><span>{offer.products.length} sản phẩm trong combo</span></div>{products}</div>
    </> : <>{heading}{products}{terms}{pricing}{action}</>}
  </article>;
}
