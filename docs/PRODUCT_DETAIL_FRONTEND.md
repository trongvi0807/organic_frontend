> Cập nhật 26/10/2026: Có API tồn khả dụng theo quy cách, liên kết chứng nhận và khôi phục vị trí mua sắm. Xem [phần cập nhật](PURCHASE_REDESIGN.md).

# Trang chi tiết sản phẩm và đánh giá

**Cập nhật 24/10/2026:** Đã tích hợp gửi đánh giá và kiểm tra khách đã mua/nhận hàng ở cả backend và frontend. Xem [hướng dẫn hiện tại](VERIFIED_PURCHASE_REVIEWS.md). Các nội dung về API chỉ đọc và form chỉ lưu nháp bên dưới ghi nhận phạm vi triển khai trước cập nhật này.

Ngày cập nhật: 21/10/2026. Phạm vi theo yêu cầu: **chỉ frontend; không sửa backend**.

## 1. Cách sử dụng

1. Chạy backend như hướng dẫn trong README, giữ `VITE_DEMO_MODE=false` và proxy trỏ đúng backend trong `.env.local`.
2. Chạy `pnpm dev` trong thư mục frontend; mở địa chỉ Vite in ra.
3. Nhấn ảnh hoặc tên sản phẩm ở trang chủ/danh sách để mở `/san-pham/{slug}`. Nút hình con mắt vẫn mở xem nhanh.
4. Chọn ảnh nhỏ hoặc mũi tên, nhấn ảnh lớn để phóng to; Escape đóng hộp thoại. Gallery lấy toàn bộ `images[]` thật từ backend, ưu tiên ảnh chính rồi `sortOrder`.
5. Chọn quy cách, số gói và thêm vào giỏ. Các quy cách khác nhau có dòng giỏ riêng. Giỏ hiện lưu trên trình duyệt, chưa tích hợp Redis cart/đặt hàng/thanh toán.
6. Xem nguồn gốc/chứng nhận, sản phẩm cùng danh mục và đánh giá. Có lọc 1–5 sao, sắp xếp và phân trang 6 đánh giá/trang.
7. Đăng nhập CUSTOMER, nhấn **Viết đánh giá** để chọn sao, nhập bình luận, chọn ảnh/video và xem trước. **Lưu nháp** chỉ lưu phần chữ trong `sessionStorage`, theo tài khoản và sản phẩm; ảnh/video phải chọn lại khi tải lại trang. Khi đóng phần viết, các tệp xem trước được giải phóng.

**Gửi đánh giá đang vô hiệu hóa có chủ ý:** backend chưa có API ghi đánh giá hoặc tải media đánh giá. Không có lệnh POST/upload, không thông báo gửi thành công giả, không thêm bản nháp vào danh sách công khai. `REVIEW_WRITE_AVAILABLE=false` trong service chỉ ghi nhận tình trạng hợp đồng; đổi cờ này không tự tạo luồng gửi.

Frontend kiểm tra tệp nháp: tối đa 5 ảnh JPEG/PNG/WebP, 5 MiB/ảnh; 1 video MP4/WebM, 30 MiB; tổng 50 MiB. Đây là **giới hạn đề xuất của frontend**, chưa phải chính sách backend đã triển khai. Tệp chỉ được đọc bằng object URL trong bộ nhớ, không gửi máy chủ hoặc lưu vào storage. Video dùng bộ phát native; khả năng phát codec phụ thuộc trình duyệt.

## 2. API đang được sử dụng

Đối chiếu `organic_backend/docs/PRODUCT_DETAIL_API.md` trong dự án backend cùng cấp. Public Axios không đính kèm bearer token.

| Phương thức và đường dẫn (sau `/api/v1`) | Chức năng |
| --- | --- |
| `GET /products/slug/{slug}` | Trang chi tiết theo slug từ thẻ sản phẩm |
| `GET /products/{id}` | Đường dẫn dự phòng `/san-pham/id/{id}` |
| `GET /products/{id}/reviews?page=0&size=6&sort=newest&rating=5` | Đọc đánh giá công khai; `rating` có thể bỏ qua, `sort` là `newest/highest/lowest` |
| `GET /products/{id}/related` | Service đã khai báo đúng API; trang hiện dùng `relatedProducts` có sẵn trong DTO chi tiết để tránh gọi lặp |

Chi tiết sử dụng `images`, `variants`, `defaultVariantId`, `origin`, `certifications`, `reviewSummary`, `relatedProducts`, `canAddToCart`. Chỉ hiện chứng nhận hợp lệ theo `organicVerified/currentlyValid`; không suy đoán tồn kho từ `netQuantity`.

Đánh giá đọc `{summary, reviews}`; chuẩn hóa `reviews.content` thành danh sách có phân trang. Tổng quan sao lấy từ summary toàn sản phẩm, không tính lại theo trang/bộ lọc. Giữ tên đã che của backend, badge đã mua chỉ khi `verifiedPurchase=true`. DTO hiện tại chỉ có ảnh `images[]`, chưa có video đánh giá công khai.

Alias `/products/{slug}` chuyển tới trang tiếng Việt; `/products?categoryId=...` chuyển sang `/san-pham?category=...`. API lỗi hiển thị trạng thái lỗi và thử lại; không tự chuyển sang dữ liệu demo. Trường hợp không có ảnh/đánh giá/xuất xứ có trạng thái trống riêng.

Muốn có nhiều góc ảnh thật, cần dữ liệu backend có nhiều URL ảnh khác nhau trong `images[]`; frontend không tự tạo thêm góc chụp.

## 3. API backend cần bổ sung — đề xuất, chưa tồn tại

Cần thống nhất hợp đồng dưới đây trước khi bật gửi thật. Các tên endpoint/payload trong phần này là đề xuất, **frontend chưa gọi**.

### A. Kiểm tra quyền đánh giá

`GET /api/v1/products/{productId}/review-eligibility` — yêu cầu JWT CUSTOMER.

Ví dụ response (bọc theo envelope hiện có của backend):

```json
{
  "eligible": true,
  "reason": null,
  "purchases": [
    { "orderDetailId": "uuid", "variantId": "uuid", "variantName": "Gói 500g" }
  ]
}
```

Chỉ trả các dòng mua thuộc khách hàng đang đăng nhập, đúng sản phẩm, đơn đã giao/hoàn tất theo nghiệp vụ backend hiện tại. Không để client tự nhận đã mua hàng. Chính sách được đánh giá bao nhiêu lần cần thống nhất; entity hiện tại không bảo đảm chỉ một đánh giá/dòng đơn hàng.

### B. Gửi đánh giá cùng media

Đề xuất một request `POST /api/v1/products/{productId}/reviews`, JWT CUSTOMER, `multipart/form-data`:

| Part | Nội dung |
| --- | --- |
| `review` | JSON, Content-Type `application/json`: `orderDetailId`, `rating`, `title`, `content` |
| `files` | Lặp lại cho mỗi ảnh/video; có thể không gửi |

```json
{
  "orderDetailId": "uuid",
  "rating": 5,
  "title": "Cảm nhận về sản phẩm",
  "content": "Nội dung trải nghiệm thực tế của khách hàng."
}
```

Đề xuất validation: rating nguyên 1–5; title tùy chọn, tối đa 200 ký tự; content sau trim 10–3000 ký tự; giới hạn media như phần 1. Backend phải kiểm tra token, sở hữu dòng đơn hàng, trạng thái đơn, đúng sản phẩm/quy cách và tự gán `created_by`; không nhận `reviewerName`, `verifiedPurchase` hay customerId do client quyết định.

Trả 201 với review vừa tạo (hoặc trạng thái chờ duyệt nếu dự án chọn quy trình duyệt); chỉ công khai theo quy tắc đã thống nhất. Frontend cần xử lý 400 validation, 401 hết phiên, 403 không đủ quyền, 404 không tồn tại, 409 xung đột nghiệp vụ, 413 quá dung lượng, 415 sai loại tệp và lỗi lưu media. Những status này là hợp đồng đề xuất, chưa được backend cam kết.

### C. Mở rộng media trong API đọc

Giữ `images[]` để tương thích; bổ sung `media[]` cho ảnh và video:

```json
{
  "media": [
    { "id": "uuid", "type": "image", "url": "https://cdn.example.com/photo.webp", "alt": "Ảnh khách hàng", "sortOrder": 0 },
    { "id": "uuid", "type": "video", "url": "https://cdn.example.com/clip.mp4", "thumbnailUrl": "https://cdn.example.com/poster.jpg", "alt": "Video trải nghiệm", "sortOrder": 1 }
  ]
}
```

Renderer frontend đã hỗ trợ cấu trúc `media[]` trên và fallback về `images[]` hiện hành. Cần backend trả media theo thứ tự mong muốn và URL truy cập được. Với Cloudinary, video phải dùng đúng loại tài nguyên video, không ép qua uploader ảnh.

Backend cần xác minh MIME/chữ ký và nội dung tệp, giới hạn kích thước/số lượng; thống nhất giới hạn thời lượng/codec video riêng. Cấu hình multipart Spring và giới hạn request Nginx phải đủ cho tổng 50 MiB cộng multipart overhead nếu chọn giới hạn đề xuất. Nếu upload thành công một phần nhưng ghi review thất bại, phải dọn tệp mồ côi; có chiến lược rollback/retry tránh tạo trùng. Invalidate cache Home/chi tiết/summary đánh giá sau commit thành công. Không thể thay những kiểm tra này bằng validation trên trình duyệt.

### D. Công việc frontend sau khi có API

Thêm service riêng dùng private Axios/FormData, kiểm tra eligibility và chọn dòng mua, trạng thái đang gửi/validation/lỗi/retry; chỉ cập nhật review/summary từ response thật. Không tự đặt multipart boundary. Quyết định giữ hoặc xóa nháp sau thành công và refresh các dữ liệu chịu ảnh hưởng. Phần này chưa triển khai vì yêu cầu hiện tại chỉ làm frontend dựa trên API đọc đã có.

## 4. Kiểm thử cục bộ tách biệt dữ liệu thật

Chạy fixture tùy chọn ở PowerShell riêng:

```powershell
$env:QA_PRODUCT_DETAIL='true'
$env:QA_API_PORT='19089'
node test-support/backend-fixture.mjs
```

Ở terminal thứ hai:

```powershell
$env:DEV_API_TARGET='http://127.0.0.1:19089'
$env:VITE_DEMO_MODE='false'
pnpm dev --port 5175 --strictPort --host 127.0.0.1
```

Mở `http://127.0.0.1:5175/san-pham/ca-rot-kiem-thu`. Tài khoản giả lập `customer / Organic@123`. Chế độ này chỉ dùng bộ nhớ, không kết nối database thật, không chứng minh bảo mật/lưu dữ liệu Spring Boot. Đóng hai terminal sau QA; các biến trên chỉ có hiệu lực trong terminal đó. Không sửa `.env.local` để bật fixture.

Fixture có 3 mục ảnh dùng cùng một ảnh cà rốt với query khác nhau để kiểm tra điều hướng, **không phải ba góc chụp thật**; 8 nhận xét giả được ghi rõ QA, 2 quy cách và 2 sản phẩm liên quan. Fixture chỉ xử lý đọc đánh giá, không giả lập gửi/upload thành công.

```powershell
pnpm test
pnpm build
```

Ảnh kiểm tra được lưu tại `docs/screenshots/product-detail/`; kết quả và giới hạn xem [VERIFICATION.md](VERIFICATION.md).
# Cập nhật API ngày 26/10/2026

Giỏ Redis/checkout và API gửi/sửa/xóa đánh giá, ảnh/video đã được tích hợp. Hướng dẫn hiện tại: [CHECKOUT_FRONTEND.md](CHECKOUT_FRONTEND.md), [VERIFIED_PURCHASE_REVIEWS.md](VERIFIED_PURCHASE_REVIEWS.md). Phần đề xuất API bên dưới là lịch sử của bản frontend trước khi backend bổ sung các endpoint này.

