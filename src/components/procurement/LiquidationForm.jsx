import { useState } from 'react';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useResource } from '@/hooks/useResource';
import { liquidationService } from '@/services/admin/liquidationService';
import { allPages, dateText } from '@/lib/apiData';
import { errorMessage } from '@/lib/utils';
import { liquidationReasons, liquidationMethods, liquidationPayload, liquidationTotal } from '@/lib/liquidation';
import { purchaseMoney, purchaseQuantity } from '@/lib/purchaseDocuments';
import { adminDate } from '@/lib/adminFormat';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { MoneyInput } from '@/components/ui/money-input';
import { ResourceState } from '@/components/common/ResourceState';
import { SearchSelect } from '@/components/admin/SearchSelect';
import { AdminForm } from '@/components/admin/AdminForm';
import { DocumentMeta } from './ProcurementUI';
import '@/styles/liquidation.css';

export function LiquidationStatus({ value }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${['completed','approved'].includes(value) ? 'bg-[#e7f1e7] text-[#315c3f]' : value === 'pending_approval' ? 'bg-[#faf0d9] text-[#89651e]' : ['rejected','cancelled'].includes(value) ? 'bg-[#faeae7] text-[#97504a]' : 'bg-stone-100 text-stone-600'}`}>{({ draft:'Bản nháp',pending_approval:'Chờ duyệt',approved:'Đã duyệt · Chờ xử lý',rejected:'Từ chối',completed:'Đã hoàn tất',cancelled:'Đã hủy' })[value]}</span>;
}
export function LiquidationLines({ items, method }) {
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>STT</th><th>Sản phẩm / Lô</th><th>Đơn vị tính</th><th>Hạn sử dụng</th><th>Số lượng</th><th>Giá thanh lý (VNĐ)</th><th>Thành tiền (VNĐ)</th></tr></thead><tbody>{items.map((row,index)=><tr key={row.batchId || row.id}><td>{index+1}</td><td><strong>{row.productName}</strong><small className="block text-stone-500">{row.lotCode || row.batchCode}</small></td><td>{row.variantName}</td><td>{dateText(row.expiryDate)}</td><td>{purchaseQuantity(row.quantity)}</td><td>{purchaseMoney(method === 'dispose' ? 0 : row.unitPrice)}</td><td>{purchaseMoney(method === 'dispose' ? 0 : Number(row.quantity)*Number(row.unitPrice))}</td></tr>)}</tbody></table></div>;
}
export function LiquidationForm({ item, onClose, onSaved }) {
  const [busy,setBusy]=useState(false);
  const data=useResource(async()=>({ batches:await allPages(liquidationService.batches), code:item?.code || (await liquidationService.nextCode()).code }),[item?.id]);
  return <Modal open title={item?.id ? 'Sửa phiếu xử lý hàng' : 'Lập phiếu thanh lý / xử lý hàng'} description="Chọn đúng lô, số lượng và phương án xử lý; kiểm tra nội dung trước khi lưu." className="!max-w-[1320px]" onOpenChange={open=>{if(!open&&!busy)onClose();}}>
    <ResourceState loading={data.loading} error={data.error} onRetry={data.reload} />{!data.loading&&!data.error&&<Editor item={item} data={data.data} busy={busy} setBusy={setBusy} onClose={onClose} onSaved={onSaved} />}
  </Modal>;
}
function Editor({ item,data,busy,setBusy,onClose,onSaved }) {
  const { user }=useAuth();
  const [method,setMethod]=useState(item?.method || 'sale'),[reason,setReason]=useState(item?.reason || ''),[note,setNote]=useState(item?.note || '');
  const held=!!item?.stockHeld;
  const [reasonType,setReasonType]=useState(item?.reasonType || (item?.method === "dispose" ? "damaged" : "clearance"));
  const [items,setItems]=useState(()=>item?.items?.map(row=>({...row,...data.batches.find(b=>b.id===row.batchId),batchId:row.batchId,quantity:String(row.quantity),unitPrice:String(row.unitPrice),available:held?Number(row.quantity):(data.batches.find(b=>b.id===row.batchId)?.available ?? 0)})) || []);
  const [batchId,setBatchId]=useState(item?.batchId || ''),[quantity,setQuantity]=useState('1'),[price,setPrice]=useState(''),[error,setError]=useState(''),[review,setReview]=useState(false);
  const selected=data.batches.find(row=>row.id===batchId);
  function add(){
    try{
      if(!selected)throw new Error('Vui lòng chọn lô hàng.');
      const next=[...items,{...selected,batchId:selected.id,quantity,unitPrice:method==='dispose'?'0':price}];
      liquidationPayload({method,reasonType,reason:reason||'Đang lập phiếu',items:next});setItems(next);setBatchId('');setQuantity('1');setPrice('');setError('');
    }catch(failure){setError(errorMessage(failure));}
  }
  function changeLine(index,field,value){setReview(false);setItems(old=>old.map((row,i)=>i===index?{...row,[field]:value}:row));}
  async function submit(event){
    event.preventDefault();if(busy)return;setError('');
    try{
      const payload=liquidationPayload({method,reasonType,reason,note,items});
      if(!review){setReview(true);return;}
      setBusy(true);const saved=await liquidationService.save(item?.id,payload);toast.success('Đã lưu phiếu thanh lý nháp. Gửi duyệt để tiếp tục.');onSaved(saved);
    }catch(failure){setError(errorMessage(failure));}finally{setBusy(false);}
  }
  return <AdminForm className="catalog-form liquidation-form" onSubmit={submit}><fieldset disabled={busy} className="min-w-0 space-y-5">
    <DocumentMeta entries={[[item?.id?"Mã phiếu":"Mã phiếu (dự kiến)",data.code],["Người lập",item?.creator?.fullName || user?.fullName || user?.username],["Ngày giờ lập",adminDate(item?.createdAt || new Date().toISOString(),true)],["Trạng thái",'Bản nháp']]} />
    {review?<><h3 className="text-lg font-semibold">Kiểm tra phiếu trước khi lưu</h3><DocumentMeta entries={[["Phương án",liquidationMethods[method]],["Phân loại",liquidationReasons[reasonType]],["Lý do",reason],["Ghi chú",note],["Tổng giá trị dự kiến",purchaseMoney(liquidationTotal(items,method))]]} /><LiquidationLines items={items} method={method} /><p className="form-note">{method==='dispose'?'Lưu nháp sẽ cách ly ngay số lượng đã chọn, không cho bán. Hoàn tất xử lý sau phê duyệt mới trừ tồn thực tế.':'Lưu nháp chưa thay đổi tồn kho. Phê duyệt sẽ giữ hàng; hoàn tất mới trừ tồn thực tế.'}</p></>:<>
      <div className="form-grid"><Field label="Phương án xử lý *"><Select disabled={held} value={method} onChange={event=>{setMethod(event.target.value);setReasonType(event.target.value==='dispose'?'damaged':'clearance');setItems(old=>old.map(row=>({...row,unitPrice:event.target.value==='dispose'?'0':''})));setPrice('');}}><option value="sale">Bán thanh lý</option><option value="dispose">Tiêu hủy</option></Select></Field><Field label="Phân loại xử lý *"><Select aria-label="Phân loại xử lý" value={reasonType} onChange={event=>setReasonType(event.target.value)}>{Object.entries(liquidationReasons).filter(([key])=>method==='dispose'||!['damaged','expired'].includes(key)).map(([key,label])=><option key={key} value={key}>{label}</option>)}</Select></Field><Field className="!col-span-full" label="Lý do xử lý *"><Textarea required maxLength={2000} value={reason} onChange={event=>setReason(event.target.value)} placeholder="Ví dụ: Hàng cận hạn, tồn lâu hoặc hư hỏng…" /></Field></div>
      <p className="form-note">Chỉ chọn lô đã nhập kho. Số lượng trống đã trừ hàng đang giữ cho đơn khác. Bán thanh lý chỉ áp dụng hàng còn hạn và đủ điều kiện kinh doanh; hàng hết hạn hoặc hư hỏng chọn tiêu hủy.</p>
      {held?<p className="form-note">Số lượng đã cách ly không được thay đổi. Có thể bổ sung lý do và gửi duyệt lại. Cửa hàng trưởng kiểm tra lại trước khi hủy phiếu.</p>:<div className="rounded-2xl border border-line bg-cream p-4 space-y-4"><Field label="Lô hàng"><SearchSelect aria-label="Lô thanh lý" value={batchId} onChange={setBatchId} options={data.batches.filter(row=>!items.some(item=>item.batchId===row.id)).map(row=>({value:row.id,label:`${row.productName} · ${row.variantName} · ${row.lotCode || row.batchCode} · Trống ${purchaseQuantity(row.available)}${row.expired?' · Đã hết hạn':''}`,disabled:method==='sale'&&row.expired}))} /></Field>
      {selected&&<p className="text-sm text-stone-500">Trong kho: {purchaseQuantity(selected.onHand)} · Đang giữ: {purchaseQuantity(selected.reserved)} · Trống: {purchaseQuantity(selected.available)} · Hạn dùng: {dateText(selected.expiryDate)}</p>}
      <div className="form-grid"><Field label="Số lượng"><Input aria-label="Số lượng thêm thanh lý" type="number" min="0.001" step="0.001" value={quantity} onChange={event=>setQuantity(event.target.value)} /></Field><Field label="Giá thanh lý (VNĐ)"><MoneyInput aria-label="Giá thanh lý" value={method==='dispose'?'0':price} disabled={method==='dispose'} onChange={setPrice} /></Field></div><Button type="button" variant="outline" onClick={add}><Plus size={16}/>Thêm lô</Button></div>}
      <div className="table-scroll"><table className="data-table"><thead><tr><th>STT</th><th>Sản phẩm / Lô</th><th>Đơn vị tính</th><th>{held?'Đang cách ly':'Trống'}</th><th>Số lượng</th><th>Giá thanh lý (VNĐ)</th><th>Thành tiền (VNĐ)</th><th/></tr></thead><tbody>{items.map((row,index)=><tr key={row.batchId}><td>{index+1}</td><td><strong>{row.productName}</strong><small className="block text-stone-500">{row.lotCode || row.batchCode} · {dateText(row.expiryDate)}</small></td><td>{row.variantName}</td><td>{purchaseQuantity(row.available)}</td><td><Input disabled={held} className="!min-w-24 !w-28" aria-label={`Số lượng lô ${index+1}`} type="number" min="0.001" step="0.001" max={row.available} required value={row.quantity} onChange={event=>changeLine(index,'quantity',event.target.value)} /></td><td><MoneyInput className="!min-w-32" aria-label={`Giá lô ${index+1}`} required value={method==='dispose'?'0':row.unitPrice} disabled={method==='dispose'} onChange={value=>changeLine(index,'unitPrice',value)} /></td><td className="whitespace-nowrap">{purchaseMoney(method==='dispose'?0:Number(row.quantity)*Number(row.unitPrice))}</td><td><Button type="button" variant="ghost" size="icon" disabled={held} aria-label={`Bỏ lô ${index+1}`} onClick={()=>setItems(old=>old.filter((_,i)=>i!==index))}><Trash2 size={16}/></Button></td></tr>)}</tbody></table>{!items.length&&<p className="p-5 text-center text-sm text-stone-500">Chưa chọn lô thanh lý.</p>}</div>
      <p className="text-right font-semibold">Tổng giá trị dự kiến: {purchaseMoney(liquidationTotal(items,method))}</p><Field label="Ghi chú"><Textarea maxLength={2000} value={note} onChange={event=>setNote(event.target.value)} /></Field>
    </>}
    {error&&<p className="form-error" role="alert">{error}</p>}<div className="form-actions"><Button type="button" variant="outline" disabled={busy} onClick={review?()=>setReview(false):onClose}>{review?<><ArrowLeft size={16}/>Quay lại chỉnh sửa</>:'Đóng'}</Button><Button type="submit" disabled={busy}>{review&&<Save size={16}/>} {busy?'Đang lưu…':review?'Xác nhận lưu nháp':'Xem lại phiếu'}</Button></div>
  </fieldset></AdminForm>;
}
