import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useResource } from '@/hooks/useResource';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { can } from '@/lib/permissions';
import { dateText } from '@/lib/apiData';
import { adminDate } from '@/lib/adminFormat';
import { purchaseMoney } from '@/lib/purchaseDocuments';
import { errorMessage } from '@/lib/utils';
import { liquidationReasons, liquidationStatuses, liquidationMethods, liquidationActions } from '@/lib/liquidation';
import { liquidationService } from '@/services/admin/liquidationService';
import { LiquidationForm, LiquidationLines, LiquidationStatus } from '@/components/procurement/LiquidationForm';
import { WorkflowHeader, Notice, Refresh, DocumentMeta } from '@/components/procurement/ProcurementUI';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { MoneyInput } from '@/components/ui/money-input';
import { AdminForm } from '@/components/admin/AdminForm';
import { Pagination } from '@/components/common/Pagination';
import { ResourceState } from '@/components/common/ResourceState';

export default function LiquidationsPage() {
  const { user }=useAuth(),[params,setParams]=useSearchParams(),id=params.get('id');
  const [status,setStatus]=useState(''),[search,setSearch]=useState(''),[page,setPage]=useState(0),term=useDebouncedValue(search);
  const [editor,setEditor]=useState(null),[action,setAction]=useState(null),[historyPage,setHistoryPage]=useState(0);
  useEffect(()=>{if(params.get("new")==="dispose"){setEditor({method:"dispose",reasonType:params.get("reasonType")||"damaged",batchId:params.get("batchId")||undefined});setParams({},{replace:true});}},[params,setParams]);
  const list=useResource(()=>liquidationService.list({page,size:10,status:status||undefined,search:term||undefined}),[page,status,term]);
  const detail=useResource(()=>id?liquidationService.get(id):null,[id]);
  const history=useResource(()=>id?liquidationService.history(id,{page:historyPage,size:10}):null,[id,historyPage]);
  function select(id){setHistoryPage(0);setParams(id?{id}:{},{replace:true});}
  function changed(saved){setEditor(null);setAction(null);list.reload();if(saved){select(saved.id);detail.setData(saved);}detail.reload();history.reload();window.dispatchEvent(new Event('moc:inventory-updated'));}
  const doc=detail.data,write=can(user,'liquidation.write'),approve=can(user,'liquidation.approve');
  const own=doc&&(doc.creator.accountId===user?.accountId||approve);
  return <>
    <WorkflowHeader title="Thanh lý & xử lý hàng" description="Lập, duyệt và ghi nhận thanh lý theo từng lô hàng; lưu đầy đủ lịch sử xử lý.">{write&&<><Button onClick={()=>setEditor({})}><Plus size={16}/>Lập phiếu thanh lý</Button><Button variant="outline" onClick={()=>setEditor({method:'dispose',reasonType:'damaged'})}>Xử lý hàng hỏng / hết hạn</Button></>}</WorkflowHeader>
    <Notice>Phiếu tiêu hủy cách ly hàng ngay khi lưu nháp; hàng này không được bán trong khi chờ duyệt hoặc bị từ chối. Hoàn tất xử lý mới trừ tồn thực tế. Bán thanh lý giữ hàng sau phê duyệt.</Notice>
    <section className="admin-table-panel"><div className="table-panel-heading"><h2>Danh sách phiếu thanh lý</h2><Refresh resource={list}/></div><div className="table-filters"><label className="search-field"><Search size={16}/><input aria-label="Tìm phiếu thanh lý" value={search} placeholder="Tìm mã phiếu hoặc lý do…" maxLength={150} onChange={event=>{setSearch(event.target.value);setPage(0);}}/></label><Select aria-label="Trạng thái thanh lý" value={status} onChange={event=>{setStatus(event.target.value);setPage(0);}}><option value="">Tất cả trạng thái</option>{Object.entries(liquidationStatuses).map(([value,label])=><option value={value} key={value}>{label}</option>)}</Select></div>
    <ResourceState loading={list.loading} error={list.error} empty={list.data?.items.length===0} onRetry={list.reload}/>
    {!list.loading&&!list.error&&!!list.data?.items.length&&<div className="table-scroll"><table className="data-table"><thead><tr><th>Mã phiếu</th><th>Ngày lập</th><th>Phương án</th><th>Phân loại</th><th>Người lập</th><th>Giá trị dự kiến</th><th>Trạng thái</th><th/></tr></thead><tbody>{list.data.items.map(row=><tr key={row.id}><td><strong>{row.code}</strong></td><td>{dateText(row.createdAt)}</td><td>{liquidationMethods[row.method]}</td><td>{liquidationReasons[row.reasonType]||'Khác'}{row.stockHeld&&row.method==='dispose'&&<small className="block text-amber-800">Đang cách ly</small>}</td><td>{row.creator.fullName}</td><td className="whitespace-nowrap">{purchaseMoney(row.totalAmount)}</td><td><LiquidationStatus value={row.status}/></td><td><Button size="sm" variant="outline" onClick={()=>select(row.id)}>Xem chi tiết</Button></td></tr>)}</tbody></table></div>}
    <Pagination page={page} size={10} totalPages={list.data?.totalPages||0} totalElements={list.data?.totalElements||0} onChange={setPage}/></section>
    <Modal open={!!id&&!editor&&!action} title={doc?.code?`Phiếu thanh lý ${doc.code}`:'Chi tiết phiếu thanh lý'} description="Đối chiếu phương án đã duyệt, kết quả thực hiện và lịch sử." className="!max-w-[1250px]" onOpenChange={open=>{if(!open)select(null);}}>
      <ResourceState loading={detail.loading} error={detail.error} onRetry={detail.reload}/>
      {doc&&!detail.loading&&!detail.error&&<>
        <div className="!mb-5"><LiquidationStatus value={doc.status}/></div>
        <DocumentMeta entries={[["Phương án",liquidationMethods[doc.method]],["Phân loại",liquidationReasons[doc.reasonType]||'Khác'],["Người lập",doc.creator.fullName],["Ngày giờ lập",adminDate(doc.createdAt,true)],["Lý do",doc.reason],["Ghi chú",doc.note],["Tổng giá trị dự kiến",purchaseMoney(doc.totalAmount)],["Người duyệt",doc.approver?.fullName],["Thời gian duyệt",doc.approvedAt?adminDate(doc.approvedAt,true):null]]}/>
        <LiquidationLines items={doc.items} method={doc.method}/>
        {doc.stockHeld&&doc.method==='dispose'&&<Notice>Số lượng trên phiếu đang được cách ly khỏi lượng có thể bán, kể cả khi phiếu bị từ chối. Chỉ cửa hàng trưởng được xác nhận kiểm tra lại và giải phóng cách ly khi hủy.</Notice>}
        {doc.status==='approved'&&doc.method==='sale'&&<p className="!my-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">Số lượng đã được giữ riêng cho phiếu này. Sau khi thực hiện thực tế, chọn Ghi nhận hoàn tất để trừ tồn kho. Cửa hàng trưởng có thể hủy phiếu để giải phóng lượng giữ.</p>}
        {doc.status==='completed'&&<div className="!mt-5"><h3 className="!mb-4 font-semibold">Kết quả thực hiện</h3><DocumentMeta entries={[["Người thực hiện",doc.executor?.fullName],["Thời gian hoàn tất",adminDate(doc.completedAt,true)],["Bên nhận / đơn vị xử lý",doc.recipient],["Số tiền thực thu",purchaseMoney(doc.actualAmount)],["Kết quả xử lý",doc.resultNote]]}/></div>}
        <div className="!my-5 flex flex-wrap justify-end gap-3">
          {write&&own&&['draft','rejected'].includes(doc.status)&&<Button variant="outline" onClick={()=>setEditor(doc)}>Sửa phiếu</Button>}
          {write&&own&&doc.status==='draft'&&<Button onClick={()=>setAction({type:'submit',doc})}>Gửi duyệt</Button>}
          {approve&&doc.status==='pending_approval'&&<><Button variant="outline" onClick={()=>setAction({type:'reject',doc})}>Từ chối</Button><Button onClick={()=>setAction({type:'approve',doc})}>Duyệt thanh lý</Button></>}
          {can(user,'liquidation.execute')&&doc.status==='approved'&&<Button onClick={()=>setAction({type:'complete',doc})}>Ghi nhận hoàn tất</Button>}
          {write&&!['completed','cancelled'].includes(doc.status)&&(doc.stockHeld||doc.status==='approved'?approve:own)&&<Button variant="outline" onClick={()=>setAction({type:'cancel',doc})}>Hủy phiếu</Button>}
          <Link className="button inline-flex items-center rounded-xl border border-line px-5 py-3 text-sm" to="/admin/inventory">Đối chiếu tồn kho</Link>
        </div>
        <section className="!mt-6 border-t border-line pt-5"><h3 className="!mb-4 font-semibold">Lịch sử xử lý</h3><ResourceState loading={history.loading} error={history.error} onRetry={history.reload}/>{!history.loading&&!history.error&&<ul className="divide-y divide-line">{history.data?.items.map(row=><li className="py-3 text-sm" key={row.id}><div className="flex flex-wrap justify-between gap-2"><strong>{liquidationActions[row.action]||row.action}</strong><span className="text-xs text-stone-500">{adminDate(row.occurredAt,true)}</span></div><p className="!mt-1 text-sm text-stone-500">{row.actor.fullName} · {liquidationStatuses[row.toStatus]}</p>{row.note&&<p className="!mt-1 whitespace-pre-wrap break-words text-sm">{row.note}</p>}</li>)}</ul>}<Pagination page={historyPage} size={10} totalPages={history.data?.totalPages||0} totalElements={history.data?.totalElements||0} onChange={setHistoryPage}/></section>
      </>}
    </Modal>
    {editor&&<LiquidationForm item={editor} onClose={()=>setEditor(null)} onSaved={changed}/>}
    {action&&<ActionDialog action={action} onClose={()=>setAction(null)} onSaved={changed}/>}
  </>;
}
function ActionDialog({ action,onClose,onSaved }) {
  const { doc,type }=action,[note,setNote]=useState(''),[recipient,setRecipient]=useState(''),[amount,setAmount]=useState(String(doc.totalAmount)),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [releaseConfirmed,setReleaseConfirmed]=useState(false);
  const needsRelease=type==='cancel'&&doc.method==='dispose'&&(doc.stockHeld||doc.status==='approved');
  const titles={submit:'Gửi phiếu thanh lý để duyệt',approve:'Phê duyệt thanh lý',reject:'Từ chối phiếu thanh lý',cancel:'Hủy phiếu thanh lý',complete:'Ghi nhận kết quả thanh lý'};
  async function submit(event){
    event.preventDefault();if(busy)return;setError('');
    try{
      if(['reject','cancel','complete'].includes(type)&&!note.trim())throw new Error('Vui lòng ghi rõ lý do hoặc kết quả xử lý.');
      if(type==='complete'&&doc.method==='sale'&&(!recipient.trim()||Number(amount)!==Number(doc.totalAmount)))throw new Error('Nhập bên nhận hàng và số tiền thực thu đúng giá trị đã được duyệt.');
      if(needsRelease&&!releaseConfirmed)throw new Error('Vui lòng xác nhận đã kiểm tra lại hàng cách ly.');
      setBusy(true);const payload=type==='complete'?{recipient:recipient.trim()||null,resultNote:note.trim(),actualAmount:doc.method==='dispose'?0:Number(amount)}:{note:note.trim()||null,...(needsRelease?{releaseConfirmed}: {})};
      const saved=await liquidationService.act(doc.id,type,payload);toast.success(type==='complete'?'Đã ghi nhận kết quả và cập nhật tồn kho.':'Đã cập nhật phiếu thanh lý.');onSaved(saved);
    }catch(failure){setError(errorMessage(failure));}finally{setBusy(false);}
  }
  return <Modal open title={titles[type]} description={`Phiếu ${doc.code} · ${liquidationMethods[doc.method]}`} className="!max-w-[660px]" onOpenChange={open=>{if(!open&&!busy)onClose();}}><AdminForm onSubmit={submit}><fieldset disabled={busy} className="space-y-5">
    <DocumentMeta entries={[["Số lô",String(doc.items.length)],["Giá trị đã lập",purchaseMoney(doc.totalAmount)]]}/>
    {type==='approve'&&<p className="text-sm leading-7 text-stone-500">Hệ thống sẽ kiểm tra lại tồn và giữ riêng toàn bộ số lượng trong phiếu. Tồn thực tế chỉ giảm khi ghi nhận hoàn tất.</p>}
    {needsRelease&&<label className="flex items-start gap-3 rounded-xl border border-line p-4 text-sm leading-6"><input type="checkbox" required checked={releaseConfirmed} onChange={event=>setReleaseConfirmed(event.target.checked)} className="mt-1 shrink-0"/><span>Tôi đã kiểm tra lại và xác nhận giải phóng số lượng cách ly. Hủy phiếu không trừ tồn. Chỉ hàng còn hạn, đủ điều kiện mới được đưa bán lại; hàng cần tiêu hủy phải lập phiếu xử lý thay thế.</span></label>}
    {type==='cancel'&&!needsRelease&&doc.status==='approved'&&<p className="text-sm leading-7 text-stone-500">Hủy phiếu sẽ giải phóng lượng hàng đang giữ cho thanh lý. Tồn thực tế không thay đổi.</p>}
    {type==='complete'&&<><p className="text-sm leading-7 text-stone-500">Chỉ xác nhận sau khi đã {doc.method==='sale'?'bàn giao đủ hàng và thu đủ tiền theo phiếu đã duyệt':'tiêu hủy thực tế toàn bộ số lượng trong phiếu'}. Thao tác này trừ tồn và không thực hiện lại được.</p><Field label={doc.method==='sale'?'Bên nhận hàng *':'Đơn vị / người tiếp nhận xử lý'}><Input aria-label="Bên nhận thanh lý" required={doc.method==='sale'} maxLength={255} value={recipient} onChange={event=>setRecipient(event.target.value)}/></Field><Field label="Số tiền thực thu (VNĐ)" hint={doc.method==='sale'?'Phải bằng giá trị đã duyệt. Nếu cần đổi giá, hủy và lập phiếu mới.':'Tiêu hủy không phát sinh doanh thu.'}><MoneyInput aria-label="Số tiền thực thu" required value={doc.method==='dispose'?'0':amount} disabled={doc.method==='dispose'} onChange={setAmount}/></Field></>}
    <Field label={['reject','cancel'].includes(type)?'Lý do *':type==='complete'?'Kết quả thực hiện *':'Ghi chú'}><Textarea aria-label="Ghi chú xử lý thanh lý" required={['reject','cancel','complete'].includes(type)} maxLength={2000} value={note} onChange={event=>setNote(event.target.value)}/></Field>
    {error&&<p className="form-error" role="alert">{error}</p>}<div className="form-actions"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Quay lại</Button><Button type="submit" disabled={busy}>{busy?'Đang xử lý…':'Xác nhận'}</Button></div>
  </fieldset></AdminForm></Modal>;
}
