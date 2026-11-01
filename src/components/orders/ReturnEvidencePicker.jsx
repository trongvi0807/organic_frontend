import { useEffect, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { validateReturnImages } from '@/lib/afterSales';

export function ReturnEvidencePicker({ files, onChange, disabled, error }) {
  const [selectionError, setSelectionError] = useState('');
  function select(event) {
    const chosen = [...event.target.files]; event.target.value = '';
    const next = [...files];
    for (const file of chosen) if (!next.some((old) => old.name === file.name && old.size === file.size && old.lastModified === file.lastModified)) next.push(file);
    const issue = validateReturnImages(next); setSelectionError(issue);
    if (!issue) onChange(next);
  }
  return <section className="space-y-3" aria-label="Ảnh minh chứng đổi trả">
    <div><h3 className="!font-sans !text-sm font-medium">Ảnh minh chứng *</h3><p className="!mt-1 text-xs leading-6 text-stone-500">Chọn từ 1 đến 5 ảnh sản phẩm, bao bì hoặc vấn đề gặp phải. Nhận JPG, PNG, WebP; tối đa 5 MB mỗi ảnh.</p></div>
    <label className={`relative inline-flex items-center gap-2 rounded-xl border border-dashed border-emerald-700/30 bg-[#F7FAF5] px-4 py-3 text-sm text-primary ${disabled ? 'opacity-50' : 'cursor-pointer'}`}><ImagePlus size={19} />Thêm ảnh minh chứng<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={disabled} aria-label="Chọn ảnh minh chứng đổi trả" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={select} /></label>
    {!!files.length && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{files.map((file, index) => <div key={`${file.name}-${file.size}-${file.lastModified}`} className="overflow-hidden rounded-xl border border-line bg-white"><EvidencePreview file={file} /><div className="flex items-center justify-between gap-2 p-2"><span className="truncate text-xs" title={file.name}>{file.name}</span><button type="button" disabled={disabled} className="shrink-0 rounded-lg p-1.5 text-red-700 hover:bg-red-50" aria-label={`Bỏ ảnh ${index + 1}`} onClick={() => { onChange(files.filter((_, i) => i !== index)); setSelectionError(''); }}><X size={16} /></button></div></div>)}</div>}
    {(selectionError || error) && <p role="alert" className="text-xs leading-6 text-red-700">{selectionError || error}</p>}
  </section>;
}

function EvidencePreview({ file }) {
  const [url, setUrl] = useState('');
  useEffect(() => { const next = URL.createObjectURL(file); setUrl(next); return () => URL.revokeObjectURL(next); }, [file]);
  return url ? <img src={url} alt={`Ảnh minh chứng: ${file.name}`} className="aspect-[4/3] w-full object-contain bg-stone-50" /> : <div className="aspect-[4/3] bg-stone-50" />;
}
