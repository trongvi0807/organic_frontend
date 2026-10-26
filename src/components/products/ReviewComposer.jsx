import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImagePlus, Star, X, Film, Save, Eye, Info, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useResource } from '@/hooks/useResource';
import { hasRole } from '@/lib/permissions';
import { errorMessage } from '@/lib/utils';
import { reviewService } from '@/services/client/reviewService';
import { validateReviewFiles } from '@/lib/productDetail';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { StarRating } from './StarRating';

const sentiments = ['', 'Rất chưa hài lòng', 'Chưa hài lòng', 'Bình thường', 'Hài lòng', 'Rất hài lòng'];
function readDraft(key) {
  try { return JSON.parse(sessionStorage.getItem(key)) || {}; } catch { return {}; }
}

export function ReviewComposer({ product, onPublished }) {
  const { user } = useAuth();
  if (!user) return <div className="review-login-prompt"><Info size={22} /><h3>Chia sẻ trải nghiệm của bạn</h3><p>Vui lòng đăng nhập. Chỉ khách đã mua và nhận sản phẩm mới có thể viết đánh giá.</p><Link className="hero-cta" to="/dang-nhap">Đăng nhập</Link></div>;
  if (!hasRole(user, 'CUSTOMER')) return <p className="form-note">Phần viết đánh giá dành cho tài khoản khách hàng.</p>;
  return <PurchaseGate key={`${product.id}:${user.id || user.username}`} product={product} user={user} onPublished={onPublished} />;
}

function PurchaseGate({ product, user, onPublished }) {
  const eligibility = useResource(() => reviewService.eligibility(product.id), [product.id, user.id || user.username]);
  if (eligibility.loading) return <p className="form-note" role="status">Đang kiểm tra điều kiện đánh giá…</p>;
  if (eligibility.error) return <div className="review-login-prompt"><p className="form-error" role="alert">{eligibility.error}</p><Button className="mt-4" variant="outline" onClick={eligibility.reload}>Thử lại</Button></div>;
  if (!eligibility.data?.canReview) return <div className="review-login-prompt"><Info size={22} /><h3>Đánh giá từ khách đã mua hàng</h3><p>{eligibility.data?.message || 'Bạn cần mua và nhận sản phẩm này trước khi có thể đánh giá.'}</p><Button className="mt-4" variant="outline" onClick={eligibility.reload}>Kiểm tra lại</Button></div>;
  return <DraftForm product={product} user={user} onPublished={onPublished} />;
}

function DraftForm({ product, user, onPublished }) {
  const draftKey = `moc.review-draft:${user.id || user.username}:${product.id}`;
  const [draft] = useState(() => readDraft(draftKey));
  const [rating, setRating] = useState(Number.isInteger(Number(draft.rating)) && Number(draft.rating) >= 1 && Number(draft.rating) <= 5 ? Number(draft.rating) : 0);
  const [title, setTitle] = useState(typeof draft.title === 'string' ? draft.title.slice(0, 200) : '');
  const [content, setContent] = useState(typeof draft.content === 'string' ? draft.content.slice(0, 3000) : '');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);
  const savedReview = useRef(null);
  const submitting = useRef(false);
  const urls = useRef(new Set());
  useEffect(() => () => { for (const url of urls.current) URL.revokeObjectURL(url); urls.current.clear(); }, []);
  function attach(event) {
    const added = Array.from(event.target.files || []);
    event.target.value = '';
    setError(''); setStatus(''); setPreview(false);
    const unique = added.filter((file, index) => !files.some((item) => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified) && !added.slice(0,index).some((other) => other.name === file.name && other.size === file.size && other.lastModified === file.lastModified));
    try {
      validateReviewFiles([...files.map((item) => item.file), ...unique]);
      const next = unique.map((file) => { const url = URL.createObjectURL(file); urls.current.add(url); return { id: crypto.randomUUID(), file, url, type: file.type.startsWith('video/') ? 'video' : 'image' }; });
      setFiles((old) => [...old, ...next]);
    } catch (err) { setError(err.message); }
  }
  function remove(item) {
    URL.revokeObjectURL(item.url); urls.current.delete(item.url);
    setFiles((old) => old.filter((entry) => entry.id !== item.id)); setPreview(false);
  }
  function saveDraft() {
    try { sessionStorage.setItem(draftKey, JSON.stringify({ rating, title, content })); setStatus('Đã lưu nháp phần chữ trong phiên trình duyệt này. Ảnh/video cần chọn lại nếu tải lại trang.'); setError(''); }
    catch { setError('Trình duyệt không cho lưu nháp. Bạn vẫn có thể gửi đánh giá.'); }
  }
  function valid() {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) { setError('Vui lòng chọn từ 1 đến 5 sao.'); return false; }
    if (content.trim().length < 10) { setError('Bình luận cần ít nhất 10 ký tự, không chỉ khoảng trắng.'); return false; }
    setError(''); return true;
  }
  function showPreview() { setStatus(''); if (valid()) setPreview(true); }
  async function publish(event) {
    event.preventDefault();
    if (submitting.current || (!savedReview.current && !valid())) return;
    submitting.current = true; setBusy(true); setError(''); setStatus('');
    try {
      if (!savedReview.current) {
        savedReview.current = await reviewService.submit(product.id, { rating, title, content });
        setReviewSaved(true);
      }
      // Retry only pending attachments after a partial success, without creating another review.
      for (const item of files) {
        await reviewService.uploadMedia(savedReview.current.id, item.file);
        remove(item);
      }
      try { sessionStorage.removeItem(draftKey); } catch { /* Sending does not depend on local storage. */ }
      setRating(0); setTitle(''); setContent(''); setFiles([]); setPreview(false);
      savedReview.current = null; setReviewSaved(false);
      setStatus('Đánh giá của bạn đã được gửi thành công.');
      toast.success('Cảm ơn bạn! Đánh giá đã được gửi thành công.');
      onPublished?.();
    } catch (err) {
      const message = savedReview.current
        ? `Đánh giá đã được lưu, nhưng chưa tải xong tệp đính kèm. ${errorMessage(err)} Bạn có thể thử gửi lại các tệp còn lại.`
        : errorMessage(err);
      setError(message); toast.error(message);
      if (savedReview.current) onPublished?.();
    } finally { submitting.current = false; setBusy(false); }
  }
  return <div className="review-composer">
    <div className="composer-heading"><div><span className="eyebrow">CẢM NHẬN CỦA BẠN</span><h3>Bạn thấy sản phẩm thế nào?</h3><p>{product.productName}</p></div><span className="draft-label">Đã mua và nhận hàng</span></div>
    <div className="review-api-note"><Info size={18} /><p>Chia sẻ trải nghiệm thực tế về sản phẩm đã nhận. Cửa hàng sẽ kiểm tra lại điều kiện mua hàng khi bạn gửi.</p></div>
    <form onSubmit={publish} aria-busy={busy}>
      <fieldset disabled={busy || reviewSaved} className="m-0 min-w-0 border-0 p-0 disabled:opacity-60"><legend className="sr-only">Nội dung đánh giá</legend>
      <fieldset className="review-stars-input"><legend>Mức độ hài lòng <span aria-hidden="true">*</span></legend><div>{[1,2,3,4,5].map((value) => <label key={value} className={value <= rating ? 'selected' : ''}><input type="radio" name="review-rating" value={value} checked={rating === value} onChange={() => { setRating(value); setPreview(false); }} required aria-label={`${value} sao`} /><Star size={27} fill={value <= rating ? 'currentColor' : 'none'} aria-hidden="true" /></label>)}</div><p aria-live="polite">{sentiments[rating] || 'Chọn từ 1 đến 5 sao'}</p></fieldset>
      <Field label="Tiêu đề đánh giá"><Input maxLength={200} value={title} placeholder="Điều bạn ấn tượng nhất…" onChange={(event) => { setTitle(event.target.value); setPreview(false); }} /></Field>
      <Field label="Bình luận *" hint="Chia sẻ cảm nhận về chất lượng, hương vị hoặc cách bạn sử dụng sản phẩm."><Textarea value={content} onChange={(event) => { setContent(event.target.value); setPreview(false); }} minLength={10} maxLength={3000} required rows={5} placeholder="Trải nghiệm thực tế của bạn sẽ giúp những người mua sau lựa chọn phù hợp hơn…" /></Field><span className="review-char-count">{content.length}/3000</span>
      </fieldset>
      <div className="review-upload-heading"><h4>Ảnh & video của bạn <span>(không bắt buộc)</span></h4><p>Tối đa 5 ảnh (5 MB/ảnh) và 1 video (50 MB), tổng 75 MB.</p></div>
      <label className="review-dropzone"><ImagePlus size={25} strokeWidth={1.4} /><span>Chọn ảnh hoặc video</span><small>JPEG, PNG, WebP · MP4, WebM</small><input disabled={busy || reviewSaved} aria-label="Chọn ảnh hoặc video đánh giá" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple onChange={attach} /></label>
      {!!files.length && <div className="draft-attachments">{files.map((item) => <div key={item.id}><div className="draft-media-preview">{item.type === 'video' ? <video src={item.url} controls playsInline preload="metadata" aria-label={`Xem trước ${item.file.name}`} /> : <img src={item.url} alt={`Xem trước ${item.file.name}`} />}<button disabled={busy} type="button" aria-label={`Bỏ tệp ${item.file.name}`} onClick={() => remove(item)}><X size={15} /></button></div><span>{item.type === 'video' && <Film size={12} />}{item.file.name}</span><small>{(item.file.size / 1024 / 1024).toFixed(2)} MB</small></div>)}</div>}
      <p className="review-local-note">Ảnh/video sẽ được tải lên khi bạn gửi đánh giá. Nếu một tệp gặp lỗi, bạn có thể thử lại riêng các tệp chưa tải xong.</p>
      {error && <p className="form-error" role="alert">{error}</p>}{status && <p className="draft-status" role="status">{status}</p>}
      <div className="composer-actions"><Button disabled={busy || reviewSaved} variant="outline" onClick={saveDraft}><Save size={16} />Lưu nháp</Button><Button disabled={busy || reviewSaved} variant="outline" onClick={showPreview}><Eye size={16} />Xem trước</Button><Button type="submit" disabled={busy}><Send size={16} />{busy ? 'Đang gửi…' : reviewSaved ? 'Hoàn tất tải tệp' : 'Gửi đánh giá'}</Button></div>
    </form>
    {preview && <section className="review-draft-preview" aria-label="Xem trước bản nháp"><span className="draft-label">Xem trước · Chưa công khai</span><StarRating value={rating} /><h4>{title.trim() || 'Đánh giá của bạn'}</h4><p>{content.trim()}</p>{!!files.length && <p className="review-local-note">Đính kèm {files.filter((file) => file.type === 'image').length} ảnh, {files.filter((file) => file.type === 'video').length} video.</p>}</section>}
  </div>;
}

