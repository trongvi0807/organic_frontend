import { ArrowUpRight, BadgeCheck, CalendarDays, Clock3, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '@/components/common/Reveal';
import { useResource } from '@/hooks/useResource';
import { dateText } from '@/lib/apiData';
import { homeCertificateDocuments } from '@/services/client/homeCertificateDocuments';
import { certificateState } from '@/lib/traceability';
import { CertificateDocumentPreview } from './CertificateDocumentPreview';

export function HomeCertifications({ certificates = [], products = [] }) {
  const identity = JSON.stringify([certificates.map((item) => [item.id, item.number, item.documentUrl, item.previewImageUrl]), products.map((item) => item.id)]);
  const documents = useResource(() => homeCertificateDocuments(certificates, products), [identity]);
  return <Reveal as="section" className="container public-certifications" aria-labelledby="home-certifications-title">
    <div className="section-heading"><div><span className="eyebrow">THÔNG TIN CHỨNG NHẬN</span><h2 id="home-certifications-title">Minh bạch từ từng chứng nhận</h2><p className="!mt-3 max-w-2xl text-sm leading-7 text-stone-500">Xem tài liệu gốc, đơn vị được cấp và thời hạn của từng hồ sơ.</p></div><Link className="text-link" to="/ve-cua-hang#chung-nhan">Xem hồ sơ sản phẩm <ArrowUpRight size={16} /></Link></div>
    {certificates.length > 0 ? <>
      <div className="public-info-grid home-certificate-grid">{certificates.map((item) => {
        const state = certificateState(item), valid = state.tone === 'valid';
        return <article key={item.id} className="flex flex-col">
          <CertificateDocumentPreview key={`${item.id}:${documents.data?.documents[item.id]?.documentUrl || item.documentUrl || ''}:${item.previewImageUrl || ''}`} certificate={item} document={documents.data?.documents[item.id]} />
          <div className={`!mt-4 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${valid ? 'bg-[#e9f1e3] text-[#315d3c]' : state.tone === 'expired' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'}`}>
            {valid ? <BadgeCheck size={14} /> : <Clock3 size={14} />}{item.status === 'pending' ? 'Chờ xác minh' : state.label}
          </div>
          <h3>{item.name}</h3><strong className="break-words">{item.number}</strong>
          <dl className="!mt-4 space-y-3 text-xs leading-6"><div><dt className="text-stone-500">Tổ chức cấp</dt><dd className="font-medium text-primary">{item.issuingOrganization}</dd></div><div className="grid grid-cols-2 gap-3"><div><dt className="text-stone-500">Ngày cấp</dt><dd>{item.issuedAt ? dateText(item.issuedAt) : 'Chưa công bố'}</dd></div><div><dt className="flex items-center gap-1.5 text-stone-500"><CalendarDays size={13} />Hiệu lực đến</dt><dd>{item.expiresAt ? dateText(item.expiresAt) : 'Chưa công bố ngày hết hạn'}</dd></div></div></dl>
          {item.description && <p className="home-certificate-description">{item.description}</p>}
          {!valid && <p className="!mt-3 rounded-xl bg-amber-50 px-3 py-2 text-amber-900">Hồ sơ đang được đối chiếu, chưa dùng để xác nhận sản phẩm đạt chứng nhận.</p>}
          {valid && item.productCount > 0 && <Link to={`/ve-cua-hang${documents.data?.documents[item.id]?.productId ? `?product=${encodeURIComponent(documents.data.documents[item.id].productId)}` : ''}#chung-nhan`} className="!mt-auto inline-flex min-h-11 items-center gap-1 pt-4 text-xs text-primary underline">Xem {item.productCount} sản phẩm liên quan <ArrowUpRight size={12} /></Link>}
        </article>;
      })}</div>
      <p className="!mt-5 text-xs leading-6 text-stone-500">Các tài liệu ghi nhận chứng nhận của đơn vị được nêu trong từng hồ sơ, không đại diện cho toàn bộ cửa hàng.</p>
      {documents.loading && <p role="status" className="!mt-3 flex items-center gap-2 text-xs text-stone-500"><LoaderCircle size={14} className="animate-spin" />Đang tải tài liệu chứng nhận…</p>}
      {(documents.error || documents.data?.failed) && <p role="status" className="!mt-3 text-xs text-stone-500">Một số tài liệu chưa tải được. <button type="button" onClick={documents.reload} className="min-h-11 text-primary underline">Tải lại tài liệu</button></p>}
    </> : <p className="!mt-6 rounded-2xl bg-sage p-5 text-sm leading-7 text-primary">Hồ sơ chứng nhận của sản phẩm đang được cập nhật.</p>}
  </Reveal>;
}
