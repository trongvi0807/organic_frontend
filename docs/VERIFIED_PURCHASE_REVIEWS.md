# Đánh giá dành cho khách đã mua và nhận hàng

Trang chi tiết sản phẩm sử dụng API thật trong backend organic_backend. Bật `VITE_DEMO_MODE=false` và chạy backend, PostgreSQL, Redis với cấu hình hiện có. Không có thay đổi schema cho chức năng này.

## Luồng giao diện

1. Người dùng mở phần **Viết đánh giá** ở trang chi tiết.
2. Chưa đăng nhập: hiển thị lời mời đăng nhập. Không có quyền CUSTOMER: hiển thị thông báo dành cho khách hàng.
3. Khách đăng nhập: gọi `GET /reviews/eligibility?productId=...` bằng Axios private trong `src/services/api.js`, tự thêm `Authorization: Bearer <accessToken>`.
4. `canReview=false`: không mở form gửi, hiển thị lý do và nút kiểm tra lại. Lỗi kết nối được hiển thị cùng nút thử lại, không coi là đủ điều kiện.
5. `canReview=true`: hiển thị form 1–5 sao, tiêu đề tùy chọn, bình luận, ảnh/video tùy chọn. Nội dung bình luận sau trim từ 10 đến 3000 ký tự là điều kiện giao diện; backend cho phép nội dung tối đa 10000 ký tự theo API hiện có.
6. Gửi `POST /reviews` với `{productId, rating, title, content}`. Danh tính và giao dịch mua được backend xác minh lại; không gửi customerId hoặc cờ đã mua do client tự quyết định.
7. HTTP 201: hiển thị toast, reset form, xóa bản nháp trong phiên, chuyển danh sách về trang đầu/sắp mới nhất và tải lại đánh giá cùng tổng điểm từ API.
8. HTTP 403: hiển thị thông báo từ backend, không báo thành công hoặc tự thêm nhận xét giả. HTTP 401 được Axios xử lý theo cơ chế phiên hết hạn hiện có.

Phần ảnh/video dùng `POST /reviews/{id}/media` sau khi tạo đánh giá. Nếu tải một tệp thất bại, đánh giá đã lưu được giữ lại; thử lại chỉ tải những tệp còn lại và không tạo đánh giá thứ hai trong form đang mở. Thành công từng tệp được loại khỏi hàng chờ. Các giới hạn giao diện hiện tại là 5 ảnh, 5 MiB/ảnh, 1 video 50 MiB, tổng 75 MiB (gửi riêng từng tệp); backend tiếp tục kiểm tra định dạng/nội dung và quota.

## Gọi service

```js
const eligibility = await reviewService.eligibility(product.id);
if (!eligibility.canReview) {
  toast.error(eligibility.message);
  return;
}

try {
  await reviewService.submit(product.id, { rating: 5, content: 'Sản phẩm tươi, đóng gói cẩn thận.' });
  toast.success('Đánh giá đã được gửi thành công.');
  // Reset form và tải lại danh sách, như ReviewComposer/ProductReviews đang triển khai.
} catch (error) {
  toast.error(error.response?.data?.message || 'Chưa gửi được đánh giá. Vui lòng thử lại.');
}
```

Kết quả eligibility không phải quyền truy cập có thể tin cậy ở client. Kể cả khi bỏ qua giao diện và tự gọi POST, backend vẫn chặn người chưa mua hoặc đơn chưa hoàn tất.

## Kiểm thử cần đối chiếu

- Chưa đăng nhập; token sai, hết hạn hoặc bị thu hồi.
- CUSTOMER chưa có đơn chứa sản phẩm; chỉ có đơn shipping/cancelled/returned; đơn đủ điều kiện thuộc khách khác.
- CUSTOMER có đơn Completed/Delivered chứa đúng sản phẩm.
- Eligibility đã true nhưng trạng thái đơn thay đổi trước khi gửi: POST phải trả 403.
- Thành công phải reset sao/nội dung/tiêu đề và làm mới danh sách, có toast.
- Upload thất bại sau khi tạo: thử lại không gửi thêm POST tạo đánh giá.

Từ 26/10/2026, mục Đánh giá của tôi hỗ trợ xem/sửa/xóa đánh giá, thêm/xóa tệp và chỉnh mô tả/thứ tự qua API. Nginx cho phép multipart 60m khớp backend. Xem CHECKOUT_FRONTEND.md để cấu hình hiện tại.

Vitest kiểm tra hợp đồng Axios trong `src/services/productDetail.test.js`, chuẩn hóa media backend trong `src/lib/productDetail.test.js`. Kiểm tra bảo mật và lưu dữ liệu trong H2 thuộc `CustomerReviewIntegrationTests` của backend; kiểm thử giao diện với API giả không thay thế kiểm thử đó.
