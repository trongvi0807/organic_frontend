import { ArrowUpRight, CalendarDays, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '@/components/common/Reveal';
import { useResource } from '@/hooks/useResource';
import { dateText } from '@/lib/apiData';
import { homeCertificateDocuments } from '@/services/client/homeCertificateDocuments';
import { CertificateDocumentPreview } from './CertificateDocumentPreview';

export function HomeCertifications({ certificates = [], products = [] }) {
  const identity = JSON.stringify([certificates.map((item) => [item.id, item.number, item.documentUrl]), products.map((item) => item.id)]);
  const documents = useResource(() => homeCertificateDocuments(certificates, products), [identity]);
  return <Reveal as="section" className="container public-certifications" aria-labelledby="home-certifications-title">
    <div className="section-heading"><div><span className="eyebrow">THÔNG TIN CHỨNG NHẬN</span><h2 id="home-certifications-title">Hồ sơ chứng nhận đang hợp lệ</h2></div><Link className="text-link" to="/ve-cua-hang#chung-nhan">Xem hồ sơ sản phẩm <ArrowUpRight size={16} /></Link></div>
    {certificates.length > 0 ? <>
      <div className="public-info-grid">{certificates.map((item) => <article key={item.id}>
        <CertificateDocumentPreview key={`${item.id}:${documents.data?.documents[item.id]?.documentUrl || item.documentUrl || ''}`} certificate={item} document={documents.data?.documents[item.id]} />
        <h3>{item.name}</h3><strong>{item.number}</strong><p>{item.issuingOrganization}</p><p>Cấp ngày {dateText(item.issuedAt)}</p><p className="flex items-center gap-2"><CalendarDays size={14} className="shrink-0" />{item.expiresAt ? `Hết hạn ${dateText(item.expiresAt)}` : 'Không đặt ngày hết hạn'}</p><span>{item.productCount} sản phẩm liên quan</span><Link to={`/ve-cua-hang${documents.data?.documents[item.id]?.productId ? `?product=${encodeURIComponent(documents.data.documents[item.id].productId)}` : ''}#chung-nhan`} className="!mt-3 inline-flex min-h-11 items-center gap-1 text-xs text-primary underline">Xem hồ sơ chứng nhận <ArrowUpRight size={12} /></Link>
      </article>)}</div>
      {documents.loading && <p role="status" className="!mt-3 flex items-center gap-2 text-xs text-stone-500"><LoaderCircle size={14} className="animate-spin" />Đang tải tài liệu chứng nhận…</p>}
      {(documents.error || documents.data?.failed) && <p role="status" className="!mt-3 text-xs text-stone-500">Một số tài liệu chưa tải được. <button type="button" onClick={documents.reload} className="min-h-11 text-primary underline">Tải lại tài liệu</button></p>}
    </> : <p className="!mt-6 rounded-2xl bg-sage p-5 text-sm leading-7 text-primary">Hồ sơ chứng nhận của sản phẩm đang được cập nhật.</p>}
  </Reveal>;
}
