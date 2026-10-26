> Cập nhật 26/10/2026: Footer đã tinh gọn thành ba nhóm, bỏ newsletter và các nhóm mô phỏng dài. Xem [phiên bản hiện tại](PURCHASE_REDESIGN.md). Nội dung bên dưới mô tả bản thiết kế trước.

# Footer Mộc Organic

Footer được mở rộng theo bố cục tham khảo Organica: logo, các nhóm điều hướng, hỗ trợ khách hàng và một cột thông tin liên hệ/nhận tin. Giữ nhận diện Mộc, dùng nền trắng/be, xanh thảo mộc và bo góc mềm.

## Thông tin đã được người dùng cung cấp

- Địa chỉ: **36 Trịnh Đình Trọng, Phường Tân Phú**.
- Hotline: **0344855913**, hiển thị **0344 855 913**, liên kết `tel:0344855913`.

Hai thông tin này lấy từ cấu hình footer theo yêu cầu trực tiếp, thay cho địa chỉ/điện thoại cũ của Home. Không tự thêm tỉnh/thành hoặc số chi nhánh.

Người dùng cho phép mô phỏng phần còn lại. Giờ mở cửa, nội dung giới thiệu, email, mạng xã hội, thành viên, tuyển dụng, chính sách và phương thức thanh toán hiện có ghi chú minh họa. Không gắn huy hiệu “Đã thông báo Bộ Công Thương”, D-U-N-S hoặc giấy phép chưa xác nhận.

## Các nhóm nội dung và thao tác

- **Logo & nhận diện:** logo cũ, lời giới thiệu và liên kết hồ sơ nguồn gốc sản phẩm.
- **Khám phá Mộc:** sản phẩm, về cửa hàng, xuất xứ, chứng nhận, quy cách/giá. Liên kết mở các route và khu vực đã có.
- **Đồng hành:** tài khoản, đăng ký, giỏ hàng và tuyển dụng mô phỏng.
- **Góc sống xanh:** các đoạn nội dung mô phỏng về lựa chọn thực phẩm, đọc hồ sơ organic và tin/ưu đãi; mở trong dialog, không dẫn tới chuyên mục blog chưa xây dựng.
- **Hỗ trợ:** hướng dẫn mua hàng, thành viên, giao hàng, thanh toán, đổi trả, bảo mật, xử lý dữ liệu và FAQ. Các mục mở Radix Dialog, có focus bàn phím, đóng bằng Esc và hiệu ứng của theme. Giữ nội dung trong lúc chạy hiệu ứng đóng.
- **Nhận tin:** biểu mẫu mô phỏng có kiểm tra email bằng HTML. Gửi hợp lệ xóa ô nhập và báo rõ chưa đăng ký nhận tin thật. Không gửi request, không lưu email vào localStorage/sessionStorage hoặc log.
- **Địa chỉ, hotline, thông tin cửa hàng và email:** hiển thị nội dung cấu hình; email Home được công bố vẫn hiển thị nếu có. Email `.example` chỉ là văn bản, không tạo liên kết gửi thư.
- **Mạng xã hội:** icon Facebook/Instagram/YouTube mở hộp thoại giải thích đây là mô phỏng. Không tự dẫn khách tới tài khoản của một đơn vị khác.
- **Thanh toán:** COD, chuyển khoản, ví điện tử và thẻ là các thẻ minh họa; nhấn để xem thông tin. Không phải tích hợp cổng thanh toán.
- **Dòng cuối:** bản quyền, quyền riêng tư, điều khoản và nút về đầu trang.

FAQ đọc từ `HomeContext.content.faqs`; các nội dung còn thiếu có lời nhắc liên hệ hotline, không tạo liên kết đến trang 404.

## Sửa thông tin

Chỉnh `src/constants/footer.js`:

```js
FOOTER_CONFIG.address
FOOTER_CONFIG.phone
FOOTER_CONFIG.phoneDisplay
FOOTER_CONFIG.hours
FOOTER_CONFIG.hoursDemo
FOOTER_CONFIG.company
FOOTER_CONFIG.emails
FOOTER_CONFIG.socialLinks
FOOTER_CONFIG.paymentMethods
FOOTER_CONFIG.paymentDemo
FOOTER_CONFIG.verificationBadges
```

Để thay một kênh mạng xã hội bằng trang thật, đặt `href` công khai và `demo: false`. Với email thật, thay địa chỉ và đặt `demo: false` để hiển thị liên kết mailto. Giờ mở cửa thật dùng `hoursDemo: false`. Chỉ thêm huy hiệu xác nhận sau khi có ảnh/tài liệu và URL đối chiếu thật. Các URL được kiểm tra bằng `safeMediaUrl` hiện có.

Nội dung hỗ trợ nằm trong `FOOTER_TOPICS` cùng file. Nội dung về chính sách đang là mô phỏng, cần thay bằng nội dung được đơn vị vận hành phê duyệt trước khi áp dụng cho giao dịch thật.

## Cấu trúc

```text
src/components/layout/
  StoreFooter.jsx
  NewsletterForm.jsx
  FooterSupportDialog.jsx
src/constants/footer.js
```

`StoreLayout` chỉ import footer thay cho component nội tuyến cũ. Các lớp CSS cũ `.store-footer`/`.footer-grid` không dùng cho footer mới để tránh xung đột với Tailwind. Không sửa logo, cấu trúc route hoặc trang quản trị trong thay đổi này.

## Khi kết nối nhận tin thật

Backend hiện chưa có API đăng ký bản tin. Cần thay handler mô phỏng trong `NewsletterForm.jsx` bằng service Axios khi có hợp đồng API, đồng thời bổ sung trạng thái gửi/lỗi/thành công, thông tin sử dụng email và cơ chế hủy đăng ký phù hợp với dịch vụ thật. Không đổi thông báo mô phỏng thành đăng ký thành công khi chưa có xác nhận từ server.

## Kiểm tra 22/10/2026

- `pnpm.cmd test`: **57/57 test hiện có đạt**. Không thêm test chỉ sao chép markup cho thay đổi trình bày này.
- Build production thành công, không thêm dependency.
- Trình duyệt dùng origin QA 5178 và fixture API 19090 riêng: footer desktop 4 cột; mobile hai nhóm điều hướng song song. Vùng nội dung 375px và 320px có `scrollWidth=clientWidth`, không tràn ngang.
- Email sai không được gửi form; email QA hợp lệ nhận thông báo mô phỏng và xóa ô nhập. Hướng dẫn mua hàng, Facebook mô phỏng, thanh toán, FAQ, Esc và liên kết nguồn gốc đã kiểm tra.
- Đọc DOM xác nhận hotline dùng `tel:0344855913`. Trình duyệt QA chặn mở giao thức gọi điện; không ghi nhận cuộc gọi thành công và không thử vượt hạn chế đó.
- Console trang không có warning/error trong các thao tác kiểm tra. Dữ liệu FAQ/email Home trong ảnh lấy từ fixture, không phải xác nhận dữ liệu sản xuất.
- Ảnh: `docs/screenshots/footer/desktop.jpg`, `docs/screenshots/footer/mobile.jpg`.

Chạy ứng dụng như cũ bằng `pnpm dev`, kéo xuống cuối trang để xem footer trên các trang khách hàng.
