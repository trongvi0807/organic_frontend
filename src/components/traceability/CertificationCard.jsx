import { ArrowUpRight, BadgeCheck, CalendarDays, FileText, ShieldCheck } from 'lucide-react';
import { safeMediaUrl } from '@/lib/productDetail';
import { certificateState, traceabilityDate } from '@/lib/traceability';

export function CertificationCard({ certificate }) {
  const state = certificateState(certificate);
  const document = safeMediaUrl(certificate.documentUrl);
  const tones = { valid: 'bg-sage text-primary', expired: 'bg-[#f8eae4] text-[#99513e]', pending: 'bg-[#f8f0db] text-[#8c702e]' };
  return <article className="flex min-w-0 flex-col rounded-3xl border border-line bg-white p-6 transition-shadow duration-300 hover:shadow-[0_12px_32px_#2947350d] sm:p-7">
    <div className="!mb-6 flex items-start justify-between gap-3"><span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-[#d5dfc7] bg-[#f5f7ef] text-[#71845b]"><ShieldCheck size={29} strokeWidth={1.2} /></span><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-medium ${tones[state.tone]}`}>{state.tone === 'valid' && <BadgeCheck size={12} />}{state.label}</span></div>
    <p className="!mb-2 break-words text-[10px] font-medium uppercase leading-5 tracking-widest text-stone-500">{certificate.issuingOrganization || 'Tổ chức cấp chưa công bố'}</p>
    <h3 className="font-serif text-xl font-medium leading-snug text-primary">{certificate.certificateName || certificate.name || 'Chứng nhận sản phẩm'}</h3>
    <p className="!mt-3 text-xs leading-6 text-stone-500">Hồ sơ chứng nhận được liên kết với sản phẩm đang xem.</p>
    <p className="!mt-2 break-words text-xs leading-6 text-stone-500">Số chứng nhận: <span className="text-primary">{certificate.certificateNumber || certificate.number || 'Chưa công bố'}</span></p>
    <div className="!mt-6 flex-1 border-t border-line pt-5"><p className="!mb-2 flex items-center gap-2 text-xs text-stone-500"><CalendarDays size={14} /> Hiệu lực đến</p><p className={`text-lg font-semibold ${state.tone === 'expired' ? 'text-[#99513e]' : 'text-primary'}`}>{traceabilityDate(certificate.expiresAt)}</p><p className="!mt-2 text-xs text-stone-500">Ngày cấp: {traceabilityDate(certificate.issuedAt)}</p></div>
    {document ? <a href={document} target="_blank" rel="noopener noreferrer" className="!mt-6 inline-flex min-h-11 items-center justify-between gap-3 rounded-xl bg-cream px-4 text-xs font-medium transition-colors hover:bg-sage"><span className="flex items-center gap-2"><FileText size={15} /> Xem tài liệu chứng nhận</span><ArrowUpRight size={15} /></a> : <p className="!mt-6 text-xs leading-6 text-stone-400">Chưa có tài liệu công khai để đối chiếu.</p>}
  </article>;
}
