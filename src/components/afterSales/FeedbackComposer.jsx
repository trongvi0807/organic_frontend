import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { SupportError, SupportFiles } from './SupportUI';
import { feedbackTypes } from '@/lib/afterSales';
import { errorMessage } from '@/lib/utils';

// Save text once, then upload files individually. An upload failure never resends text.
export function FeedbackComposer({ service, feedbackId, create = false, orderId, canUpload = true, onSaved, onBusyChange }) {
  const [subject, setSubject] = useState(''), [type, setType] = useState('product'), [content, setContent] = useState('');
  const [files, setFiles] = useState([]), [saved, setSaved] = useState(null), [uncertain, setUncertain] = useState(false);
  const [uploadUncertain, setUploadUncertain] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [touched, setTouched] = useState(false);
  const locked = useRef(false), completedUploads = useRef(new Set());
  async function submit(event) {
    event.preventDefault(); setTouched(true); setError('');
    if (locked.current || uncertain || uploadUncertain || (!saved && (!content.trim() || create && !subject.trim()))) return;
    locked.current = true; setBusy(true); onBusyChange?.(true);
    let record = saved;
    try {
      if (!record) {
        try {
          record = create ? await service.create({ orderId: orderId || null, feedbackType: type, subject: subject.trim(), content: content.trim() }) : await service.reply(feedbackId, content.trim());
        } catch (err) {
          if (!err.response || err.response.status >= 500) setUncertain(true);
          throw err;
        }
        setSaved(record);
      }
      const key = create ? record.feedback.id : feedbackId;
      for (const file of files) {
        if (completedUploads.current.has(file)) continue;
        await service.upload(key, file, create ? undefined : record.id);
        completedUploads.current.add(file);
      }
      toast.success(create ? 'Đã gửi phản hồi đến cửa hàng.' : 'Đã gửi nội dung trao đổi.', { position: 'top-left' });
      setSaved(null); setContent(''); setSubject(''); setFiles([]); setTouched(false); completedUploads.current.clear();
      onSaved(record);
    } catch (err) {
      if (record && (!err.response || err.response.status >= 500)) setUploadUncertain(true);
      setError(`${record ? 'Nội dung đã được lưu. Có tệp chưa tải được; chỉ thử tải lại tệp còn thiếu. ' : ''}${errorMessage(err)}`);
    } finally { locked.current = false; setBusy(false); onBusyChange?.(false); }
  }
  return <form onSubmit={submit} noValidate className="space-y-4"><fieldset disabled={busy || !!saved || uncertain} className="space-y-4">{create && <><Field label="Chủ đề *" error={touched && !subject.trim() ? 'Vui lòng nhập chủ đề.' : ''}><Input value={subject} maxLength={200} onChange={(e) => setSubject(e.target.value)} required /></Field><Field label="Nội dung cần hỗ trợ"><Select value={type} onChange={(e) => setType(e.target.value)}>{Object.entries(feedbackTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field></>}<Field label={create ? 'Mô tả vấn đề *' : 'Tin nhắn của bạn *'} error={touched && !content.trim() ? 'Vui lòng nhập nội dung.' : ''}><Textarea value={content} maxLength={10000} onChange={(e) => { setContent(e.target.value); setTouched(true); }} required /></Field></fieldset>{canUpload && <SupportFiles files={files} onChange={setFiles} disabled={busy || !!saved || uncertain} />}<SupportError>{error}</SupportError>{(uncertain || uploadUncertain) && <p className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900">Chưa rõ kết quả gửi. Vui lòng xem lại nội dung và các tệp đã lưu trước khi gửi bổ sung để tránh trùng.</p>}<div className="flex flex-wrap justify-end gap-3">{saved && <Button variant="outline" disabled={busy} onClick={() => { setSaved(null); setContent(''); setSubject(''); setFiles([]); setTouched(false); setError(''); setUploadUncertain(false); completedUploads.current.clear(); onSaved(saved); }}>Xem nội dung đã gửi</Button>}<Button type="submit" disabled={busy || uncertain || uploadUncertain}>{busy ? 'Đang gửi…' : saved ? 'Tải lại tệp còn thiếu' : create ? 'Gửi phản hồi' : 'Gửi tin nhắn'}</Button></div></form>;
}
