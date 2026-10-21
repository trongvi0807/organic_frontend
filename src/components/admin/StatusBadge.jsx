import { reviewLabels, validityLabels } from '@/constants/management';

export function StatusBadge({ status }) {
  const code = String(status || '').toLowerCase();
  const labels = { active: 'Hoạt động', inactive: 'Ngừng hoạt động', draft: 'Bản nháp', ...reviewLabels };
  return <span className={`status-pill status-${code}`}><i />{labels[code] || status || 'Chưa có'}</span>;
}
export function CertificateValidity({ item }) {
  return <span className={`validity-label ${item.currentlyValid ? 'is-valid' : ''}`}>{item.archived ? 'Đã lưu trữ' : item.currentlyValid ? 'Có hiệu lực' : `Chưa hợp lệ · ${validityLabels[item.validityStatus] || 'Chưa đủ thông tin'}`}</span>;
}
