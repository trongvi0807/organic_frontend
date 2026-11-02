# Chọn danh mục theo cấp và xem trước mã

## Menu loại sản phẩm

- Áp dụng cho ô **Loại sản phẩm** khi thêm/sửa sản phẩm và **Danh mục cha** khi thêm/sửa loại sản phẩm.
- Bấm danh mục cha để mở cột danh mục con. Chọn mục cuối để xác nhận.
- Muốn gắn trực tiếp vào danh mục cha: mở nhóm rồi bấm **Chọn [tên danh mục]**.
- Danh mục cha có lựa chọn **Không có (danh mục gốc)**.
- Tìm theo tên, mã hoặc đường dẫn danh mục. Hai danh mục khác ID không bị gộp chỉ vì trùng tên.
- Khi sửa danh mục, không hiển thị chính nó và các danh mục con của nó trong danh sách chọn cha.
- Danh mục tạm ẩn không được chọn mới; danh mục đã gắn với hồ sơ vẫn hiển thị khi mở lại.
- Trên màn hình nhỏ, xem lần lượt từng cấp và bấm mũi tên quay lại. Trên màn hình lớn, các cấp nằm cạnh nhau, cuộn ngang nếu có nhiều cấp.
- Hỗ trợ Tab, phím lên/xuống, phải/trái và Escape. Enter khi đang mở danh mục không gửi nhầm form.

## Mã dự kiến

Hiển thị mã từ backend ngay trong ô chỉ đọc cho sản phẩm, quy cách, loại sản phẩm, nhà cung cấp, xuất xứ và khách hàng. Không tạo hồ sơ hoặc giữ số chỉ vì mở form.

Mã được kiểm tra với dữ liệu hiện tại trước khi gợi ý. Hai người có thể nhìn thấy cùng mã dự kiến. Khi lưu, backend cấp số trong transaction, bỏ qua mã đã tồn tại; ràng buộc duy nhất của database vẫn là lớp kiểm tra cuối. Mã chính thức có thể khác mã dự kiến nếu người khác lưu trước.

Frontend không gửi mã xem trước như mã do người dùng yêu cầu. Tạo mới gửi mã trống để backend tự cấp; khi chỉnh sửa gửi mã đã lưu. Nếu không lấy được gợi ý, hiển thị lỗi và nút **Lấy lại mã**.

Các API GET mới, giữ đúng quyền hiện tại:

| URL sau `/api/v1` | Quyền |
|---|---|
| `/admin/products/next-code` | ADMIN, WAREHOUSE_STAFF |
| `/admin/products/next-variant-code` | ADMIN, WAREHOUSE_STAFF |
| `/admin/categories/next-code` | ADMIN, WAREHOUSE_STAFF |
| `/suppliers/next-code` | ADMIN, WAREHOUSE_STAFF |
| `/customers/next-code` | ADMIN, SALES_STAFF |

Response: `data.code`, `data.reserved=false`. Xuất xứ dùng API có sẵn `/origins/next-code` với `data.originCode`.

Khởi động lại backend bằng code mới để các API gợi ý hoạt động. Không cần thêm SQL cho lần thay đổi này; tận dụng bảng `business_code_counters` và các mã hiện có.

## Kiểm tra thủ công

1. Mở thêm sản phẩm: thấy mã dự kiến; mở Loại sản phẩm và đi theo cha → con, chọn con; tìm bằng mã/tên rồi chọn.
2. Mở sửa loại sản phẩm: không thấy chính loại đang sửa hoặc con của nó trong menu chọn cha.
3. Mở hai form thêm cùng loại trên hai tab: có thể thấy cùng gợi ý; lưu lần lượt phải có hai mã chính thức khác nhau.
4. Đóng form chưa lưu: không tạo bản ghi và không tiêu thụ số mã.
5. Mở lại hồ sơ đã lưu: mã giữ nguyên, danh mục đã chọn được hiển thị đúng nhánh.
6. Thử ở màn hình nhỏ: mở nhóm, chọn hoặc quay lại, không tràn ngang màn hình.

Đã kiểm tra build frontend và biên dịch backend với `-DskipTests test-compile`. Không chạy kiểm thử nghiệp vụ tự động.
