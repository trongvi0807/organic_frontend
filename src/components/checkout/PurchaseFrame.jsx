import { Link } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, Leaf, ShieldCheck } from 'lucide-react';
import { ShoppingReturnLink } from '@/components/cart/ShoppingReturnLink';

export const purchasePanel = 'min-w-0 rounded-2xl border border-[#e5e9e0] bg-white shadow-[0_4px_20px_#28462f04]';
export const purchaseButton = 'flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold !text-white transition-all duration-300 hover:bg-primary-dark hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed';
export function PurchaseFrame({ step = 1, title, description, children }) {
  const ReturnLink=step===1?ShoppingReturnLink:Link;
  return <div className="bg-[#f6f7f3]"><div className="!mx-auto max-w-[1240px] px-4 pb-32 pt-6 sm:px-8 lg:pb-16 lg:pt-8">
    <nav aria-label="Đường dẫn" className="!mb-6 flex items-center gap-2 text-xs text-stone-500"><Link to="/">Trang chủ</Link><ChevronRight size={12} /><Link to="/gio-hang" aria-current={step === 1 ? 'page' : undefined}>Giỏ hàng</Link>{step > 1 && <><ChevronRight size={12} /><span aria-current="page">{step === 3 ? 'Đặt hàng thành công' : 'Thanh toán'}</span></>}</nav>
    <div className="!mb-7 flex flex-wrap items-center justify-between gap-5"><div><p className="!mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.18em] text-[#7a8966]"><Leaf size={13} /> Mộc · Chọn lành, sống xanh</p><h1 className="font-serif text-3xl font-medium text-primary sm:text-4xl">{title}</h1>{description && <p className="!mt-2 text-xs leading-6 text-stone-500 sm:text-sm">{description}</p>}</div><ReturnLink to={step === 2 ? '/gio-hang' : '/san-pham'} className="flex min-h-10 items-center gap-2 text-xs font-medium text-primary"><ArrowLeft size={15} />{step === 2 ? 'Quay lại giỏ hàng' : 'Tiếp tục mua sắm'}</ReturnLink></div>
    <ol className="!mb-7 grid grid-cols-3 rounded-2xl border border-line bg-white p-3 text-[10px] sm:p-4 sm:text-xs" aria-label="Các bước mua hàng">{['Giỏ hàng', 'Thông tin & thanh toán', 'Hoàn tất'].map((label, i) => <li key={label} aria-current={step === i + 1 ? 'step' : undefined} className={`flex items-center justify-center gap-2 ${step >= i + 1 ? 'font-semibold text-primary' : 'text-stone-400'}`}><span className={`grid size-6 shrink-0 place-items-center rounded-full sm:size-7 ${step >= i + 1 ? 'bg-primary text-white' : 'bg-stone-100'}`}>{step > i + 1 ? <Check size={13} /> : i + 1}</span><span>{label}</span></li>)}</ol>
    {children}
    <p className="!mt-7 flex items-center justify-center gap-2 text-center text-[11px] leading-5 text-stone-500"><ShieldCheck size={15} className="shrink-0 text-primary" /> Thông tin được bảo vệ · Giá được kiểm tra trước khi xác nhận đơn</p>
  </div></div>;
}
export function CheckoutSection({ number, title, icon: Icon, children, description }) {
  return <section className={purchasePanel}><div className="flex items-center gap-3 border-b border-line px-5 py-4 sm:px-6"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sage text-primary"><Icon size={19} /></span><div><h2 className="text-sm font-semibold sm:text-base"><span className="text-[#8b987d]">{number}. </span>{title}</h2>{description && <p className="!mt-1 text-xs text-stone-500">{description}</p>}</div></div><div className="p-5 sm:p-6">{children}</div></section>;
}
