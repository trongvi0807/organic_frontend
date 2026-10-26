# Giỏ hàng và xem trước thanh toán

**Cập nhật 26/10/2026:** giỏ Redis và thanh toán thật đã được tích hợp. Xem [CHECKOUT_FRONTEND.md](CHECKOUT_FRONTEND.md) để cấu hình và chạy phiên bản hiện tại. Nội dung bên dưới ghi lại bản giỏ cục bộ/xem trước trước khi backend có API checkout.

## Chạy và sử dụng

Chạy frontend bằng `pnpm dev`, thêm sản phẩm từ danh mục hoặc trang chi tiết rồi nhấn biểu tượng túi trên header. Giỏ hàng tại `/gio-hang`; trang xem lại thanh toán tại `/thanh-toan`. Không cần thêm dependency hoặc biến môi trường cho chức năng này.

- Desktop: danh sách bên trái, bảng tổng kết sticky bên phải. Điện thoại: một cột; thao tác số lượng và xóa nằm dưới thông tin sản phẩm.
- Chọn tất cả hỗ trợ trạng thái chọn một phần; không tính sản phẩm hết hàng, thiếu giá hoặc số lượng vượt tồn kho đã lưu.
- Tăng/giảm trong khoảng 1 đến tồn kho đã lưu, tối đa 99; giảm ở 1 không xóa sản phẩm. Xóa từng sản phẩm bằng nút riêng.
- Xóa tất cả yêu cầu xác nhận; hủy giữ nguyên giỏ, xác nhận xóa cả sản phẩm và mã ưu đãi. Giỏ trống có minh họa SVG và liên kết mua sắm.
- Chỉ sản phẩm đã chọn được tính tạm tính, giảm giá và tổng tiền, cũng như hiển thị trên trang thanh toán.
- Không chọn sản phẩm nào: tổng bằng 0, vô hiệu hóa nút thanh toán. Truy cập trực tiếp checkout khi chưa chọn sản phẩm có liên kết quay lại giỏ.
- Thay đổi số lượng/lựa chọn tự kiểm tra lại điều kiện mã; nếu không còn đủ điều kiện, số tiền giảm về 0. Có thể gỡ mã đang giữ bất cứ lúc nào.

## Mã ưu đãi dùng thử

| Mã | Điều kiện | Giảm giá |
| --- | --- | --- |
| `MOC10` | Sản phẩm được chọn có tổng từ 200.000đ | 10%, tối đa 50.000đ |
| `XANH30` | Sản phẩm được chọn có tổng từ 300.000đ | 30.000đ |

Không phân biệt chữ hoa/chữ thường, bỏ khoảng trắng hai đầu. Mã không tồn tại hoặc chưa đạt điều kiện hiển thị lỗi và không giảm tiền. Các quy tắc nằm trong `src/lib/cart.js`, là dữ liệu trải nghiệm phía frontend, không phải chương trình giảm giá đã được backend xác nhận.

## Thành phần

- `src/pages/client/CartPage.jsx`: bố cục, chọn tất cả và xác nhận xóa.
- `src/components/cart/CartItem.jsx`: sản phẩm, lựa chọn, số lượng, liên kết chi tiết và xóa dòng.
- `src/components/cart/OrderSummary.jsx`: tổng tiền và điều hướng thanh toán.
- `src/components/cart/PromoCode.jsx`: nhập mã, phản hồi và gỡ ưu đãi.
- `src/components/cart/ClearCartDialog.jsx`: dùng Radix Dialog hiện có, giữ focus bàn phím và hiệu ứng mở/đóng của dự án.
- `src/components/cart/EmptyCart.jsx`: minh họa SVG và liên kết mua sắm.
- `src/pages/client/CheckoutPage.jsx`: xem lại sản phẩm đã chọn và tổng tiền, chưa tạo đơn hàng.
- `src/lib/cart.js`: hàm thuần tính tiền, lựa chọn và giới hạn số lượng.
- `src/contexts/ShopContext.jsx`: trạng thái dùng chung với trang chủ, danh mục, chi tiết và header.

Giao diện mới dùng Tailwind, các token xanh/be hiện có và icon Lucide. Một số utility khoảng cách dùng tiền tố `!` để giữ đúng bố cục khi gặp reset heading/paragraph không thuộc CSS layer trong theme cũ. Logo và theme ngoài giỏ được giữ nguyên.

## Lưu trữ và API

Giữ cách lưu localStorage hiện có: `moc.cart` chứa sản phẩm, biến thể, số lượng và `selected`; `moc.cart-promo` chứa mã đã áp dụng. Giỏ cũ chưa có `selected` được xem là đã chọn. Các biến thể cùng sản phẩm có `cartKey` riêng.

Đây là giỏ hàng phía trình duyệt, chưa đồng bộ tài khoản hoặc thiết bị. Giá và tồn kho là ảnh chụp dữ liệu tại thời điểm thêm giỏ, chưa được server xác minh lại. Không dùng số tiền tính ở frontend làm căn cứ thu tiền.

Đã đọc controller và tài liệu backend hiện tại: có API `/api/v1/cart`, CRUD `/items` và `/merge`, nhưng giao diện này vẫn dùng giỏ trình duyệt đang có của dự án. Chưa kết nối các API giỏ server trong thay đổi này.

Backend hiện chưa có API xác thực khuyến mãi/tạo đơn/thanh toán; tài liệu `organic_backend/docs/CART_API.md` cũng ghi `checkoutAvailable=false`. Vì vậy trang checkout thông báo rõ đây là xem trước, nút đặt hàng bị vô hiệu hóa; không giả báo đặt hàng thành công và không xóa giỏ khi mở checkout. Phí vận chuyển và thuế chưa được tính, có ghi chú cạnh tổng tiền.

Khi kết nối thanh toán thật cần:

1. Adapter giỏ server và xử lý gộp giỏ khách/tài khoản, giữ lựa chọn theo `variantId`.
2. API quote nhận các biến thể đã chọn, số lượng và mã ưu đãi; trả giá, tồn kho, điều kiện mã, giảm giá, thuế, vận chuyển và tổng tiền đã kiểm tra phía server.
3. API tạo đơn từ quote và địa chỉ giao hàng, kèm cơ chế chống gửi trùng. Chỉ xóa các dòng đặt thành công sau khi server xác nhận.
4. API trạng thái/thanh toán và xử lý các lỗi giá/tồn kho thay đổi. Giữ các sản phẩm chưa chọn trong giỏ.

## Kiểm thử 22/10/2026

- `pnpm.cmd test`: 49/49 test đạt, gồm 6 test giỏ mới: chọn độc lập biến thể, tương thích giỏ cũ, giới hạn tồn kho/99, số lượng tối thiểu, mã phần trăm/trần giảm, mã cố định, điều kiện tối thiểu, mã sai và tính lại khi bỏ chọn.
- `pnpm.cmd build`: thành công sau các thay đổi cuối; không thêm dependency.
- Kiểm thử trình duyệt ở origin QA riêng `127.0.0.1:5176`, bật dữ liệu demo; không thay đổi localStorage trên cổng người dùng hoặc gọi API tạo đơn.
- Desktop 1440×1000: thêm qua danh mục, mở giỏ từ header, tăng/giảm, chọn riêng và chọn tất cả/trạng thái mixed, mã hợp lệ/sai, bỏ chọn hết khóa thanh toán, tải lại vẫn giữ giỏ và mã.
- Ví dụ: bơ 89.000đ + cà rốt 45.000đ + hạnh nhân 165.000đ = 299.000đ; `MOC10` giảm 29.900đ, còn 269.100đ. Bỏ cà rốt, checkout chỉ còn bơ/hạnh nhân, tổng 228.600đ sau giảm.
- Điện thoại 390×844: danh sách một cột, số lượng và nút xóa dùng được, summary nằm dưới danh sách, không tràn ngang. Kiểm tra hủy xóa giữ 3 dòng, xóa một dòng còn 2, xác nhận xóa hết xuất hiện giỏ trống. Console không có warning/error trong luồng kiểm tra.
- Kiểm tra thêm vùng nội dung rộng 320px: `scrollWidth=clientWidth=320`; các hàng và tổng tiền tự xuống dòng, không làm giãn cột grid.
- Ảnh tại `docs/screenshots/cart/`: `desktop.png`, `mobile.png`, `mobile-small.png`, `checkout.png`, `confirm-clear.png`, `empty.png`.
