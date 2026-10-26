# Trang Về cửa hàng / truy xuất cho khách hàng

## Sử dụng

Chạy frontend như hiện tại bằng `pnpm dev`. Menu “Về cửa hàng” trên header, footer và nút trên hero trang chủ mở `/ve-cua-hang`. Không cần thêm dependency hoặc biến môi trường. Logo Mộc được giữ nguyên.

Chọn sản phẩm trong “Khám phá hồ sơ sản phẩm”, có thể tìm theo tên/mã và chuyển trang danh sách nếu có nhiều sản phẩm. Khi chọn cụ thể, URL lưu `?product=<id>` để tải lại hoặc chia sẻ đúng hồ sơ. Nếu chưa chọn, hiển thị sản phẩm đầu tiên trong kết quả công khai. Tìm kiếm danh sách không tự xóa hồ sơ đã chọn bằng URL.

Ba khu vực:

1. **Nguồn gốc**: thẻ hồ sơ với họa tiết địa hình trang trí và các mốc quốc gia, vùng sản xuất, cơ sở sản xuất; địa chỉ/mã vùng/mô tả hiển thị nếu có. Không suy đoán tọa độ hoặc tự thêm quốc gia khi dữ liệu thiếu.
2. **Chứng nhận**: tên hồ sơ, tổ chức cấp, số chứng nhận, ngày cấp, ngày hết hạn, trạng thái và tài liệu công khai. Dùng icon chung thay vì tự gán logo USDA/EU/VietGAP cho hồ sơ chưa xác nhận. Chứng nhận chỉ thuộc sản phẩm đang xem, không quảng bá toàn bộ cửa hàng đạt chuẩn.
3. **Quy cách & giá**: thẻ chọn bằng radio, giá theo gói/hộp, SKU, đơn giá quy đổi và nút thêm giỏ riêng cho từng biến thể. Giỏ dùng ShopContext hiện có, phân biệt theo `productId:variantId`.

## Quy đổi và hiệu lực

- `netQuantity` cùng `unitId` được đọc từ API; đây là khối lượng/dung tích một gói, **không phải số lượng tồn kho**.
- Nhóm khối lượng: g, kg, mg → giá/kg. Nhóm dung tích: ml, l → giá/lít. Chuẩn hóa chữ hoa/thường và khoảng trắng.
- Không suy đoán khối lượng từ tên “Hộp 500g”. Nếu đơn vị là mã chưa hiểu hoặc thiếu thông tin, ghi rõ chưa quy đổi; vẫn có thể mua nếu biến thể đủ điều kiện API.
- Nhãn đơn giá tốt nhất chỉ xuất hiện khi có ít nhất hai quy cách mua được cùng nhóm đơn vị. Không so sánh kg với lít.
- Giá phải dương, `netQuantity` dương, biến thể `active`, sản phẩm không bị `canAddToCart=false`; hết tồn kho được công bố cũng khóa nút thêm.
- Ngày chứng nhận kiểm tra theo ngày Việt Nam. Ngày hết hạn còn hiệu lực trong chính ngày đó; sau đó hiển thị hết hiệu lực. Ngày cấp tương lai, trạng thái chưa xác minh hoặc ngày sai định dạng không được hiển thị là hợp lệ.
- Khi `expiresAt` thiếu, ghi “Chưa công bố”; không tự hiểu là có hiệu lực vĩnh viễn. Backend hiện chỉ trả chứng nhận hợp lệ qua DTO công khai; frontend vẫn xử lý dữ liệu cũ/không còn hiệu lực nếu xuất hiện.

## API và cấu trúc mã

Chỉ dùng API công khai đang có:

```text
GET /api/v1/products?keyword=...&page=0&size=12
GET /api/v1/products/{id}
```

Đọc bằng `catalogService`/`publicApi`, không gửi bearer token và không gọi endpoint truy xuất của Admin. Backend public detail trả `origin`, `certifications`, `variants`; không cần sửa backend cho trang này. HomeContext chỉ cung cấp thông tin liên hệ cửa hàng đã công bố.

```text
src/pages/client/TraceabilityPage.jsx
src/components/traceability/
  ProductExplorer.jsx
  OriginSection.jsx
  CertificationSection.jsx
  CertificationCard.jsx
  VariantSelector.jsx
src/lib/traceability.js
src/lib/traceability.test.js
```

Trang quản trị `src/pages/admin/TraceabilityPage.jsx` và route `/admin/traceability` giữ nguyên. Router dùng alias `AboutStorePage` cho trang khách hàng để tránh nhầm hai component cùng tên.

Giao diện mới dùng Tailwind với token xanh/be hiện có, bo góc mềm, hover nhẹ và Reveal dùng IntersectionObserver. Có điều hướng neo và xử lý neo sau khi tải hồ sơ bất đồng bộ; tôn trọng `prefers-reduced-motion`. Các utility khoảng cách có tiền tố `!` để tương thích reset heading/paragraph không thuộc layer trong theme cũ.

## Kiểm thử 22/10/2026

- `pnpm.cmd test`: **57/57 test, 10 file**, gồm 8 test mới về quy đổi, nhóm đơn vị, điều kiện thêm giỏ, nhãn đơn giá và hiệu lực chứng nhận.
- `pnpm.cmd build`: thành công; không thêm dependency.
- API backend thật trên 8088: GET danh sách `size=1` và GET chi tiết đầu tiên đều **200**. Mẫu đọc có 2 chứng nhận, 2 biến thể, đơn vị `g`, chưa có origin. Chỉ đọc dữ liệu công khai, không đổi database.
- QA trình duyệt dùng Vite 5177 + fixture 19089 riêng, không phải backend thật: desktop 1440×1000, mobile 390×844 và vùng nội dung rộng 320px không tràn ngang; console không có warning/error trong các luồng đã kiểm tra.
- Đã kiểm tra menu, điều hướng các khu vực, tìm kiếm và kết quả trống, chuyển sản phẩm, thiếu origin/chứng nhận, ngày hết hạn và khóa biến thể inactive.
- Quy cách QA 500g giá 28.000đ → 56.000đ/kg; 1kg giá 50.000đ → 50.000đ/kg. Thêm cả hai tạo 2 dòng trong giỏ, tổng 78.000đ, đúng ID biến thể/giá.
- Fixture mở rộng chỉ bật khi `QA_PRODUCT_DETAIL=true` và `QA_TRACEABILITY=true`. Các sản phẩm QA số 2/3 dùng kiểm tra thiếu dữ liệu, đơn vị `box`, chứng nhận hết hạn và biến thể inactive. Không phải chứng nhận hoặc đánh giá thật.
- Ảnh tại `docs/screenshots/about-store/`: `desktop-hero.png`, `desktop-variants.png`, `mobile-variants.png`.

Để tự chạy QA cô lập, dùng hai terminal PowerShell:

```powershell
$env:QA_API_PORT='19089'
$env:QA_PRODUCT_DETAIL='true'
$env:QA_TRACEABILITY='true'
node test-support/backend-fixture.mjs
```

```powershell
$env:VITE_DEMO_MODE='false'
$env:DEV_API_TARGET='http://127.0.0.1:19089'
pnpm dev --port 5177 --strictPort
```

Mở `http://127.0.0.1:5177/ve-cua-hang`. Dùng terminal riêng cho QA để không đổi biến môi trường của phiên phát triển thật.
