# Giao diện organic và chuyển động — 20/10/2026

Thiết kế tham khảo [Pukka Herbs](https://www.pukkaherbs.com/uk/en): hình ảnh thiên nhiên lớn, tiêu đề dễ đọc, các mảng màu thảo mộc và nút bo tròn. Giữ nguyên component logo hiện có theo yêu cầu cuối cùng. Header, hero, thẻ sản phẩm và khu quản lý được làm mới; không sao chép nhận diện hoặc hình ảnh sản phẩm Pukka.

## Màu và component

Điều chỉnh theo phản hồi: logo hiển thị cố định `mộc.` cùng biểu tượng lá và dòng `ORGANIC LIVING`, không lấy tên từ API. Đã bỏ badge “ẢNH MINH HỌA” trên banner; hình nền vẫn giữ nguyên.

Đăng nhập thành công: CUSTOMER về `/` (Home); ADMIN vào `/admin/products`, SALES_STAFF vào `/admin/customers`, WAREHOUSE_STAFF vào `/admin/suppliers`. Người đã đăng nhập mở trang đăng nhập/đăng ký cũng chuyển đến đích tương ứng. Tài khoản có cả vai trò nhân viên và CUSTOMER ưu tiên trang quản lý. Đường dẫn hồ sơ `/tai-khoan` vẫn dùng cho thao tác mở hồ sơ cá nhân.

Theme mới ở `src/styles/organic-theme.css`, import sau stylesheet nền trong `src/main.jsx`. Có thể điều chỉnh bằng các CSS variable đầu file:

| Biến | Giá trị | Vai trò |
| --- | --- | --- |
| `--organic-paper` | `#faf8f1` | Nền kem ấm |
| `--organic-surface` | `#fffefa` | Card và form |
| `--organic-sage` | `#eef2e5` | Mảng xanh nhạt |
| `--organic-ink` | `#294735` | Tiêu đề |
| `--organic-muted` | `#697167` | Chữ phụ |
| `--organic-clay` | `#f4e8dc` | Điểm nhấn đất nung |
| `--organic-lavender` | `#efeaf3` | Điểm nhấn tím nhạt |

Hero tiếp tục đọc headline, giới thiệu và banner từ API Home. Họa tiết thảo mộc là SVG trang trí có `aria-hidden`, không tải ảnh hay thư viện bổ sung. Card sản phẩm có ảnh vuông, tên tối đa hai dòng, giá rõ ràng, nút yêu thích/thêm giỏ và trạng thái API đang cung cấp. Không tạo dữ liệu tồn kho hoặc nhãn chứng nhận mới.

Bảng quản lý dùng nền sáng, đường phân cách nhẹ, badge pastel và cuộn trong khung ở màn hình nhỏ. Các form và modal dùng chung theme để các module mới cũng nhất quán.

## Scroll reveal

`src/components/common/Reveal.jsx` dùng một IntersectionObserver dùng chung, xuất hiện một lần cho mỗi lần mount. Không gắn listener vào sự kiện scroll; ngừng observe sau khi đã hiện và khi unmount.

```jsx
import { Reveal } from '@/components/common/Reveal';

<Reveal as="section" className="container" delay={60}>
  <h2>Tiêu đề section</h2>
</Reveal>
```

- Fade + translate theo trục Y 18px, thời gian 620ms; delay được giới hạn 180ms.
- Product Card nhận `index` để lệch nhịp nhẹ theo hàng, tối đa 135ms.
- Nội dung mặc định nhìn thấy; chỉ chuyển pending khi IntersectionObserver hoạt động. Truy cập bàn phím vào vùng đang ẩn sẽ hiện ngay.
- Có hỗ trợ `prefers-reduced-motion: reduce`: bỏ animation, transition và smooth scrolling; nội dung không bị ẩn.

## Hover và dialog

- Hover card nâng 5px, ảnh scale 1.05 trong 300ms, shadow mềm. Nút nâng 2px.
- Hiệu ứng nâng/scale chỉ bật cho thiết bị có hover và con trỏ chính xác, tránh trạng thái hover dính trên màn hình cảm ứng.
- Modal Radix mở 260ms: opacity + scale từ .96; đóng 160ms. Transform luôn giữ `translate(-50%, -50%)` để form vẫn nằm giữa màn hình.
- Overlay fade và blur nhẹ. Radix tiếp tục xử lý focus trap, Escape và khôi phục focus.

## Chạy và kiểm tra

Chạy như trước: `pnpm.cmd dev`. Không cần cài thêm dependency, sửa `.env.local`, Docker hay backend cho thay đổi giao diện này. Cấu hình API thật được giữ nguyên.

Preview trong quá trình phát triển dùng demo mode chỉ ở biến môi trường của tiến trình riêng cổng 5174 vì backend không phản hồi lúc kiểm tra UI. Các ảnh preview là dữ liệu minh họa; tài khoản và nội dung thực vẫn do backend cung cấp khi chạy mode thật.

Xem [VERIFICATION.md](VERIFICATION.md) cho kết quả build/test và kiểm tra trình duyệt.
