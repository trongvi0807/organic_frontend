import { safeMediaUrl } from '@/lib/productDetail';
import { catalogService } from './catalogService';

export const isDemoCertificate = (certificate) => /^DEMO-CERT-\d+$/i.test(certificate.number || certificate.certificateNumber || '');

// Home omits documentUrl. Resolve it through public product details, matching
// the exact certificate ID and number; never request staff-only APIs here.
export async function homeCertificateDocuments(certificates, products) {
  const documents = {};
  const pending = new Map(certificates.filter((item) => !isDemoCertificate(item)).map((item) => [item.id, item]));
  for (const item of pending.values()) {
    if (safeMediaUrl(item.documentUrl)) { documents[item.id] = item; pending.delete(item.id); }
  }
  const unique = [...new Map(products.filter((item) => item.id).map((item) => [item.id, item])).values()].slice(0, 24);
  let failed = false;
  for (let index = 0; index < unique.length && pending.size; index += 3) {
    const results = await Promise.allSettled(unique.slice(index, index + 3).map((product) => catalogService.product(product.id)));
    for (const result of results) {
      if (result.status === 'rejected') { failed = true; continue; }
      for (const certificate of result.value.certifications || []) {
        const expected = pending.get(certificate.id);
        if (!expected || expected.number !== certificate.certificateNumber || certificate.currentlyValid !== true || !safeMediaUrl(certificate.documentUrl)) continue;
        documents[certificate.id] = { ...certificate, productId: result.value.id };
        pending.delete(certificate.id);
      }
    }
  }
  return { documents, failed };
}
