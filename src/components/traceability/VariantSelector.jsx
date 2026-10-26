import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Package, Scale, ShoppingBag } from 'lucide-react';
import { useShop } from '@/contexts/ShopContext';
import { comparisonVariants } from '@/lib/traceability';
import { productImages } from '@/lib/productDetail';
import { currency } from '@/lib/utils';
import { Reveal } from '@/components/common/Reveal';

export function VariantSelector({ product }) {
  const variants = comparisonVariants(product);
  const [selectedId, setSelectedId] = useState(variants.find((item) => item.id === product.defaultVariantId)?.id || variants[0]?.id || '');
  const selected = variants.find((item) => item.id === selectedId);
  const { addToCart } = useShop();
  function add(variant) {
    if (!variant.available) return;
    setSelectedId(variant.id);
    addToCart({ ...product, variantId: variant.id, defaultVariantId: variant.id, minPrice: variant.sellingPrice, unit: variant.variantName,
      stock: variant.stock, imageUrl: productImages(product)[0]?.url || product.imageUrl }, 1);
  }
  return <Reveal as="section" id="quy-cach" className="scroll-mt-8 border-t border-line py-12 sm:py-16" aria-labelledby="variants-heading">
    <div className="!mb-8 grid gap-5 md:grid-cols-2 md:items-end"><div><p className="!mb-3 text-[10px] font-semibold tracking-[0.2em] text-[#7a8c60]">03 / VỪA ĐỦ CHO NHU CẦU CỦA BẠN</p><h2 id="variants-heading" className="font-serif text-3xl font-medium text-primary sm:text-4xl">Chọn quy cách, so giá rõ ràng.</h2></div><p className="text-sm leading-7 text-stone-500">So sánh giá theo gói và đơn giá quy đổi để tìm lựa chọn phù hợp. Mỗi lần thêm tương ứng một gói hoặc hộp.</p></div>
    {variants.length ? <>
      <fieldset><legend className="sr-only">So sánh và chọn quy cách sản phẩm</legend><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{variants.map((variant) => <article key={variant.id} className={`flex min-w-0 flex-col rounded-3xl border bg-white p-6 transition-all duration-300 hover:shadow-[0_8px_28px_#2947350d] ${selectedId === variant.id ? 'border-[#7f9564] ring-1 ring-[#7f9564]' : 'border-line'}`}>
        <label className="block cursor-pointer"><div className="!mb-5 flex items-center justify-between gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-cream text-[#7a8c60]"><Package size={22} strokeWidth={1.3} /></span><input type="radio" name="traceability-variant" value={variant.id} checked={selectedId === variant.id} onChange={() => setSelectedId(variant.id)} className="size-5 accent-primary" aria-label={`So sánh ${variant.variantName}`} /></div><h3 className="break-words text-base font-semibold text-primary">{variant.variantName}</h3><p className="!mt-2 break-words text-[10px] text-stone-500">SKU: {variant.sku || 'Chưa công bố'}</p><p className="!mt-5 text-3xl font-semibold tracking-tight text-primary">{Number.isFinite(variant.sellingPrice) && variant.sellingPrice > 0 ? currency(variant.sellingPrice) : 'Chưa có giá'}</p><p className="!mt-2 text-xs text-stone-500">/ {variant.variantName}</p></label>
        <div className="!mt-5 flex-1 rounded-2xl bg-[#f5f7f0] p-4"><p className="!mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-stone-500"><Scale size={13} /> Đơn giá quy đổi</p>{variant.measurement ? <p className="text-sm font-semibold text-primary">{currency(variant.measurement.unitPrice)} <span className="text-xs font-normal text-stone-500">/ {variant.measurement.base}</span></p> : <p className="text-xs leading-6 text-stone-500">Chưa có đơn vị phù hợp để quy đổi.</p>}{variant.bestUnitPrice && <p className="!mt-2 flex items-center gap-1.5 text-[10px] font-medium text-[#6b8250]"><Check size={12} /> Đơn giá tốt nhất trong cùng đơn vị</p>}</div>
        <button type="button" onClick={() => add(variant)} disabled={!variant.available} aria-label={`Thêm ${variant.variantName} của ${product.productName} vào giỏ`} className={`!mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 !text-xs !font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${selectedId === variant.id ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-sage text-primary hover:bg-[#dfe8d4]'}`}><ShoppingBag size={15} /> {variant.available ? 'Thêm vào giỏ hàng' : variant.unavailableReason}</button>
      </article>)}</div></fieldset>
      <div className="!mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#edf1e5] px-5 py-4"><p className="text-xs leading-6 text-primary">Đang chọn: <strong>{selected?.variantName}</strong>{selected?.measurement && ` · ${currency(selected.measurement.unitPrice)} / ${selected.measurement.base}`}</p><Link to="/gio-hang" className="inline-flex min-h-11 items-center gap-2 text-xs font-medium">Xem giỏ hàng <ArrowRight size={15} /></Link></div>
    </> : <div className="rounded-3xl border border-dashed border-line bg-cream p-8 text-sm text-stone-500">Chưa có quy cách sản phẩm được công bố.</div>}
    <p className="!mt-5 text-xs leading-6 text-stone-500">Đơn giá quy đổi chỉ so sánh các quy cách cùng loại đơn vị; khối lượng và dung tích được tính riêng.</p>
  </Reveal>;
}
