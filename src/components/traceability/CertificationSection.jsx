import { ShieldCheck } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { CertificationCard } from './CertificationCard';

export function CertificationSection({ certificates = [] }) {
  return <Reveal as="section" id="chung-nhan" className="scroll-mt-8 border-t border-line py-12 sm:py-16" aria-labelledby="certificates-heading">
    <div className="!mb-8 grid gap-5 md:grid-cols-2 md:items-end"><div><p className="!mb-3 text-[10px] font-semibold tracking-[0.2em] text-[#7a8c60]">02 / THÔNG TIN CÓ THỂ ĐỐI CHIẾU</p><h2 id="certificates-heading" className="font-serif text-3xl font-medium text-primary sm:text-4xl">Chứng nhận & sự an tâm.</h2></div><p className="text-sm leading-7 text-stone-500">Xem tổ chức cấp, thời hạn hiệu lực và tài liệu chứng nhận của từng sản phẩm trước khi lựa chọn.</p></div>
    {certificates.length ? <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{certificates.map((certificate) => <CertificationCard key={certificate.id || certificate.certificateNumber} certificate={certificate} />)}</div> : <div className="flex items-start gap-4 rounded-3xl border border-dashed border-[#d7deca] bg-[#f6f8f0] p-7"><ShieldCheck size={26} strokeWidth={1.3} className="shrink-0 text-[#85986e]" /><div><h3 className="text-sm font-medium text-primary">Chưa có chứng nhận công khai</h3><p className="!mt-2 text-sm leading-7 text-stone-500">Sản phẩm này chưa có hồ sơ chứng nhận được công bố. Bạn có thể chọn sản phẩm khác để kiểm tra.</p></div></div>}
    <p className="!mt-5 text-xs leading-6 text-stone-500">Chứng nhận thuộc phạm vi sản phẩm đang xem; không mặc định áp dụng cho toàn bộ cửa hàng.</p>
  </Reveal>;
}
