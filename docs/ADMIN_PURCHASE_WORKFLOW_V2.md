# Cập nhật Admin: mã tự động, Excel và quy trình giao nhiều đợt

Ngày 28-10-2026, người dùng cho phép bổ sung backend cho **nhập nhiều đợt và Đóng đơn mua**. Những phần khác tiếp tục dùng API hiện có. Toàn bộ kiểm thử chức năng do người dùng thực hiện thủ công.

## Chức năng đã chạy theo API hiện có

### Mã nhà cung cấp và sản phẩm

- Nhà cung cấp mới: `NCC01`, `NCC02`… Sản phẩm mới: `SP01`, `SP02`… Mã được lấy theo số lớn nhất đang có, không tái sử dụng khoảng trống.
- Sản phẩm vẫn chọn danh mục trước khi cấp mã. Mã được đọc lại ngay trước khi lưu để giảm xung đột; mã cũ không bị đổi. Nếu hai phiên tạo đồng thời, ràng buộc duy nhất của backend vẫn là nơi quyết định cuối cùng.
- Nút Quy ước sản phẩm cho phép đổi tiền tố, đơn vị và trọng lượng mặc định trên trình duyệt hiện tại. Thiết lập cũ về đơn vị được giữ khi chuyển sang mẫu mã mới.
- Form Nhà cung cấp đã bổ sung lại người đại diện/liên hệ, điện thoại và email theo yêu cầu mới. Các trường này không bắt buộc; nhập/sửa sẽ lưu đúng thông tin đang hiển thị. Chi tiết đơn mua hiển thị riêng người đại diện, điện thoại và email.

### Quan hệ xuất xứ

`Sản phẩm → Xuất xứ/vùng hoặc cơ sở sản xuất → Nhà cung cấp`.

Xuất xứ là một hồ sơ riêng. Trường `supplierId` trên Xuất xứ chỉ nhà cung cấp sở hữu/liên kết vùng đó. Khi tạo sản phẩm, người dùng chọn nhà cung cấp trước, sau đó chỉ chọn được xuất xứ thuộc nhà cung cấp ấy. Frontend lưu `originId` qua API truy xuất hiện có. Không tự thêm `supplierId` vào DTO sản phẩm.

### Nhập Excel (đã cập nhật theo API backend mới)

- Dùng luồng tải mẫu → preview → import trực tiếp qua backend cho **Sản phẩm, Đơn mua, Phiếu nhập**.
- Vào **Đơn mua → Lập đơn mua → Nhập từ Excel** để tải mẫu có danh sách nhà cung cấp và SKU hiện tại, kiểm tra file rồi tạo đơn chờ duyệt.
- Mẫu lấy từ backend, nhập sheet `Data`. Mẫu `SanPham` và cách nhập từng dòng qua CRUD trước đây đã được thay trong giao diện.
- Mỗi file được lưu trong một transaction, có Idempotency-Key để thử lại mà không tạo trùng khi mất phản hồi.
- Hướng dẫn, giới hạn, input/output và rà soát các API mới: [BACKEND_API_UPDATE_20261027.md](BACKEND_API_UPDATE_20261027.md).

### Select, lịch và báo lỗi

- Component `Select` dùng chung đã chuyển thành combobox có gõ tìm không dấu, mở danh sách khi click, hỗ trợ bàn phím. Giá trị gửi vẫn là ID/mã gốc qua FormData.
- Các select trực tiếp ở cửa hàng cũng đã chuyển sang component chung.
- Ô ngày mở lịch khi click, chọn tháng/năm bằng tìm kiếm; vẫn cho gõ `dd-mm-yyyy`. Các trường có giờ dùng `dd-mm-yyyy HH:mm`, payload giữ ISO theo API.
- Nhập số âm được đánh dấu lỗi ngay khi nhập. Form Admin chặn gửi khi còn lỗi; không tự làm tròn hay đổi số âm thành 0.
- Duyệt/từ chối thành công sẽ đóng hộp xác nhận và hộp chi tiết chứng từ. Khi API lỗi, giữ hộp thoại và thông báo lỗi để người dùng kiểm tra.

### Đơn mua và quy đổi đơn vị

- Ngày giao dự kiến đã có ở form Đơn mua, lưu qua `expectedDeliveryDate`; hiển thị lại khi lập Phiếu nhập và trong chi tiết Đơn mua.
- Dòng nhập nhanh có lựa chọn theo gói/hộp hoặc theo thùng. Khi nhập thùng, khai báo số gói/hộp trong một thùng, ví dụ 3 thùng × 24 gói = 72 gói.
- **Giá nhập là giá cho một gói/hộp cơ sở**, không phải giá cả thùng. API nhận `quantity = 72` và `unitPrice` của một gói. Do đó không có sai số chia giá thùng hoặc tự nhân giá hai lần.
- Thông tin quy đổi được ghi trong ghi chú Đơn mua. Hệ số chưa được lưu thành dữ liệu quy đổi dùng chung vì backend chưa có trường/API tương ứng. Khi sửa Đơn mua cũ, số lượng trong bảng là số gói cơ sở do backend trả về.
- Kho quản lý theo SKU gói/hộp và hiển thị trọng lượng riêng. Nháp/chờ duyệt chưa tăng tồn; chỉ số đạt trên Phiếu nhập đã duyệt được cộng, đúng nghiệp vụ backend hiện có.

## Luồng giao nhiều đợt và đóng phần thiếu

Yêu cầu: một Đơn mua nhận nhiều Phiếu nhập. Đợt đầu thiếu chuyển Đơn mua sang **Giao hàng một phần**. Khi nhà cung cấp giao tiếp, tạo phiếu mới trên đơn cũ. Khi không giao phần thiếu, chọn **Đóng đơn** kèm lý do. Giá trị thực nhận được tính theo các phiếu đã duyệt.

Backend đã đổi quan hệ Đơn mua – Phiếu nhập sang một-nhiều. Database cũ cần áp dụng thủ công `organic_backend/scripts/sql/20261028_purchase_order_partial_receipts.sql` trước khi khởi động backend mới. Chi tiết hợp đồng và các bước triển khai nằm trong `organic_backend/docs/PURCHASE_PARTIAL_RECEIPTS.md`.

### Giao diện đã chuẩn bị

- Chi tiết Đơn mua có phần Các đợt giao hàng, danh sách phiếu, số đặt, số nhận đạt, số thiếu và giá trị hàng đã duyệt nhập.
- Chỉ cộng `quantityReceived` từ phiếu `confirmed` đúng Đơn mua. Phiếu nháp/chờ duyệt/từ chối không được tính vào hàng đã nhận. Tiền hàng thực nhận lấy từ `acceptedTotalAmount`, không tự tính lại thuế/phí hoặc giả làm trạng thái thanh toán kế toán.
- Danh sách trạng thái có nhãn `partially_received` và `closed` để trình bày khi backend trả về. Frontend không tự ghi các trạng thái này.
- Phiếu mới được lập từ Đơn mua `approved` hoặc `partially_received` còn lượng có thể nhận. Dòng đã đủ ghi 0/0. Khi sửa phiếu, frontend truyền `receiptId` để không trừ phần giữ chỗ của chính phiếu đó.
- Nút tạo phiếu đợt tiếp theo gọi cùng API lập phiếu. Số đã nhập trước, số cần nhận đợt này và chênh lệch hiển thị riêng; biểu mẫu dùng snapshot của đợt nhập.
- Hộp Đóng đơn gọi `POST /purchase-orders/{id}/close` với lý do bắt buộc. Chọn “Khác” phải nhập nội dung. Modal tự đóng và dữ liệu được tải lại khi thành công.
- Có thể hủy phiếu `draft`, `pending_approval`, `rejected` bằng `POST /goods-receipts/{id}/cancel` kèm lý do. Phải xử lý hoặc hủy hết phiếu mở trước khi đóng đơn. Phiếu đã duyệt không hủy bằng thao tác này.

### Hợp đồng và phần cần bổ sung tiếp

Quan hệ nhiều phiếu, số lượng lũy kế, chống vượt số đặt, trạng thái một phần, đóng PO và hủy phiếu đã được bổ sung theo tài liệu backend kể trên. Các đề xuất về kế toán, lịch sử duyệt đầy đủ, quy đổi dùng chung và mã tuần tự dưới đây vẫn cần nghiệp vụ/API riêng.

| Phần | Thay đổi cần thiết |
|---|---|
| Kế toán | Trả giá trị thực nhận theo phiếu đã duyệt, giá trị còn thiếu, thuế/phí được phân bổ và công nợ cần thanh toán; không lấy tổng đặt ban đầu làm giá trị thanh toán sau khi đóng thiếu. |
| Lịch sử | Trả các phiếu/đợt và lịch sử trạng thái/quyết định/đóng đơn có người thực hiện và timestamp. |
| Quy đổi dùng chung | Bổ sung quy tắc theo SKU: đơn vị mua, đơn vị kho, hệ số và hiệu lực; lưu snapshot trên dòng PO/receipt. Nếu cần nhập giá cả thùng, quy định làm tròn và phân bổ tiền ở backend. |
| Mã tuần tự | Cấp/reserve mã SP/NCC ở server bằng sequence/transaction để bảo đảm không trùng khi nhiều người tạo đồng thời; giữ unique constraint mã và chuẩn hóa tên. |

## Kiểm tra trước khi bàn giao

Trong lần cập nhật nhiều đợt/đóng đơn này chưa chạy kiểm thử, build, API hoặc SQL. Người dùng tự chạy migration và các kịch bản trong [hướng dẫn thủ công](../outputs/admin-test-flow-20261028/HUONG_DAN_TEST_THU_CONG.md). Luồng import trên giao diện không tải ExcelJS vào bundle.
