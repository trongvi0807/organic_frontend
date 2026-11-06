import { useEffect, useState } from 'react';
import { Field, Input } from '@/components/ui/field';

export function validateProductImage(file) {
  if (!file || !file.size) return 'Vui lòng chọn ảnh sản phẩm.';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.';
  if (file.size > 5 * 1024 * 1024) return 'Ảnh tối đa 5 MB.';
  return '';
}

export function ProductImagePicker({ file, existingUrl, onChange, disabled }) {
  const [preview, setPreview] = useState(''), [error, setError] = useState('');
  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <div className="space-y-3 rounded-xl border border-line p-4">
    <Field label="Ảnh sản phẩm *" hint="Chọn ảnh JPEG, PNG hoặc WebP, tối đa 5 MB. Ảnh này được dùng làm ảnh chính của sản phẩm." error={error}>
      <Input aria-label="Chọn ảnh sản phẩm" type="file" accept="image/jpeg,image/png,image/webp" required={!existingUrl && !file} disabled={disabled} onChange={(event) => {
        const selected = event.target.files?.[0];
        if (!selected) return;
        const issue = validateProductImage(selected); setError(issue);
        if (issue) { event.target.value = ''; onChange(null); return; }
        onChange(selected);
      }} />
    </Field>
    {(preview || existingUrl) && <img src={preview || existingUrl} alt="Xem trước ảnh sản phẩm" className="h-40 w-40 rounded-lg border border-line object-contain" />}
    {file && <p className="break-all text-sm text-stone-500">{file.name}</p>}
  </div>;
}
