import { today } from './apiData';

const measurements = {
  g: { factor: 0.001, dimension: 'mass', base: 'kg' },
  kg: { factor: 1, dimension: 'mass', base: 'kg' },
  mg: { factor: 0.000001, dimension: 'mass', base: 'kg' },
  ml: { factor: 0.001, dimension: 'volume', base: 'lít' },
  l: { factor: 1, dimension: 'volume', base: 'lít' },
};

function isoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : null;
}

export function variantMeasurement(variant) {
  const unit = String(variant.unitId ?? variant.unit ?? '').trim().toLowerCase();
  const rule = measurements[unit];
  const quantity = Number(variant.netQuantity);
  const price = Number(variant.sellingPrice ?? variant.price);
  if (!rule || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price <= 0) return null;
  return { ...rule, quantity, unit, baseQuantity: quantity * rule.factor, unitPrice: price / (quantity * rule.factor) };
}

export function comparisonVariants(product) {
  const rows = (product.variants || []).filter((item) => item.id).map((item) => {
    const price = Number(item.sellingPrice ?? item.price);
    const stock = item.stock ?? product.stock;
    const available = item.status === 'active' && Number.isFinite(price) && price > 0 && Number(item.netQuantity) > 0
      && product.canAddToCart !== false && (stock == null || Number(stock) >= 1);
    return { ...item, variantName: item.variantName || item.name || item.sku || 'Quy cách sản phẩm', sellingPrice: price,
      measurement: variantMeasurement(item), available, stock,
      unavailableReason: stock != null && Number(stock) < 1 ? 'Tạm hết hàng' : 'Chưa thể thêm vào giỏ',
    };
  });
  return rows.map((row) => {
    const peers = row.measurement ? rows.filter((item) => item.available && item.measurement?.dimension === row.measurement.dimension) : [];
    return { ...row, bestUnitPrice: row.available && peers.length > 1 && peers.every((item) => row.measurement.unitPrice <= item.measurement.unitPrice + 0.001) };
  });
}

export function certificateState(certificate, businessDate = today()) {
  const expires = isoDate(certificate.expiresAt), issued = isoDate(certificate.issuedAt);
  if (expires && expires < businessDate) return { label: 'Đã hết hiệu lực', tone: 'expired' };
  if (issued && issued > businessDate) return { label: 'Chưa đến ngày hiệu lực', tone: 'pending' };
  if ((certificate.expiresAt && !expires) || (certificate.issuedAt && !issued)) return { label: 'Cần kiểm tra ngày hiệu lực', tone: 'pending' };
  if (certificate.currentlyValid === true && (!certificate.status || certificate.status === 'verified')) return { label: 'Đang có hiệu lực', tone: 'valid' };
  return { label: 'Chưa xác nhận hiệu lực', tone: 'pending' };
}

export function traceabilityDate(value) {
  if (!isoDate(value)) return 'Chưa công bố';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
}
