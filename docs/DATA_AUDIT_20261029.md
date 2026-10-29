# Rà soát dữ liệu giao diện — 29-10-2026

## Kết luận

Mã nguồn ban đầu còn nhiều nhánh dựng dữ liệu trên trình duyệt. Một số nhánh có thể mở bằng nút trên Dashboard hoặc đường dẫn riêng dù đang kết nối hệ thống lưu trữ. Theo yêu cầu dùng dữ liệu thật, các lối này đã được đóng trong mã nguồn. Không chạy build, kiểm thử tự động hay thử đặt hàng/thanh toán thay người dùng.

## Các nguồn từng dùng dữ liệu dựng sẵn

| Chức năng | Nguồn / điều kiện cũ | Trạng thái sau cập nhật |
|---|---|---|
| Đăng nhập | `src/constants/demo.js`, `authService.login`: tài khoản dựng sẵn và token `demo-only` khi bật DEMO_MODE | Đăng nhập luôn gửi yêu cầu xác thực. Chỉ phiên cũ `demo-only` bị bỏ; phiên hợp lệ không bị xóa. |
| Danh mục / sản phẩm Admin | `demoStore.js` + localStorage, nhánh DEMO_MODE trong `categoryService` / `productService` | DEMO_MODE cố định false; các trang dùng dịch vụ quản lý và dữ liệu lưu trữ. Không lấy mẫu để thay lỗi tải dữ liệu. |
| Trang chủ, danh sách, chi tiết, tồn kho sản phẩm | `demoPage`, `demoDetail`, stock trong bộ dữ liệu cũ | Nhánh mẫu không bật từ biến môi trường hoặc runtime-config. Giá, hình ảnh và quy cách lấy từ danh mục mới; tồn khả dụng đọc riêng. |
| Dashboard | `createDashboardDemo`, nút “Xem bản mẫu” ngay trên trang | Bỏ nút và nhánh tạo số liệu tại dịch vụ Dashboard. Doanh thu, đơn, kho, lô, tác vụ lấy từ các danh sách thực tế. Nguồn lỗi vẫn báo thiếu dữ liệu. |
| Lịch sử / theo dõi / hủy / đổi trả đơn mẫu | `/demo/don-hang`, `/demo/don-hang/:id`, `demoOrders.js`, sessionStorage | Các đường dẫn cũ chuyển tới `/don-hang`, có kiểm tra đăng nhập và quyền khách hàng. Không render trang với prop demo. Các helper cũ vẫn còn cho việc rà dọn mã, không được gắn vào luồng sử dụng chính. |
| Giỏ hàng cục bộ | Nhánh DEMO_MODE của ShopContext, khóa `moc.cart` | Giỏ khách/thành viên dùng dịch vụ giỏ lưu ở Redis. Việc chọn checkbox là trạng thái giao diện, không phải dữ liệu bịa. |
| Mã giảm giá dựng sẵn | `PREVIEW_PROMOTIONS` chứa MOC10/XANH30 trong `src/lib/cart.js` | Vẫn còn trong helper cũ nhưng không được truyền vào tính giảm giá ở luồng chính vì DEMO_MODE=false. Khuyến mãi thật lấy từ danh sách ưu đãi và bước kiểm tra đơn. Chưa có ưu đãi mới được tự tạo. |
| Ảnh chứng nhận tự vẽ | `SampleDocument` trong `CertificateDocumentPreview.jsx` cho mã DEMO-CERT | Đã bỏ SVG tự tạo. Chỉ xem ảnh/tài liệu đính kèm có đường dẫn hợp lệ; thiếu tài liệu thì thông báo chưa có. |
| Nội dung footer | Email `.example`, đoạn hỗ trợ có chữ mô phỏng | Bỏ email tự dựng, thay hướng dẫn trung tính và thông tin liên hệ người dùng đã cung cấp. Không tự gán mã số thuế/chứng nhận cho cửa hàng. |
| Dữ liệu tự nạp backend | CatalogDataInitializer và TestDataInitializer | Mặc định `APP_SEED_ENABLED=false`; danh mục cũ còn yêu cầu thêm `APP_CATALOG_SEED_ENABLED=true` mới được nạp. Các class cũ chưa bị xóa. |

`DEMO_MODE` được giữ làm tên export tương thích, có giá trị cố định `false` trong `src/services/api.js`. Không thể bật bằng `VITE_DEMO_MODE=true`. Những tệp hằng số/helper cũ vẫn tồn tại; không nên diễn giải rằng toàn bộ mã mẫu đã được xóa khỏi repository.

Các file `*.test.js`, `*.test.jsx` và `src/test/java` chứa fixtures/mocks phục vụ kiểm thử; chúng không phải dữ liệu được đưa vào màn hình vận hành. Không chạy chúng trong đợt này.

## Những phần không phải mock

- Chuông thông báo ghép trạng thái từ đơn hàng, danh sách ưu đãi, sản phẩm mới và thông báo kho thực tế. Trạng thái đã đọc của một số loại thông báo lưu trên trình duyệt, không đồng nghĩa với dữ liệu thông báo bị bịa.
- Dashboard tính chỉ số từ danh sách chứng từ. Số 0 sau khi dọn lịch sử là kết quả chưa có giao dịch, không phải số liệu ngẫu nhiên. Nguồn chưa tải được có trạng thái lỗi riêng.
- Danh sách tỉnh/phường và nguồn định vị là dữ liệu địa chỉ, không phải hồ sơ khách hàng giả.
- Ảnh trang trí banner, icon và nội dung hướng dẫn là tài nguyên giao diện. Ảnh 24 sản phẩm mới đã được lưu đường dẫn vào database theo đúng sản phẩm nguồn.
- Yêu thích và lựa chọn sản phẩm ở giỏ là dữ liệu người dùng/trạng thái giao diện. Yêu thích hiện lưu trên trình duyệt, chưa phải đồng bộ tài khoản trong database.
- Giá bán ban đầu lấy từ bảng giá công khai của nơi cung ứng. Chưa có giá nhập, hàng tồn, lô hoặc chứng từ nhận hàng mới được tự suy ra.

## Thanh toán: cần phân biệt môi trường cổng

Không tìm thấy nhánh tự báo đã thanh toán thành công bằng dữ liệu mẫu trong luồng kết quả thanh toán chính. Trang đọc trạng thái giao dịch đã lưu. Tuy nhiên mã cấu hình mặc định vẫn có VNPay sandbox, PayPal `mode=sandbox`, và cấu hình SDK PayPal cũ ghi `Environment.SANDBOX`. Đây là gọi dịch vụ ở môi trường thử của nhà cung cấp, **không chứng minh thu tiền thật**. Không tự thay khóa hoặc chuyển live trong đợt này. Chưa kiểm tra cấu hình môi trường của tiến trình đang chạy và chưa thực hiện giao dịch.

## Dữ liệu đã thay trong database local

Database: `my_postgres_db`, PostgreSQL trong `postgres_container`, cổng máy local 5434.

- 24 sản phẩm, 24 quy cách, 30 ảnh; không có sản phẩm thiếu ảnh chính.
- 11 danh mục có cha–con, 8 thương hiệu, 4 đơn vị cung ứng, 8 hồ sơ nguồn gốc.
- Lịch sử đơn bán, thanh toán, đơn mua, phiếu nhập, lô, ưu đãi và đánh giá cũ đã dọn theo phạm vi người dùng xác nhận.
- Không tạo chứng nhận hoặc quan hệ mua bán đã hoàn tất; không tạo tồn kho/đơn/giao dịch mới. Tồn ban đầu là 0.
- Giữ 6 tài khoản, 6 liên kết phân quyền, 4 vai trò, 4 hồ sơ khách hàng, 3 hồ sơ nhân viên, 1 địa chỉ và 8 thiết bị thông báo. Điểm phát sinh từ lịch sử đã xóa được đưa về 0.
- Đã so dấu vân tay dữ liệu trước/sau: tài khoản, mật khẩu, vai trò, cấu hình và thông tin hồ sơ được giữ nguyên ngoài hai trường điểm.
- Dọn đúng 5 khóa giỏ/bộ nhớ danh mục cũ trong Redis; không xóa khóa đăng nhập. Trình duyệt dọn một lần những khóa giỏ/yêu thích/dữ liệu dựng sẵn gắn danh mục đã bỏ, giữ phiên đăng nhập hợp lệ và thông tin thiết bị.

Chi tiết nguồn và kết quả kiểm tra lưu ở `D:/oragnic-pro/data-maintenance/20261029/catalog-manifest.json` và `replacement-report.json`. Bản sao lưu mới nhất trước thay dữ liệu: `D:/oragnic-pro/data-maintenance/20261029/backup-before-replace-021220/`. Bản sao lưu chứa dữ liệu riêng tư, nằm ngoài repository và không đưa lên Git.

## Việc người dùng thực hiện tiếp

### Bổ sung theo yêu cầu ngày 29-10-2026

Sau đợt dọn dữ liệu ở trên, đã lưu thêm 5 ưu đãi tiền cố định và 3 hồ sơ chứng nhận vào database local. Các số lượng 0 trong phần kiểm kê ban đầu là trạng thái trước lần bổ sung này.

| Mã ưu đãi | Giảm trực tiếp | Đơn tối thiểu |
| --- | ---: | ---: |
| KM01 | 10.000đ | 100.000đ |
| KM02 | 20.000đ | 200.000đ |
| KM03 | 30.000đ | 300.000đ |
| KM04 | 40.000đ | 400.000đ |
| KM05 | 50.000đ | 500.000đ |

Áp dụng 24 sản phẩm đang bán, từ 29-10-2026 đến hết 08-11-2026 theo giờ Việt Nam. Ngày kết thúc lưu `2026-11-09T00:00:00` vì điều kiện dịch vụ là thời gian hiện tại nhỏ hơn ngày kết thúc. Mỗi đơn dùng một mã; chưa giới hạn tổng lượt hay lượt mỗi tài khoản. Không tạo lượt sử dụng hoặc đơn hàng.

- **EU Organic - Markal**, số `FR-BIO-01.250-0106161.2026.005`, ECOCERT FRANCE (FR-BIO-01), cấp 02-10-2026, hiệu lực 25-09-2026 đến 31-03-2028. Đối chiếu tài liệu gốc và phụ lục: đậu gà trang 2, đậu lăng xanh trang 4, yến mạch cán trang 6. Liên kết đúng SP12/SP13/SP14, trạng thái đã xác minh. [Nguồn Markal](https://www.markal.fr/annexes/certificats). Đây là chứng nhận của nhà sản xuất, không phải của toàn bộ cửa hàng hoặc xác nhận lô chưa nhập.
- **USDA Organic - Vạn Sơn Thịnh Phát**, số `1780900475`, Control Union Certifications B.V., cấp 23-09-2025. Lưu **chờ xác minh**, chưa liên kết sản phẩm: chưa đối chiếu được tình trạng hiện tại trên USDA Integrity và thiếu phụ lục sản phẩm. Không lấy Anniversary Date làm ngày hết hạn.
- **HACCP CODEX - Vạn Sơn Thịnh Phát**, số `HFM2512`, KMR VN. Lưu **chờ xác minh**, chưa liên kết sản phẩm: ảnh công khai thiếu phần ngày cấp/hiệu lực/phạm vi. HACCP là hệ thống an toàn thực phẩm, không thay thế chứng nhận hữu cơ. [Nguồn hai hồ sơ Altavie](https://altavie.vn/pages/chung-nhan).

Tài liệu nguồn, bản sao lưu riêng trước mỗi lần thêm và báo cáo đối chiếu nằm trong `D:/oragnic-pro/data-maintenance/20261029/`: `promotions-added.json`, `certifications-added.json`, thư mục `certificates/`. Đã làm mới thế hệ bộ nhớ trang chủ và chi tiết sản phẩm; không xóa phiên đăng nhập hoặc giỏ hàng. Không đổi cấu trúc bảng, không chạy kiểm thử luồng mua hàng.

Khởi động lại backend và frontend để nạp mã/cấu hình mới, tải lại trang. Kiểm tra danh mục rồi tự lập đơn mua, nhận hàng và duyệt phiếu với số lượng thực tế. Không có đơn cũ nên Dashboard chưa có doanh thu. Khi triển khai nơi khác cần nhập danh mục riêng; thay đổi database trong đợt này chỉ áp dụng database local nói trên.
