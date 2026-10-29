import { Plus, Trash2 } from 'lucide-react';
import { useResource } from '@/hooks/useResource';
import { allPages } from '@/lib/apiData';
import { certificationService } from '@/services/admin/managementService';
import { ResourceState } from '@/components/common/ResourceState';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';

export function HomeCertificateEditor({ value = [], onChange, disabled }) {
  const resource = useResource(() => allPages(certificationService.list, { archived: false }), []);
  const options = (resource.data || []).filter((item) => ['pending', 'verified'].includes(item.status) && item.documentUrl?.startsWith('https://'));
  function change(index, fields) { onChange(value.map((item, at) => at === index ? { ...item, ...fields } : item)); }
  return <section className="content-group">
    <div className="profile-section-heading"><h3>Hồ sơ chứng nhận công khai <span>{value.length}/6</span></h3><Button variant="outline" size="sm" disabled={disabled || value.length >= 6 || resource.loading || !!resource.error} onClick={() => onChange([...value, { certificateId: '', previewImageUrl: '', previewDocumentUrl: null, description: '' }])}><Plus size={14} />Thêm hồ sơ</Button></div>
    <p className="module-footnote">Chọn tài liệu muốn giới thiệu trên trang chủ. Hồ sơ chờ xác minh vẫn hiển thị nhãn riêng; việc giới thiệu không thay đổi kết quả xác minh. Chứng nhận hợp lệ đã gắn với sản phẩm vẫn được hiển thị tự động.</p>
    <ResourceState loading={resource.loading} error={resource.error} onRetry={resource.reload} />
    {value.map((entry, index) => <div className="content-entry" key={index}>
      <div className="content-entry-heading"><strong>Hồ sơ {index + 1}</strong><button type="button" className="icon-button delete-button" aria-label={`Bỏ hồ sơ công khai ${index + 1}`} disabled={disabled} onClick={() => onChange(value.filter((_, at) => at !== index))}><Trash2 size={16} /></button></div>
      <div className="record-form-grid">
        <Field label="Chứng nhận *" className="full-width"><Select required disabled={disabled || resource.loading || !!resource.error} value={entry.certificateId} onChange={(event) => change(index, { certificateId: event.target.value, previewImageUrl: '', previewDocumentUrl: options.find((item) => item.id === event.target.value)?.documentUrl || null })}>
          <option value="">Chọn chứng nhận có tài liệu đính kèm</option>
          {options.filter((item) => item.id === entry.certificateId || !value.some((other) => other.certificateId === item.id)).map((item) => <option key={item.id} value={item.id}>{item.certificateName} · {item.certificateNumber}{item.status === 'pending' ? ' · Chờ xác minh' : ''}</option>)}
        </Select></Field>
        <Field label="Ảnh xem trước" hint="Dùng ảnh từ đúng tài liệu gốc. Với PDF, có thể dùng ảnh trang đầu; để trống nếu chưa có ảnh." className="full-width"><Input maxLength={1000} value={entry.previewImageUrl || ''} disabled={disabled} pattern="(?:https://[^\s\\]+|/(?!/)[^\s\\]+)" onChange={(event) => change(index, { previewImageUrl: event.target.value, previewDocumentUrl: options.find((item) => item.id === entry.certificateId)?.documentUrl || null })} /></Field>
        <Field label="Giới thiệu / Phạm vi chứng nhận" className="full-width"><Textarea maxLength={400} value={entry.description || ''} disabled={disabled} onChange={(event) => change(index, { description: event.target.value })} /></Field>
      </div>
    </div>)}
  </section>;
}
