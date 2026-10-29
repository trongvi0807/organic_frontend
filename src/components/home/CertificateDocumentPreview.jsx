import { useState } from 'react';
import { ArrowUpRight, FileText, ZoomIn } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { safeMediaUrl } from '@/lib/productDetail';
import { isDemoCertificate } from '@/services/client/homeCertificateDocuments';

export function CertificateDocumentPreview({ certificate, document }) {
  const [open, setOpen] = useState(false), [failed, setFailed] = useState(false);
  // An old generated record must never produce a substitute certificate image.
  const url = !isDemoCertificate(certificate) && safeMediaUrl(document?.documentUrl || certificate.documentUrl);
  const pdf = url && (/\.pdf(?:[?#]|$)/i.test(url) || (document?.documentContentType || certificate.documentContentType) === 'application/pdf');
  const cover = url && safeMediaUrl(document?.previewImageUrl || certificate.previewImageUrl);
  const imageUrl = cover || (!pdf ? url : null);
  const canPreview = imageUrl && !failed;
  const visual = () => canPreview ? <img src={imageUrl} alt={`Tài liệu ${certificate.name}`} loading="lazy" decoding="async" onError={() => setFailed(true)} className="h-full w-full object-contain" /> : <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center text-stone-500"><FileText size={38} strokeWidth={1.2} /><span className="text-xs">{failed ? 'Chưa tải được ảnh chứng nhận' : pdf ? 'Tài liệu chứng nhận PDF' : url ? 'Chưa tải được ảnh chứng nhận' : 'Chưa có ảnh chứng nhận công khai'}</span></div>;
  return <>
    {canPreview ? <button type="button" onClick={() => setOpen(true)} aria-label={`Phóng to ${certificate.name}`} className="group relative block h-64 w-full overflow-hidden rounded-xl border border-[#e1e8d3] bg-[#f5f7ef] p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:h-72">{visual()}<span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-2 text-[10px] text-primary shadow-sm"><ZoomIn size={14} />Xem ảnh</span></button> : <div className="h-64 rounded-xl border border-line bg-[#f5f7ef] p-3 sm:h-72">{visual()}</div>}
    {url && <a href={url} target="_blank" rel="noopener noreferrer" className="!mt-2 inline-flex min-h-11 items-center gap-1 text-xs text-primary underline">Mở tài liệu gốc <ArrowUpRight size={12} /></a>}
    <Modal open={open} onOpenChange={setOpen} title={certificate.name} description={`Tài liệu đính kèm hồ sơ ${certificate.number || ''}.`} className="!max-w-[620px]">
      {open && <div className="flex h-[65dvh] justify-center rounded-xl bg-[#f5f7ef] p-3">{visual()}</div>}
    </Modal>
  </>;
}
