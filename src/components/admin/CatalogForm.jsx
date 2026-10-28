import { useRef, useState } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { ResourceState } from '@/components/common/ResourceState';
import { useResource } from '@/hooks/useResource';
import { productService } from '@/services/admin/productService';
import { categoryService } from '@/services/admin/categoryService';
import { supplierService, originService, traceabilityService } from '@/services/admin/managementService';
import { purchaseOrderService } from '@/services/admin/procurementService';
import { allPages } from '@/lib/apiData';
import { duplicateProduct, generateProductCode, readProductRules } from '@/lib/productRules';
import { categoryIdentityErrors, cleanCategoryName, generateCategoryCode } from '@/lib/categoryRules';
import { variantPayload } from '@/lib/catalogAssets';
import { saveCatalogWorkflow } from '@/lib/catalogWorkflow';
import { DEMO_MODE } from '@/services/api';
import { slugify, errorMessage, currency } from '@/lib/utils';
import { AdminForm } from './AdminForm';
import { SearchSelect } from './SearchSelect';
import { ProductRulesDialog } from './ProductRulesDialog';

export function CatalogForm({ type, item, categories, onClose, onSaved }) {
  const product = type === 'products';
  const [busy, setBusy] = useState(false);
  const resource = useResource(async () => {
    if (!product) {
      const [detail, existing] = await Promise.all([item?.id ? categoryService.get(item.id) : item, allPages(categoryService.list)]);
      return { detail, options: { existing, categoryCode: detail?.categoryCode || generateCategoryCode(existing) } };
    }
    const [detail, options, existing, suppliers, origins, trace, purchases] = await Promise.all([
      item?.id ? productService.get(item.id) : null, productService.options(), allPages(productService.list),
      DEMO_MODE ? [] : allPages(supplierService.list, { status: 'active' }), DEMO_MODE ? [] : allPages(originService.list, { status: 'active' }),
      item?.id && !DEMO_MODE ? traceabilityService.get(item.id) : null, item?.id && !DEMO_MODE ? allPages(purchaseOrderService.list) : [],
    ]);
    return { detail, options: { ...options, existing, suppliers, origins, trace, purchases } };
  }, [item?.id, type]);
  return <Modal open onOpenChange={(open) => { if (!open && !busy) onClose(); }} title={`${item?.id ? 'Chỉnh sửa' : 'Thêm'} ${product ? 'sản phẩm' : 'loại sản phẩm'}`} description={product ? 'Chọn loại sản phẩm trước để cấp mã tự động, sau đó hoàn thiện thông tin và nguồn cung.' : 'Sắp xếp danh mục sản phẩm.'} className="catalog-form-modal !max-w-[920px]"><ResourceState loading={resource.loading} error={resource.error} onRetry={resource.reload} />{!resource.loading && !resource.error && <Editor type={type} item={resource.data?.detail} options={resource.data?.options} categories={categories} onClose={onClose} onSaved={onSaved} busy={busy} setBusy={setBusy} />}</Modal>;
}
function Editor({ type, item, options, categories, onClose, onSaved, busy, setBusy }) {
  const product = type === 'products', first = item?.variants?.[0];
  const [rules, setRules] = useState(readProductRules);
  const [error, setError] = useState('');
  const [name, setName] = useState(item?.productName || item?.categoryName || ''), [slug, setSlug] = useState(item?.slug || '');
  const [categoryId, setCategoryId] = useState((product ? item?.categoryId : item?.parentId) || ''), [code, setCode] = useState(product ? item?.productCode || '' : options.categoryCode || '');
  const [categoryRows, setCategoryRows] = useState(options.existing || []);
  const [supplierId, setSupplierId] = useState(options.trace?.origin?.supplierId || ''), [originId, setOriginId] = useState(options.trace?.origin?.id || '');
  const [certifications, setCertifications] = useState(item?.certifications?.map((cert) => cert.id) || item?.certificationIds || []);
  const [quantity, setQuantity] = useState(first?.netQuantity ?? rules.defaultQuantity), [unit, setUnit] = useState(first?.unitId || rules.defaultUnit), [pack, setPack] = useState(first?.variantName || `${rules.defaultPackage} ${rules.defaultQuantity}${rules.defaultUnit}`);
  const [price, setPrice] = useState(first?.sellingPrice ?? item?.minPrice ?? ''), [compare, setCompare] = useState(first?.compareAtPrice ?? '');
  const persisted = useRef({ productId: item?.id || null, variantId: first?.id || null, currentStatus: item?.status || 'draft' });
  const origins = options.origins?.filter((origin) => origin.supplierId === supplierId) || [];
  const duplicate = product && name.trim() && duplicateProduct(options.existing || [], { productCode: code || '-', productName: name }, persisted.current.productId);
  const categoryErrors = product ? {} : categoryIdentityErrors(categoryRows, { categoryName: name, categoryCode: code }, item?.id);
  const latestImport = options.purchases?.filter((order) => ['approved', 'received'].includes(order.status)).sort((a, b) => b.orderDate.localeCompare(a.orderDate)).flatMap((order) => order.items).find((line) => line.variant?.id === first?.id)?.unitPrice;
  async function submit(event) {
    event.preventDefault(); if (busy) return; setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (!product) {
      setBusy(true);
      try {
        const latest = await allPages(categoryService.list);
        setCategoryRows(latest);
        values.categoryName = cleanCategoryName(name);
        if (!values.categoryName) throw new Error('Vui lòng nhập tên loại sản phẩm.');
        values.categoryCode = item?.id ? item.categoryCode : generateCategoryCode(latest);
        setCode(values.categoryCode);
        const issues = categoryIdentityErrors(latest, values, item?.id);
        if (Object.keys(issues).length) throw new Error(Object.values(issues)[0]);
        await categoryService.save(item?.id, values);
        toast.success('Đã lưu loại sản phẩm.'); onSaved();
      } catch (e) { setError(errorMessage(e)); }
      finally { setBusy(false); }
      return;
    }
    values.productName = name.trim(); values.productCode = code; values.slug = slug; values.categoryId = categoryId; values.certificationIds = certifications;
    try {
      if (!categoryId || !code) throw new Error('Chọn loại sản phẩm để cấp mã tự động.');
      if (!DEMO_MODE && (!supplierId || !originId || !origins.some((origin) => origin.id === originId))) throw new Error('Chọn nhà cung cấp và xuất xứ thuộc nhà cung cấp đó.');
      const pricePayload = !DEMO_MODE ? variantPayload({ ...first, sku: first?.sku || `${code}-01`, variantName: pack, netQuantity: quantity, unitId: unit, sellingPrice: price, compareAtPrice: compare, status: first?.status || 'active', reorderLevel: first?.reorderLevel ?? 0 }) : null;
      setBusy(true);
      const rows = await allPages(productService.list);
      if (!persisted.current.productId) { values.productCode = generateProductCode({ id: categoryId }, rules, rows); setCode(values.productCode); if (pricePayload) pricePayload.sku = `${values.productCode}-01`; }
      if (duplicateProduct(rows, values, persisted.current.productId)) throw new Error('Mã hoặc tên sản phẩm đã tồn tại. Vui lòng dùng tên khác.');
      if (DEMO_MODE) { await productService.save(item?.id, { ...values, minPrice: Number(price), unit: pack, stock: Number(values.stock || 0) }); }
      else {
        await saveCatalogWorkflow({ values, price: pricePayload, originId, state: persisted.current }, { products: productService, traceability: traceabilityService });
      }
      toast.success('Đã lưu thông tin, giá bán và nguồn cung sản phẩm.'); onSaved();
    } catch (err) { setError(`${errorMessage(err)}${persisted.current.productId && !item?.id ? ' Sản phẩm đã có hồ sơ; bấm Lưu để tiếp tục hoàn thiện cùng hồ sơ, không tạo thêm.' : ''}`); }
    finally { setBusy(false); }
  }
  return <AdminForm onSubmit={submit} className="catalog-form"><fieldset disabled={busy}>
    {product && <><div className="!mb-5 flex justify-end"><ProductRulesDialog onSaved={setRules} /></div><Field label="Loại sản phẩm *"><SearchSelect required aria-label="Loại sản phẩm" value={categoryId} options={categories.map((category) => ({ value: category.id, label: category.categoryName, disabled: category.status === 'inactive' && category.id !== categoryId }))} onChange={(id) => { setCategoryId(id); if (!persisted.current.productId) setCode(generateProductCode(categories.find((category) => category.id === id), rules, options.existing || [])); }} /></Field><Field label="Mã sản phẩm tự động" hint="Ví dụ SP01, SP02… Mã được kiểm tra lại khi lưu và giữ ổn định sau khi tạo."><Input readOnly value={code} placeholder="Chọn loại sản phẩm trước" /></Field></>}
    <Field label={product ? 'Tên sản phẩm *' : 'Tên loại sản phẩm *'} error={product ? duplicate ? 'Tên hoặc mã sản phẩm đã tồn tại.' : '' : categoryErrors.categoryName}><Input name={product ? 'productName' : 'categoryName'} value={name} disabled={product && !categoryId} onChange={(e) => { setName(e.target.value); setError(''); if (!item?.id) setSlug(slugify(e.target.value)); }} required maxLength={product ? 200 : 255} placeholder={product ? 'Ví dụ: Cà rốt hữu cơ Đà Lạt' : 'Rau củ hữu cơ'} /></Field>
    <div className="form-grid">{!product && <Field label="Mã loại sản phẩm tự động" error={categoryErrors.categoryCode} hint={item?.id ? 'Mã đã cấp được giữ nguyên khi chỉnh sửa.' : 'Dạng LSP01, LSP02… Mã được kiểm tra lại khi lưu.'}><Input name="categoryCode" readOnly value={code} autoComplete="off" maxLength={255} /></Field>}<Field label="Trạng thái"><Select name="status" defaultValue={item?.status || (product ? 'draft' : 'active')}>{product && <option value="draft">Bản nháp</option>}<option value="active">{product ? 'Đang bán' : 'Hoạt động'}</option><option value="inactive">{product ? 'Ngừng bán' : 'Tạm ẩn'}</option></Select></Field>{product && <Field label="Xác minh hữu cơ"><Select name="organicClaimStatus" defaultValue={item?.organicClaimStatus || 'pending'}><option value="pending">Đang xác minh</option><option value="verified">Đã xác minh</option><option value="rejected">Chưa đạt</option></Select></Field>}</div>
    {product ? <><Field label="Đường dẫn sản phẩm *"><Input value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={220} /></Field>
      {!DEMO_MODE && <div className="form-grid"><Field label="Nhà cung cấp *"><SearchSelect required aria-label="Nhà cung cấp sản phẩm" value={supplierId} options={(options.suppliers || []).map((supplier) => ({ value: supplier.id, label: supplier.supplierName }))} onChange={(id) => { setSupplierId(id); setOriginId(''); }} /></Field><Field label="Vùng / cơ sở sản xuất thuộc nhà cung cấp *"><SearchSelect required aria-label="Xuất xứ sản phẩm" disabled={!supplierId} value={originId} options={origins.map((origin) => ({ value: origin.id, label: `${origin.originName} · ${origin.country}` }))} onChange={setOriginId} /></Field></div>}
      {!DEMO_MODE && supplierId && !origins.length && <p className="form-note !text-amber-800">Nhà cung cấp chưa có xuất xứ đang hoạt động. Thêm xuất xứ và liên kết nhà cung cấp ở mục Xuất xứ organic trước.</p>}
      <div className="form-grid"><Field label="Đơn vị tính / đóng gói *"><Input required list="product-packages" value={pack} onChange={(e) => setPack(e.target.value)} maxLength={150} placeholder="Gói 1kg" /><datalist id="product-packages">{rules.packages.map((label) => <option key={label} value={`${label} ${quantity}${unit}`} />)}</datalist></Field><Field label="Trọng lượng / dung tích *"><Input required type="number" min="0.001" max="999999999.999" step="0.001" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></Field><Field label="Đơn vị trọng lượng *"><Input required list="product-mass-units" value={unit} onChange={(e) => setUnit(e.target.value)} maxLength={20} /><datalist id="product-mass-units">{rules.units.map((label) => <option key={label}>{label}</option>)}</datalist></Field><Field label="Giá bán (₫) *"><Input type="number" required min="0.01" max="999999999999.99" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></Field><Field label="Giá so sánh (₫)" error={compare !== '' && Number(compare) < Number(price) ? 'Giá so sánh không được thấp hơn giá bán.' : ''}><Input type="number" min={price || '0.01'} max="999999999999.99" step="0.01" value={compare} onChange={(e) => setCompare(e.target.value)} /></Field><Field label="Giá nhập gần nhất" hint="Giá nhập được lưu theo từng Đơn mua, có thể khác nhau giữa các lần nhập."><Input readOnly value={latestImport == null ? 'Ghi nhận khi lập Đơn mua' : currency(latestImport)} /></Field></div>
      {!!item?.variants?.length && item.variants.length > 1 && <p className="form-note">Giá và quy cách phía trên thuộc sản phẩm đầu tiên. Các sản phẩm có quy cách khác được chỉnh tại Sản phẩm & ảnh.</p>}
      {!DEMO_MODE && <Field label="Thương hiệu"><Select name="brandId" defaultValue={item?.brandId || ''}><option value="">Chưa chọn thương hiệu</option>{options.brands?.map((brand) => <option key={brand.id} value={brand.id}>{brand.brandName}</option>)}</Select></Field>}
      {!!options.certifications?.length && <div className="field"><span>Chứng nhận hữu cơ</span><div className="certification-options">{options.certifications.map((cert) => <label className="checkbox-label" key={cert.id}><input type="checkbox" checked={certifications.includes(cert.id)} onChange={(e) => setCertifications((old) => e.target.checked ? [...old, cert.id] : old.filter((id) => id !== cert.id))} />{cert.certificateName} · {cert.certificateNumber}</label>)}</div></div>}
      {DEMO_MODE && <Field label="Số lượng mẫu"><Input name="stock" required type="number" min="0" step="1" defaultValue={item?.stock || 0} /></Field>}
    </> : <Field label="Danh mục cha"><SearchSelect aria-label="Danh mục cha" name="parentId" value={categoryId} options={[{ value: '', label: 'Không có (danh mục gốc)' }, ...categories.filter((category) => category.id !== item?.id).map((category) => ({ value: category.id, label: category.categoryName }))]} onChange={setCategoryId} /></Field>}
    <Field label="Mô tả sản phẩm"><Textarea name="description" defaultValue={item?.description || ''} maxLength={product ? 20000 : 10000} placeholder="Đặc điểm nổi bật, thành phần, cách bảo quản và cách sử dụng…" /></Field>
    {error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><Button type="button" variant="outline" onClick={onClose}>Đóng</Button><Button type="submit" disabled={busy || !!duplicate || !!categoryErrors.categoryName || !!categoryErrors.categoryCode}>{busy ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</Button></div>
  </fieldset></AdminForm>;
}
