import { useState } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { ResourceState } from '@/components/common/ResourceState';
import { useResource } from '@/hooks/useResource';
import { productService } from '@/services/admin/productService';
import { categoryService } from '@/services/admin/categoryService';
import { DEMO_MODE } from '@/services/api';
import { slugify, errorMessage } from '@/lib/utils';

export function CatalogForm({ type, item, categories, onClose, onSaved }) {
  const product = type === 'products';
  const resource = useResource(async () => {
    if (!product) return { detail: item, options: {} };
    const [detail, options] = await Promise.all([item?.id ? productService.get(item.id) : null, productService.options()]);
    return { detail, options };
  }, [item?.id, type]);
  return <Modal open onOpenChange={(value) => { if (!value) onClose(); }} title={`${item?.id ? 'Chỉnh sửa' : 'Thêm'} ${product ? 'sản phẩm' : 'loại sản phẩm'}`} description={product ? 'Chăm chút thông tin để khách hàng an tâm lựa chọn.' : 'Sắp xếp những lựa chọn tươi lành một cách khoa học.'} className="catalog-form-modal"><ResourceState loading={resource.loading} error={resource.error} onRetry={resource.reload} />{!resource.loading && !resource.error && <Editor key={item?.id || 'new'} type={type} item={resource.data?.detail} options={resource.data?.options} categories={categories} onClose={onClose} onSaved={onSaved} />}</Modal>;
}

function Editor({ type, item, options, categories, onClose, onSaved }) {
  const product = type === 'products';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState(item?.productName || item?.categoryName || '');
  const [slug, setSlug] = useState(item?.slug || '');
  const [certifications, setCertifications] = useState(item?.certifications?.map((cert) => cert.id) || item?.certificationIds || []);
  const codeName = product ? 'productCode' : 'categoryCode';
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (product) {
      values.certificationIds = certifications;
      if (DEMO_MODE) { values.minPrice = Number(values.minPrice); values.stock = Number(values.stock); }
    }
    try {
      await (product ? productService : categoryService).save(item?.id, values);
      toast.success(`Đã ${item?.id ? 'cập nhật' : 'thêm'} ${product ? 'sản phẩm' : 'loại sản phẩm'}.`);
      onSaved();
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="catalog-form"><fieldset disabled={busy}>
    <Field label={product ? 'Tên sản phẩm *' : 'Tên loại sản phẩm *'}><Input name={product ? 'productName' : 'categoryName'} value={name} onChange={(event) => { setName(event.target.value); if (!item?.id) setSlug(slugify(event.target.value)); }} required maxLength={product ? 200 : 255} placeholder={product ? 'Ví dụ: Cà rốt hữu cơ Đà Lạt' : 'Ví dụ: Rau củ hữu cơ'} /></Field>
    <div className="form-grid"><Field label={product ? 'Mã sản phẩm *' : 'Mã loại sản phẩm *'} hint="Chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới."><Input name={codeName} defaultValue={item?.[codeName] || ''} required pattern="[A-Za-z0-9][A-Za-z0-9_\-]*" maxLength={product ? 50 : 255} placeholder={product ? 'MOC-009' : 'RAU_CU'} /></Field><Field label="Trạng thái"><Select name="status" defaultValue={item?.status || (product ? 'draft' : 'active')}>{product && <option value="draft">Bản nháp</option>}<option value="active">{product ? 'Đang bán' : 'Hoạt động'}</option><option value="inactive">{product ? 'Ngừng bán' : 'Tạm ẩn'}</option></Select></Field></div>
    {product ? <><Field label="Đường dẫn (slug) *"><Input name="slug" value={slug} onChange={(event) => setSlug(event.target.value)} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={220} placeholder="ca-rot-huu-co-da-lat" /></Field><div className="form-grid"><Field label="Loại sản phẩm *"><Select name="categoryId" defaultValue={item?.categoryId || ''} required><option value="" disabled>Chọn danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.categoryName}{category.status === 'inactive' ? ' (Tạm ẩn)' : ''}</option>)}</Select></Field><Field label="Xác minh hữu cơ"><Select name="organicClaimStatus" defaultValue={item?.organicClaimStatus || 'pending'}><option value="pending">Đang xác minh</option><option value="verified">Đã xác minh</option><option value="rejected">Chưa đạt</option></Select></Field></div>{!DEMO_MODE && <Field label="Thương hiệu"><Select name="brandId" defaultValue={item?.brandId || ''}><option value="">Chưa chọn thương hiệu</option>{options.brands?.map((brand) => <option key={brand.id} value={brand.id}>{brand.brandName}</option>)}</Select></Field>}{!!options.certifications?.length && <div className="field"><span>Chứng nhận hữu cơ</span><div className="certification-options">{options.certifications.map((cert) => <label className="checkbox-label" key={cert.id}><input type="checkbox" checked={certifications.includes(cert.id)} onChange={(event) => setCertifications((old) => event.target.checked ? [...old, cert.id] : old.filter((id) => id !== cert.id))} />{cert.certificateName} · {cert.certificateNumber}</label>)}</div></div>}{DEMO_MODE ? <><div className="form-grid"><Field label="Giá bán (đ) *"><Input name="minPrice" type="number" min="0" step="1000" defaultValue={item?.minPrice ?? 0} required /></Field><Field label="Tồn kho mẫu *"><Input name="stock" type="number" min="0" step="1" defaultValue={item?.stock ?? 0} required /></Field></div><div className="form-grid"><Field label="Quy cách"><Input name="unit" defaultValue={item?.unit || ''} placeholder="500g" /></Field><Field label="Đường dẫn ảnh"><Input name="imageUrl" defaultValue={item?.imageUrl || '/images/vegetables.jpg'} pattern="(?:https?://.*|/.*)" placeholder="/images/vegetables.jpg" /></Field></div></> : <p className="form-note">Giá bán thuộc biến thể sản phẩm; API hiện chưa cung cấp số lượng tồn kho. Biểu mẫu này quản lý thông tin sản phẩm và chứng nhận.</p>}</> : <Field label="Danh mục cha"><Select name="parentId" defaultValue={item?.parentId || ''}><option value="">Không có (danh mục gốc)</option>{categories.filter((category) => category.id !== item?.id).map((category) => <option key={category.id} value={category.id}>{category.categoryName}</option>)}</Select></Field>}
    <Field label="Mô tả"><Textarea name="description" defaultValue={item?.description || ''} maxLength={product ? 20000 : 10000} placeholder="Một vài thông tin hữu ích…" /></Field>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions"><Button variant="outline" onClick={onClose} disabled={busy}>Hủy</Button><Button type="submit" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</Button></div>
  </fieldset></form>;
}
