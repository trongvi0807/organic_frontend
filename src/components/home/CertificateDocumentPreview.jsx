import { useState } from 'react';
import { ArrowUpRight, FileText, ZoomIn } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { safeMediaUrl } from '@/lib/productDetail';
import { dateText } from '@/lib/apiData';
import { isDemoCertificate } from '@/services/client/homeCertificateDocuments';

function SampleDocument({ certificate }) {
  const number = certificate.number || certificate.certificateNumber;
  const type = number === 'DEMO-CERT-001' ? ['TRỒNG TRỌT', 'HỮU CƠ'] : number === 'DEMO-CERT-002' ? ['AN TOÀN', 'THỰC PHẨM'] : ['CHẾ BIẾN', 'HỮU CƠ'];
  return <svg viewBox="0 0 420 560" role="img" aria-label={`Hình giấy chứng nhận minh họa: ${certificate.name}. Không phải chứng nhận thực tế.`} className="h-full w-full object-contain">
    <rect width="420" height="560" fill="#fffdf7" /><rect x="19" y="19" width="382" height="522" fill="none" stroke="#79916e" /><rect x="27" y="27" width="366" height="506" fill="none" stroke="#c5d2bd" />
    <path d="M210 90C175 89 174 59 174 59c34-1 43 23 36 31m0 0c-5-34 30-47 30-47s12 36-30 47m0 0v15" fill="#53774a" stroke="#53774a" strokeWidth="2" />
    <g fill="#244c35" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif"><text x="210" y="131" fontSize="15" letterSpacing="3">HỒ SƠ MINH HỌA</text><text x="210" y="174" fontSize="27" fontWeight="bold">GIẤY CHỨNG NHẬN</text><text x="210" y="208" fontSize="20">{type[0]}</text><text x="210" y="235" fontSize="20">{type[1]}</text></g>
    <path d="M96 255h228" stroke="#a5b79a" />
    <g fill="#62735e" fontFamily="Arial, sans-serif" textAnchor="middle"><text x="210" y="284" fontSize="13">Số hồ sơ: {number}</text><text x="210" y="315" fontSize="12">Đơn vị chứng nhận mẫu</text><text x="210" y="336" fontSize="12">Không phải chứng nhận thực tế</text><text x="210" y="382" fontSize="12">Ngày cấp: {dateText(certificate.issuedAt)}</text><text x="210" y="405" fontSize="12">Hiệu lực đến: {dateText(certificate.expiresAt)}</text></g>
    <text x="210" y="472" textAnchor="middle" fill="#79916e" fontFamily="Arial, sans-serif" fontSize="12" letterSpacing="2">CHỈ DÙNG MINH HỌA GIAO DIỆN</text>
    <text x="210" y="295" textAnchor="middle" transform="rotate(-28 210 295)" fill="#78916e" opacity="0.12" fontFamily="Arial, sans-serif" fontSize="81" fontWeight="bold">MẪU</text>
  </svg>;
}

export function CertificateDocumentPreview({ certificate, document }) {
  const [open, setOpen] = useState(false), [failed, setFailed] = useState(false);
  const sample = isDemoCertificate(certificate);
  const url = !sample && safeMediaUrl(document?.documentUrl || certificate.documentUrl);
  const pdf = url && (/\.pdf(?:[?#]|$)/i.test(url) || document?.documentContentType === 'application/pdf');
  const canPreview = sample || (url && !pdf && !failed);
  const visual = () => sample ? <SampleDocument certificate={certificate} /> : url && !pdf && !failed ? <img src={url} alt={`Tài liệu ${certificate.name}`} loading="lazy" decoding="async" onError={() => setFailed(true)} className="h-full w-full object-contain" /> : <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center text-stone-500"><FileText size={38} strokeWidth={1.2} /><span className="text-xs">{pdf ? 'Tài liệu chứng nhận PDF' : url ? 'Chưa tải được ảnh chứng nhận' : 'Chưa có ảnh chứng nhận công khai'}</span></div>;
  return <>
    {canPreview ? <button type="button" onClick={() => setOpen(true)} aria-label={`Phóng to ${sample ? 'hình minh họa ' : ''}${certificate.name}`} className="group relative block h-64 w-full overflow-hidden rounded-xl border border-[#e1e8d3] bg-[#f5f7ef] p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:h-72">{visual()}<span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-2 text-[10px] text-primary shadow-sm"><ZoomIn size={14} />Xem ảnh</span>{sample && <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold text-primary">Ảnh minh họa · Mẫu</span>}</button> : <div className="h-64 rounded-xl border border-line bg-[#f5f7ef] p-3 sm:h-72">{visual()}</div>}
    {url && <a href={url} target="_blank" rel="noopener noreferrer" className="!mt-2 inline-flex min-h-11 items-center gap-1 text-xs text-primary underline">Mở tài liệu gốc <ArrowUpRight size={12} /></a>}
    <Modal open={open} onOpenChange={setOpen} title={certificate.name} description={sample ? 'Ảnh minh họa cho hồ sơ mẫu; không phải chứng nhận thực tế.' : `Tài liệu đính kèm hồ sơ ${certificate.number || ''}.`} className="!max-w-[620px]">
      {open && <div className="flex h-[65dvh] justify-center rounded-xl bg-[#f5f7ef] p-3">{visual()}</div>}
    </Modal>
  </>;
}
