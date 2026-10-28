import { useState } from 'react';
import { Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResourceState } from '@/components/common/ResourceState';
import { useResource } from '@/hooks/useResource';
import { allPages } from '@/lib/apiData';
import { matchesSearch } from '@/lib/adminFormat';
import { supplierService } from '@/services/admin/managementService';

const codeOf = (value) => String(value ?? '').trim();

export function PurchaseSupplierMapping({ rows, disabled, onApply }) {
  const suppliers = useResource(() => allPages(supplierService.list, { status: 'active' }), []);
  const [query, setQuery] = useState(''), [chosenId, setChosenId] = useState('');
  const missing = rows.filter((row) => !codeOf(row.values?.supplierCode));
  const codes = [...new Set(rows.map((row) => codeOf(row.values?.supplierCode).toUpperCase()).filter(Boolean))];
  const active = (suppliers.data || []).filter((supplier) => supplier.status === 'active' && codeOf(supplier.supplierCode));
  // Existing supplier codes are never overwritten by this helper.
  const eligible = active.filter((supplier) => !codes.length || (codes.length === 1 && codeOf(supplier.supplierCode).toUpperCase() === codes[0]));
  const chosen = eligible.find((supplier) => supplier.id === chosenId);
  const matches = eligible.filter((supplier) => matchesSearch(`${supplier.supplierName} ${supplier.supplierCode}`, query));
  return <section className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-5" aria-label="Bổ sung nhà cung cấp cho file Excel">
    <div><h3 className="font-semibold text-primary">Chọn nhà cung cấp còn thiếu</h3><p className="!mt-2 text-sm leading-6 text-stone-600">Có {missing.length} dòng chưa có mã nhà cung cấp. Chọn một nhà cung cấp cho toàn bộ đơn, sau đó bấm «Bổ sung nhà cung cấp & kiểm tra lại file». Chỉ các ô trống được bổ sung.</p><p className="!mt-1 text-xs leading-6 text-stone-500">Các lỗi bên dưới là kết quả kiểm tra trước khi bổ sung mã. Ngày giao, ghi chú, sản phẩm, số lượng và giá nhập được giữ nguyên.</p></div>
    <ResourceState loading={suppliers.loading} error={suppliers.error} onRetry={suppliers.reload} />
    {!suppliers.loading && !suppliers.error && <>
      {codes.length > 1 ? <p role="alert" className="form-error">File đang có nhiều mã nhà cung cấp khác nhau. Hãy sửa cột supplierCode trong Excel để một file chỉ thuộc một nhà cung cấp, rồi chọn lại file.</p> : <>
        {!eligible.length && <p role="status" className="text-sm text-amber-900">{codes.length ? 'Mã nhà cung cấp đã có trong file không khớp nhà cung cấp đang hoạt động. Hãy kiểm tra mã trong Excel trước.' : 'Chưa có nhà cung cấp đang hoạt động có mã hợp lệ. Hãy tạo nhà cung cấp trước rồi tải lại danh sách.'}</p>}
        <div className="relative"><Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" /><input type="search" autoComplete="off" aria-label="Tìm nhà cung cấp theo tên hoặc mã" placeholder="Tìm tên hoặc mã nhà cung cấp…" className="input !pl-9" value={query} disabled={disabled || !eligible.length} onChange={(event) => setQuery(event.target.value)} /></div>
        <div role="group" aria-label="Danh sách nhà cung cấp" className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-line bg-white p-2">
          {matches.map((supplier) => <button type="button" key={supplier.id} aria-pressed={chosen?.id === supplier.id} disabled={disabled} onClick={() => setChosenId(supplier.id)} className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm disabled:opacity-50 ${chosen?.id === supplier.id ? 'border-primary/30 bg-sage text-primary' : 'border-transparent hover:bg-sage'}`}><span className="break-words">{supplier.supplierName}<small className="!ml-2 text-stone-500">{supplier.supplierCode}</small></span>{chosen?.id === supplier.id && <Check size={17} className="shrink-0" aria-hidden="true" />}</button>)}
          {!!eligible.length && !matches.length && <p className="p-3 text-sm text-stone-500">Không tìm thấy nhà cung cấp phù hợp. Thử tên hoặc mã khác.</p>}
        </div>
        <p role="status" className="text-sm text-primary">{chosen ? `Đã chọn: ${chosen.supplierName} · ${chosen.supplierCode}` : 'Chưa chọn nhà cung cấp — bấm một dòng trong danh sách trên.'}</p>
      </>}
      <div className="flex flex-wrap justify-end gap-3"><Button variant="outline" disabled={disabled} onClick={suppliers.reload}>Tải lại nhà cung cấp</Button><Button disabled={disabled || !chosen || !missing.length} onClick={() => onApply(chosen.supplierCode)}>Bổ sung nhà cung cấp & kiểm tra lại file</Button></div>
    </>}
  </section>;
}
