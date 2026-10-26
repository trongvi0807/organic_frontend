# Kết quả kiểm tra — 19/10/2026

## Footer gọn, tồn khả dụng và trải nghiệm mua sắm — 26/10/2026

- Frontend **122/122 test (20 file) đạt**, build SPA/worker thành công. Chunk chính khoảng 520 kB trước gzip còn cảnh báo kích thước.
- Backend **23 CheckoutPaymentIntegrationTests + 1 ProductSummaryPriceTests đạt**, DB H2 riêng. Kiểm tra tồn chỉ gồm lô confirmed/chưa hết hạn, trừ giữ hàng; xác minh giá gốc/giá bán cùng variant.
- QA RAM riêng 5187/19097: chi tiết đổi 500g → 1kg thì tồn 12 → 4; giỏ hiện tồn 4, nhập 5 bị từ chối và toast; tiếp tục mua sắm trở đúng URL/hash/vị trí cuộn; liên kết footer mở khu chứng nhận và có URL tài liệu từ API. Footer desktop gọn ba nhóm, mobile 375px không tràn ngang; kiểm tra cả Back trình duyệt giữ vị trí. Không sửa DB thật.
- Giữ các kiểm tra giỏ/checkout/VNPay từ phiên QA trước: chọn dòng, voucher, điểm thiếu/đủ, địa chỉ cũ, pending → paid chỉ theo API, khách có toast và Admin cập nhật. Chưa kiểm tra IPN/gateway thanh toán sandbox thật hoặc GPS thật của thiết bị người dùng.
- Giá giảm trên Home và danh sách đã đối chiếu cùng 28.000đ/32.000đ trong fixture. Checkout không còn chọn voucher/điểm hoặc chuyển khoản trực tiếp; nút THANH TOÁN.
- Cần restart backend để nhận endpoint tồn khả dụng, field giỏ/giá mới và VNPay reference. Chi tiết: [PURCHASE_REDESIGN.md](PURCHASE_REDESIGN.md).
- Bằng chứng mới: [footer](screenshots/purchase-redesign/footer-compact.png), [tồn giỏ](screenshots/purchase-redesign/cart-available-stock.png), [checkout](screenshots/purchase-redesign/checkout-final-desktop.png).


## Checkout, API bán hàng và chuông thông báo — 26/10/2026

- **100/100 test đạt (16 file)**, build SPA và worker thành công; chunk chính khoảng 526 kB trước gzip còn cảnh báo kích thước.
- Thay checkout xem trước bằng preview/tạo đơn thật, Idempotency-Key lưu bền trong phiên, route payment result/cancel, đơn của khách, điểm thưởng, quản lý đơn/giao hàng/COD, mã khuyến mãi và đánh giá sau mua. Giỏ API dùng Redis/cookie/Bearer; giá và tổng tiền do backend xác nhận.
- Chuông ở Admin/cửa hàng có chấm đỏ theo dữ liệu gần đây. Cảnh báo kho read qua API; cập nhật đơn read trên thiết bị do chưa có inbox CUSTOMER/SALES_STAFF ở backend.
- QA browser cô lập 5184/19094: guest merge, mã sai/hợp lệ, tổng sau điểm/ưu đãi 46.400, COD đầy đủ đến hoàn tất; sửa/ngừng mã, tạo/sửa review và chuông hai giao diện. Mobile 390 px không tràn ngang.
- Giả lập POST đã ghi đơn rồi trả 503, reload và khôi phục vẫn một đơn; query status=paid không tạo thông báo thành công cho đến khi GET/sync API xác nhận. Không tạo giao dịch thật hoặc gọi gateway/webhook/Cloudinary/FCM thật.
- Docker image build thành công, Compose hợp lệ. Nginx chạy trong mạng QA cô lập: kiểm tra cấu hình đạt, health/trang thanh toán/worker HTTP 200, runtime config đúng, proxy cart và payment methods đến container API RAM HTTP 200. Không thay đổi database hoặc mạng backend thật.
- [Hướng dẫn đầy đủ](CHECKOUT_FRONTEND.md), [ảnh thanh toán](screenshots/checkout/checkout-desktop.jpg), [chuông Admin](screenshots/checkout/admin-notification-bell.jpg), [chuông cửa hàng](screenshots/checkout/customer-notification-bell.jpg).

## Nhập mua, tồn kho và Firebase Push — 24/10/2026

- **76/76 test đạt (13 file)**; build SPA và worker thành công. Build còn cảnh báo chunk chính khoảng 508 kB trước gzip.
- Tích hợp sáu màn hình theo API procurement backend, menu đúng thứ tự, role kho/Admin và chặn đường dẫn trực tiếp khi sai quyền. Giữ giao diện organic và logo Mộc.
- Browser QA cô lập 5183/19093: lập/duyệt đơn, phiếu 10 đặt = 8 đạt + 1 loại + 1 thiếu, tồn bằng 0 lúc chờ duyệt và bằng 8 sau duyệt; phiếu confirmed không còn nút sửa/duyệt. Thử đổi ngưỡng cảnh báo, đọc/retry thông báo và giới hạn quyền kho/bán hàng.
- Desktop và mobile 390×844: không tràn ngang toàn trang, bảng cuộn riêng. Console không có error/warning trong luồng thông thường.
- Firebase Messaging sử dụng public config/VAPID người dùng cung cấp, token đăng ký qua API hiện có; có worker nền, toast foreground và thu hồi thiết bị khi đăng xuất. Service worker dev trả HTTP 200 JavaScript. Không bật Analytics.
- Compose kiểm tra cú pháp đạt. Docker daemon đang tắt nên chưa build/run container; chưa xác minh push/email thật hay giao dịch với database thật trong lượt này.
- [Hướng dẫn cấu hình và giới hạn](PROCUREMENT_FRONTEND.md), [ảnh tồn kho desktop](screenshots/procurement/inventory-desktop.jpg), [ảnh thông báo mobile](screenshots/procurement/notifications-mobile.jpg).

## Trang Điểm nổi bật — 22/10/2026

- Thêm `/diem-noi-bat` và các component hero, tiêu chuẩn 3 cột, chứng nhận, dinh dưỡng, bao bì tương tác. Header/footer và khối highlights Home dẫn sang trang mới; menu không phụ thuộc Home có highlights hay không.
- **57/57 test hiện có đạt**; build thành công. Không thêm dependency. Tái sử dụng Reveal và helper ngày chứng nhận đã được kiểm thử.
- Browser QA 5179/19091 và demo 5180 riêng: desktop 1440×1000, mobile 390×844 và nội dung 320px không tràn ngang. Kiểm tra menu, neo, bao bì bằng chuột/Enter, chứng nhận có/trống, API lỗi và Thử lại phục hồi. Console sạch trong luồng bình thường; pha cố ý ngắt API có lỗi 500 dự kiến.
- Nội dung tiêu chuẩn và bao bì là định hướng; thẻ USDA/EU/VietGAP chỉ tham khảo, tách với chứng nhận Home. Nội dung dinh dưỡng đối chiếu WHO, không đưa tuyên bố hữu cơ vượt trội hoặc an toàn tuyệt đối chưa chứng minh.
- [Tài liệu và nguồn nội dung](HIGHLIGHTS_PAGE.md), [ảnh hero](screenshots/highlights/desktop-hero.jpg), [ảnh bao bì](screenshots/highlights/desktop-packaging.jpg).

## Footer mở rộng theo mẫu — 22/10/2026

- Tách `StoreFooter`, `NewsletterForm`, `FooterSupportDialog` và cấu hình `footer.js`. Dùng địa chỉ/hotline người dùng cung cấp; phần khác mô phỏng theo yêu cầu, có ghi chú rõ và không tự thêm huy hiệu đăng ký thương mại.
- Bộ test hiện có **57/57 đạt**; build production thành công, không thêm dependency.
- QA trình duyệt cô lập trên 5178/19090: layout desktop/mobile, vùng nội dung 320px/375px không tràn ngang, email sai/hợp lệ trong biểu mẫu mô phỏng, các dialog hỗ trợ/xã hội/thanh toán, FAQ, Esc và liên kết nguồn gốc hoạt động. Email không gửi/lưu; không tạo đơn hoặc thu tiền.
- Hotline xác minh href `tel:0344855913`; trình duyệt chặn giao thức gọi điện nên chưa kiểm chứng cuộc gọi. Console trang không có warning/error trong luồng kiểm tra.
- [Tài liệu cấu hình](FOOTER.md), [ảnh desktop](screenshots/footer/desktop.jpg), [ảnh mobile](screenshots/footer/mobile.jpg).

## Về cửa hàng / truy xuất cho khách hàng — 22/10/2026

- Thêm trang khách hàng `/ve-cua-hang` và các component nguồn gốc, chứng nhận, chọn/so giá quy cách. Header/footer và nút trên hero trang chủ trỏ đến trang mới; trang truy xuất Admin giữ nguyên.
- **57/57 test đạt, 10 file**; build thành công. GET danh sách và chi tiết trên backend thật 8088 đều 200; dữ liệu đọc có 2 chứng nhận và 2 biến thể đơn vị g, origin trống.
- Trình duyệt dùng fixture riêng: desktop 1440×1000, mobile 390×844 và vùng nội dung 320px không tràn ngang. Đã thử tìm kiếm, kết quả trống, đổi sản phẩm, thiếu hồ sơ, chứng nhận hết hạn, biến thể inactive, chọn radio và thêm 2 quy cách thành 2 dòng đúng giá trong giỏ. Console không có warning/error trong luồng kiểm tra.
- Xem [API, quy tắc và hướng dẫn QA](ABOUT_STORE.md), [ảnh desktop](screenshots/about-store/desktop-hero.png) và [thẻ quy cách mobile](screenshots/about-store/mobile-variants.png). Dữ liệu QA không phải hồ sơ chứng nhận thật; kiểm tra trình duyệt chưa được mô tả là E2E với backend thật.

## Trang giỏ hàng — 22/10/2026

- Thêm `/gio-hang` và `/thanh-toan`, giỏ localStorage với lựa chọn từng biến thể, tăng/giảm, xóa từng dòng/toàn bộ có xác nhận và mã ưu đãi dùng thử.
- `pnpm.cmd test`: **49/49 đạt, 9 file**. Kiểm thử trình duyệt trên origin demo QA riêng: desktop 1440×1000 và mobile 390×844; tổng tiền, điều kiện mã, trạng thái chọn một phần, reload, checkout chỉ nhận sản phẩm đã chọn, hủy/xác nhận xóa và giỏ trống đều hoạt động. Không có warning/error console trong luồng kiểm tra.
- `pnpm.cmd build` thành công sau các thay đổi cuối. Vùng nội dung 320px cũng đã kiểm tra không tràn ngang; bố cục co cột và xuống dòng khi thiếu chỗ.
- Giỏ server chưa tích hợp; mã ưu đãi phía frontend dùng để xem trước. Chưa tạo đơn/thu tiền vì backend chưa có API tương ứng. Không dùng demo để khẳng định thanh toán backend đã hoạt động.
- Xem [chi tiết phạm vi và các API cần kết nối](CART_FRONTEND.md), [ảnh desktop](screenshots/cart/desktop.png) và [ảnh điện thoại](screenshots/cart/mobile.png).

## A/B upload avatar qua Vite và gọi thẳng Spring Boot — 22/10/2026

- Đăng nhập tài khoản seed CUSTOMER thật, kiểm tra avatar ban đầu rỗng. Cùng một JWT và JPEG `carrots.jpg` 46.256 byte cho cả hai đường gọi.
- Mã frontend `createProfileService().uploadAvatar()` dùng private Axios thật qua Vite 5173 trả 502; request FormData trực tiếp Spring Boot 8088 cũng trả 502, cùng message lỗi Cloudinary. Không dùng fixture trong đối chiếu này.
- Sau kiểm tra avatar seed vẫn rỗng. Không sửa tài khoản cá nhân hay lưu JWT ra file/log. Test chẩn đoán tạm được dọn sau chạy; việc hai kết quả khớp nhau không có nghĩa upload đã thành công.
- Kết luận lỗi backend/Cloudinary tái hiện độc lập frontend; nguyên nhân gốc bên trong Cloudinary uploader của tiến trình đang chạy vẫn cần log thực tế. Các thử nghiệm SDK độc lập với bộ key người dùng cung cấp ở mục bên dưới vẫn thành công.
- Công cụ trình duyệt ở lượt này không khởi tạo được (`windows sandbox ... setup refresh`), nên không ghi nhận kiểm thử UI mới. Đối chiếu sử dụng service frontend thật chạy bằng Vitest/Node, không giả nhận kết quả trình duyệt.
- Các bước Bruno được bổ sung trong [AVATAR_UPLOAD.md](AVATAR_UPLOAD.md).

## Xác minh credentials Cloudinary và upload thật — 22/10/2026

- Người dùng cung cấp credentials để kiểm tra lỗi avatar 502. REST authenticated ping trả HTTP 200 `ok`; Java SDK 1.38.0 trên JDK 21 của dự án cũng ping thành công.
- Upload ảnh JPEG của frontend bằng SDK với `public_id` QA riêng dưới products, `asset_folder=products`, `overwrite=false`, `allowed_formats=jpg,png,webp` thành công: HTTPS và public ID trả về hợp lệ. Destroy đúng ảnh QA nhận `ok`.
- Gọi trực tiếp `CloudinaryAvatarStorage.upload()` với MultipartFile JPEG hợp lệ và credentials được cung cấp cũng thành công; delete đúng public ID vừa tạo thành công. Không dùng controller/JWT, không gán avatar vào hồ sơ/database thật.
- Bổ sung log nguyên nhân nội bộ trong catch upload, che configured key/secret, giới hạn độ dài và loại bỏ ký tự xuống dòng. Client vẫn nhận thông báo 502 chung. `CloudinaryAvatarStorageTests`: 5/5 đạt qua Maven offline, bao gồm kiểm tra không rò credentials vào log.
- Credentials chỉ truyền qua stdin của tiến trình chẩn đoán, không lưu source hoặc file tạm. Các helper chẩn đoán không chứa secret đã được dọn; không thay environment của tiến trình IntelliJ đang chạy. Cấu hình IDE/runtime và tệp gốc cần được đối chiếu nếu request 502 còn xảy ra sau restart; chưa khẳng định một nguyên nhân gốc cụ thể khi chưa có log request thất bại.

## Home 503 xuất hiện lại sau pull — 22/10/2026

- Backend sau pull có lại `HomeCatalogRepository.java`, nhưng truy vấn aggregate vẫn là bản chưa bổ sung khóa ngoại vào GROUP BY. Trước sửa, gọi Home trực tiếp 8088 và qua Vite 5173 đều trả 503. Log PostgreSQL xác nhận `products.category_id` thiếu trong GROUP BY.
- Chỉ sửa hai truy vấn trong file repository hiện có: `group by p.category, p.category.id` và `group by p.origin, p.origin.id`. Giữ nguyên thay đổi có sẵn trong Compose; không tạo lại file `HomePostgresQueryTests.java` đã xóa.
- SQL tương đương của cả hai truy vấn được PostgreSQL chấp nhận bằng EXPLAIN trong transaction READ ONLY rồi ROLLBACK, không thay đổi dữ liệu/schema.
- `mvn.cmd -o -DskipTests compile -q`: biên dịch backend thành công.
- Chạy bộ test Home hiện có: HomeCacheTests đạt 2/2; HomeIntegrationTests lỗi 9/9 ngay bước setup/cleanup Redis do Java NIO trên Windows (`Unable to establish loopback connection`, `UnixDomainSockets.connect Invalid argument`). Không tính lần chạy integration này là đạt; không sửa hệ điều hành hay cấu hình test để bỏ qua lỗi.
- Backend đang chạy cần restart/nạp lại repository đã biên dịch. Lần kiểm tra HTTP trước restart vẫn trả 503; chưa xác nhận HTTP 200 sau khi người dùng restart.

## Upload avatar tài khoản — 21/10/2026

- Request/JSON người dùng cung cấp xác nhận HTTP 502 và message do catch upload trong backend `CloudinaryAvatarStorage` tạo. Nguyên nhân được khoanh vùng tới gọi/kiểm tra response Cloudinary; exception gốc chưa xác định. Không quy lỗi này cho giới hạn Nginx 413, Axios serialization hay CORS. Không sửa backend hoặc avatar thật.
- Đối chiếu POST `/customers/me/avatar` và part `file` với controller. Test transport Axios thật qua local HTTP xác minh multipart boundary, bearer, MIME/tên/byte của file và response hồ sơ. Thêm timeout avatar 60 giây, kiểm tra tệp rỗng, loading UI, lỗi kèm HTTP/message và tải lại hồ sơ.
- `pnpm.cmd test`: **43/43 test đạt, 8 file**; `pnpm.cmd build` thành công. Không thêm dependency.
- Browser dùng fixture riêng, xác minh FormData thật và chờ 2,5 giây: CUSTOMER đăng nhập, mở tài khoản, chọn JPEG bằng file chooser; UI khóa thao tác và báo đang tải, sau đó cập nhật ảnh theo response. Tệp Markdown bị chặn, hồ sơ/ảnh cũ vẫn còn; nút tải lại hồ sơ hoạt động. Không có warning/error console trong luồng này. Fixture không dùng Cloudinary/DB.
- Kiểm tra container Nginx cô lập bằng template frontend: trước sửa body 2 MiB trả 413; sau `client_max_body_size 6m`, body 2 MiB nhận 204 từ upstream stub, body 7 MiB vẫn 413; `nginx -t` thành công. `proxy_read_timeout` tăng 90 giây. Đây là sửa lỗi Docker riêng, không giải thích response 502 ở Vite 5173 của người dùng.
- Home backend 8088 và qua Vite 5173 hiện trả 200. Chưa xác minh credential và upload thật của Java lên Cloudinary; public ping chỉ xác minh host tới dịch vụ. Server/container QA thuộc phiên được dọn sau kiểm tra, giữ nguyên dịch vụ người dùng.
- Xem [hướng dẫn chẩn đoán](AVATAR_UPLOAD.md) và [ảnh QA tài khoản](screenshots/avatar-upload/account-qa.png).

## Trang chi tiết sản phẩm — 21/10/2026

- Phạm vi chỉ frontend theo lựa chọn của người dùng; không sửa backend. Đối chiếu tài liệu/controller/DTO chi tiết trong backend cùng cấp. Đọc detail theo slug/ID, `relatedProducts` và API GET đánh giá thật; phần ghi đánh giá chưa có API nên chỉ soạn/lưu nháp và preview cục bộ, không POST/upload hoặc giả lập công khai thành công.
- `pnpm.cmd test`: **38/38 test đạt, 7 file**. Thêm 10 test cho đường dẫn, ảnh/URL an toàn, quy cách hợp lệ, media ảnh/video, giới hạn số lượng/dung lượng tệp nháp và hợp đồng GET detail/related/reviews. `pnpm.cmd build`: thành công sau chỉnh sửa cuối, không thêm dependency.
- Browser QA dùng fixture opt-in `QA_PRODUCT_DETAIL=true` tại 19089, Vite riêng 5175, API mode. Không đổi `.env.local`, không sử dụng DB thật. Fixture có 3 mục ảnh cùng ảnh gốc nhưng query khác nhau, không đại diện 3 góc chụp; 8 review giả ghi rõ QA.
- Desktop 1440 × 1000: mở chi tiết từ ảnh thẻ trên Home, chọn ảnh thứ 2, phóng to, chuyển ảnh thứ 3 trong modal và Escape đóng. Chọn gói 1 kg, số lượng 2, thêm giỏ; thêm gói 500 g thành dòng riêng, tổng 128.000 đ; xóa riêng gói 1 kg còn gói 500 g 28.000 đ.
- Lọc 5 sao còn 4 review, tổng quan vẫn 8; sắp sao thấp nhất lên đầu; trang 2 có 2 review. Mở được ảnh đánh giá. Khách chưa đăng nhập được nhắc đăng nhập khi mở phần viết.
- Đăng nhập CUSTOMER fixture chuyển Home, vào lại qua thẻ sản phẩm. Chọn 5 sao, nhập tiêu đề/bình luận, dùng file chooser chọn ảnh JPEG thật từ `public/images/carrots.jpg`, xem trước và lưu nháp. Nút gửi công khai disabled. Reload khôi phục sao/phần chữ, không giữ tệp, đúng thông báo trên form.
- Mobile 390 × 844: kiểm tra form, gallery và modal ảnh; modal vừa màn hình và đóng được. Chiều rộng DOM bằng viewport khả dụng: desktop 1425/1425, mobile 375/375, không tràn ngang toàn trang.
- Nhấn sản phẩm liên quan mở đúng sản phẩm khác. Alias `/products/{slug}#danh-gia` giữ hash và chuyển đúng trang; đường dẫn `/san-pham/id/{id}` tải được. Slug không tồn tại hiện trạng thái lỗi và liên kết về danh sách, không chèn sản phẩm mẫu thay thế.
- Không ghi nhận console warning/error trong các luồng QA. Chưa kiểm tra phát một tệp video thật trong trình duyệt; đã kiểm tra logic loại/kích thước/số lượng video bằng unit test và renderer dùng native video controls. Chưa có upload video thật, kiểm tra quyền mua hàng, lưu review, Cloudinary hoặc cache invalidation vì backend chưa có API ghi.
- Backend thật 8088 không phản hồi trong phiên này; QA fixture không chứng minh tích hợp Spring Boot, database hoặc bảo mật backend thật. Server fixture/Vite thuộc phiên kiểm thử đã được dừng sau QA; không dừng server người dùng.
- Ảnh dữ liệu QA: [Chi tiết desktop](screenshots/product-detail/desktop.png), [Đánh giá desktop](screenshots/product-detail/reviews.png), [Form nháp mobile](screenshots/product-detail/draft-mobile.png). Hợp đồng cần bổ sung: [PRODUCT_DETAIL_FRONTEND.md](PRODUCT_DETAIL_FRONTEND.md).

## Làm mới UI organic — 20/10/2026

- Theo yêu cầu cuối: giữ nguyên component logo; làm lại header, hero ảnh lớn, các section khách hàng, thẻ sản phẩm, theme bảng quản lý và form/modal. Tham khảo Pukka, giữ nội dung và nhận diện của dự án.
- `pnpm.cmd test`: 28/28 test hiện có đạt. `pnpm.cmd build`: thành công sau các chỉnh sửa cuối; không thêm dependency.
- Browser kiểm tra ở desktop 1440 × 1000 và mobile 390 × 844 bằng Vite riêng cổng 5174, demo mode chỉ qua biến môi trường tiến trình. `.env.local` vẫn dùng API thật, không thay đổi backend hoặc dữ liệu DB trong đợt UI này.
- Kiểm tra Home, trang sản phẩm, menu mobile, chi tiết sản phẩm, đăng nhập mẫu, quản lý sản phẩm/danh mục. Card xuất hiện khi vào viewport; phần bên dưới viewport còn pending trước khi cuộn.
- Lọc danh mục Trái cây trong Admin còn 2 bản ghi; mở/sửa/lưu sản phẩm mẫu thành công. Mở/hủy dialog ngừng bán và mở form thêm danh mục; Escape đóng form. Không thực hiện xóa/ngừng bán bản ghi.
- Modal có computed animation `organic-dialog-in`, thời gian 260ms, tâm ngang 720px tại viewport 1440px.
- Mobile không tràn ngang toàn trang; bảng 850px cuộn trong khung 342px. Menu quản lý đóng thì inert, mở giữ focus trong menu, Escape đóng và trả focus về nút mở.
- Không ghi nhận console error/warning trong các luồng kiểm tra. Nhánh reduced motion được hỗ trợ trong CSS/React; không thay đổi cài đặt hệ điều hành để thử chế độ này.
- Backend 8088 không phản hồi lúc kiểm tra UI; không tính demo browser là E2E với backend thật. Các test hợp đồng API hiện có vẫn đạt.
- Ảnh dữ liệu mẫu: [Trang chủ desktop](screenshots/organic-refresh/home-desktop.png), [Sản phẩm desktop](screenshots/organic-refresh/products-desktop.png), [Quản lý danh mục](screenshots/organic-refresh/admin-categories-desktop.png), [Trang chủ mobile](screenshots/organic-refresh/home-mobile.png).
- Tham số và cách tái sử dụng hiệu ứng: [UI_ORGANIC.md](UI_ORGANIC.md).

## Khắc phục Home 503 với backend thật — 20/10/2026

- Gọi trực tiếp `/api/v1/home` trên 8088 và qua Vite 5173 cùng trả 503. PostgreSQL log báo thiếu `products.category_id` trong GROUP BY; Redis trả PONG và PostgreSQL nhận kết nối.
- Sửa `HomeCatalogRepository` của backend: bổ sung khóa ngoại ID vào GROUP BY cho truy vấn danh mục và xuất xứ. Không đổi cấu hình, schema hoặc dữ liệu.
- PostgreSQL 14.1 chấp nhận cả hai SQL đã sửa qua EXPLAIN trong transaction chỉ đọc rồi ROLLBACK.
- Sau khi backend nạp lại mã: gọi trực tiếp Home trên 8088 và qua Vite 5173 đều trả HTTP 200; response qua frontend có nội dung Home và 4 danh mục. Bộ sưu tập sản phẩm nổi bật hiện rỗng theo dữ liệu backend.
- Có thêm test opt-in `HomePostgresQueryTests` chỉ đọc PostgreSQL. Lần chạy Maven ban đầu chưa đạt: test Home/H2 vướng Java NIO loopback khi mở kết nối Redis; test PostgreSQL vướng class projection bị thiếu trong lúc thư mục build đang được biên dịch lại. Không tính hai lần chạy này là test thành công. Kiểm tra HTTP thật sau reload và EXPLAIN là bằng chứng xác nhận bản sửa hiện tại.

## Tích hợp API mới — 20/10/2026

- Đối chiếu controller, DTO, phân quyền và tài liệu trong backend liền kề. Chỉ sửa frontend và tài liệu bàn giao; không sửa backend.
- `pnpm.cmd test`: **28/28 test đạt, 5 file**. Bao gồm tương thích `content`/`items`, bảo toàn liên kết tài khoản, giá sản phẩm Home, public Axios không gửi token, phân quyền helper, payload tự sửa hồ sơ, chứng nhận và FormData.
- `pnpm.cmd build`: thành công; các màn hình quản lý mới được lazy load theo route.
- Browser QA desktop **1440 × 1000** với fixture loopback `127.0.0.1:19088` và Vite riêng cổng 5174: tạo khách hàng/nhà cung cấp/xuất xứ/chứng nhận; mở chi tiết; thu hồi chứng nhận có lý do; gắn xuất xứ/chứng nhận vào sản phẩm; sửa nội dung Home/banner và sản phẩm nổi bật.
- Sau khi thu hồi chứng nhận, trang Home không còn phần chứng nhận hợp lệ hoặc nhãn đã xác minh liên quan. Khi bỏ sản phẩm nổi bật, bộ sưu tập rỗng được ẩn. Gắn chứng nhận chờ duyệt vào sản phẩm vẫn hiển thị đang chờ xác minh.
- Kiểm tra đăng nhập QA theo ADMIN/SALES_STAFF/WAREHOUSE_STAFF/CUSTOMER: menu, nút tạo/sửa/ngừng hoạt động, quyền duyệt và route khách hàng đúng vai trò ở giao diện. CUSTOMER truy cập `/admin/customers` bị chặn.
- CUSTOMER thêm địa chỉ mặc định và cập nhật họ tên của chính mình; thông tin phiên tại frontend cập nhật theo response.
- Không thấy console warning/error ở thời điểm kiểm tra các luồng trên.
- Upload mới được kiểm tra ở mức hợp đồng service: MIME, giới hạn 5 MB, trường multipart `file`, không cố định boundary. **Chưa kiểm thử tải tệp thật lên Spring Boot/Cloudinary**.
- Backend thật `localhost:8088` không phản hồi trong phiên này. Fixture chỉ lưu bộ nhớ, không mô phỏng đầy đủ bảo mật/validation backend; kết quả UI QA không chứng minh Spring Security, lưu DB, cache Redis hoặc Cloudinary thật đã hoạt động. Các kiểm tra ngày 19/10 bên dưới là lịch sử, không thay thế kiểm tra tích hợp mới.
- Ảnh mới dùng dữ liệu QA: [Quản lý chứng nhận desktop](screenshots/2026-10-20/certifications-qa-desktop.png).

Hướng dẫn chạy thật, ma trận quyền và kịch bản demo: [TICH_HOP_API_MOI.md](TICH_HOP_API_MOI.md).

## Bổ sung tài liệu bàn giao

- Build frontend thành công sau khi chỉnh Vite dùng `loadEnv` cho `DEV_API_TARGET`.
- Đã kiểm tra bằng file `.env.local` tạm với cổng backend khác mặc định: proxy đọc đúng giá trị trong file.
- Compose frontend với environment mẫu: `config --quiet` thành công.
- Compose backend gốc kết hợp overlay `docs/examples/backend/compose.app.yml`: `config --quiet` thành công. Chưa build/chạy Spring Boot bằng cấu hình Docker mẫu này; không thay đổi hoặc khởi động lại backend người dùng đang chạy.
- 9 liên kết file tương đối trong hai tài liệu bàn giao trỏ tới file có thật.

## Kiểm tra triển khai frontend trước đó

- `pnpm test`: 8/8 test đạt (2 file).
- `pnpm build`: thành công, đã tách bundle cho các màn hình theo route.
- `docker compose config --quiet`: hợp lệ.
- `docker compose build`: build thành công hai stage Node/Nginx trên Linux.
- Container chạy trên `my-shared-network`, healthcheck báo `healthy`.
- `nginx -t`: cấu hình hợp lệ.
- HTTP `/health`, `/`, `/admin/products`, `/runtime-config.js`, `/images/hero.jpg`: đều 200 qua `127.0.0.1:3000`.
- Runtime config được tạo đúng theo environment container.
- Proxy chuyển `/api/v1/products?size=1` tới alias `organic-backend:8088` và giữ nguyên path/query. Kiểm tra bằng Nginx fixture tạm thời trong network; fixture đã được dọn sau kiểm tra. Đây không phải kiểm thử backend Spring Boot thật.
- Trình duyệt desktop 1440 × 1000: trang chủ, màn hình đăng nhập/đăng ký, bảng quản lý sản phẩm và loại sản phẩm đã render; không có lỗi/warning console tại thời điểm kiểm tra.
- Đã thử đăng nhập Admin mẫu, lọc danh mục, mở/lưu biểu mẫu sản phẩm, tạo/xóa danh mục thử, giỏ hàng, chi tiết sản phẩm và đăng xuất.
- Sau đăng xuất, truy cập trang Admin chuyển về đăng nhập.
- Trang Admin không tràn ngang toàn bộ trang tại 1440px; bảng hỗ trợ cuộn trong khung khi không đủ chiều rộng.

## Giới hạn

- Backend thật tại `localhost:8088` chưa chạy: chưa kiểm thử HTTP trực tiếp với Spring Boot, gửi email, đăng ký, xác thực OTP hoặc phân quyền backend bằng token thật.
- Chưa có hai ảnh mẫu được nhắc trong yêu cầu, nên chưa thể khẳng định khớp chính xác cấu trúc/bố cục trong ảnh.
- Demo dùng dữ liệu trình duyệt. Giá, tồn kho và ảnh trong demo không đại diện dữ liệu sản xuất.
- Không triển khai lên dịch vụ hosting. Các server/container phục vụ kiểm tra được dừng sau khi xác minh; source, image Docker và external network được giữ lại để chạy theo README.

## Ảnh giao diện desktop

- [Trang chủ — khung nhìn desktop](screenshots/home-preview-desktop.png)
- [Trang chủ — toàn trang](screenshots/home-desktop.png)
- [Quản lý sản phẩm](screenshots/admin-desktop.png)
- [Đăng nhập](screenshots/login-desktop.png)
