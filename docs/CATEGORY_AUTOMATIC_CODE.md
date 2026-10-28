# Mã loại sản phẩm và chống trùng

Cập nhật ngày 28-10-2026. Chưa chạy build, kiểm thử tự động, API hay thao tác database trong lần thay đổi này. Các bước kiểm tra bên dưới dành cho người dùng thực hiện thủ công.

## Hành vi giao diện

- Thêm loại sản phẩm tự điền mã `LSP01`, `LSP02`… theo số lớn nhất của dãy LSP trong toàn bộ danh mục, gồm cả danh mục tạm ẩn. Ví dụ đã có `LSP01`, `LSP03` thì mã tiếp theo là `LSP04`.
- Mã chỉ đọc; người dùng không nhập thủ công. Những mã cũ như `RAU_CU`, `TPCN` được giữ nguyên khi chỉnh sửa.
- Danh sách để kiểm tra được tải đầy đủ khi mở form và lấy lại ngay trước khi lưu; mã của hồ sơ mới được tính lại từ dữ liệu mới nhất lúc lưu. Không tự gửi lại POST khi có lỗi mạng/xung đột.
- Tên và mã trùng được báo bằng tiếng Việt; tên trùng khóa nút lưu. Sửa cùng hồ sơ không bị xem là trùng với chính nó.
- So tên sau chuẩn hóa Unicode NFC, gộp khoảng trắng, bỏ khoảng trắng đầu/cuối và không phân biệt chữ hoa/thường. Không bỏ dấu tiếng Việt. `Rau củ`, ` RAU   CỦ ` là một tên; tên ở danh mục cha khác hoặc trạng thái tạm ẩn vẫn bị xem là trùng.

## Backend và hợp đồng

Giữ nguyên `POST /api/v1/admin/categories` và `PUT /api/v1/admin/categories/{id}`. Body vẫn có `categoryCode`, `categoryName`, `description`, `status`, `parentId`. Frontend tự cấp mã rồi gửi theo hợp đồng hiện có; không thêm endpoint hoặc thay cấu trúc response.

`CategoryService` kiểm tra cả mã và tên trước khi tạo/sửa. Tên mới được lưu sau chuẩn hóa. Dữ liệu cũ được chuẩn hóa khi so sánh, không tự sửa hàng loạt các bản ghi cũ. Kiểm tra tính duy nhất áp dụng cả danh mục tạm ẩn.

Các giao dịch tạo/sửa dùng mức `SERIALIZABLE` trên PostgreSQL để ngăn hai giao dịch API cùng vượt qua kiểm tra trùng tại một thời điểm, kể cả khi danh sách rỗng. Ràng buộc unique mã đang có trong database được giữ lại. Nếu hai người thao tác đồng thời, một yêu cầu có thể trả HTTP 409; người dùng tải lại và thử lưu lại. Không tự lặp POST vì chưa thể suy luận một lần mất kết nối đã ghi dữ liệu hay chưa.

Kiểm tra tên được thực hiện ở luồng ghi qua `CategoryService`; các chương trình seed hoặc thao tác ghi trực tiếp SQL bên ngoài API vẫn phải tuân thủ quy tắc này. Không thêm unique constraint cho tên trong lần sửa này.

Thay đổi riêng cho loại sản phẩm không sửa entity/schema và không có migration SQL mới. Điều này không thay thế migration đã chuẩn bị cho luồng nhập nhiều đợt ở phần Đơn mua. Nếu chưa được phép thay đổi database, vẫn áp dụng giới hạn triển khai backend đã trao đổi trước đó.

## Checklist người dùng tự thực hiện

| Ca | Thao tác | Kết quả mong đợi | Thực tế |
|---|---|---|---|
| LP01 | Mở Thêm loại sản phẩm | Mã LSP được điền sẵn, không sửa được; tên/trạng thái/danh mục cha vẫn nhập được | Chưa chạy |
| LP02 | Tạo hai loại có tên mới | Hai mã khác nhau; danh sách hiển thị đúng tên và mã đã lưu | Chưa chạy |
| LP03 | Nhập tên đã tồn tại | Báo lỗi tại trường tên và chặn lưu | Chưa chạy |
| LP04 | Nhập lại tên cũ bằng chữ hoa và thêm khoảng trắng | Vẫn phát hiện trùng | Chưa chạy |
| LP05 | Dùng tên của danh mục đang tạm ẩn hoặc thuộc cha khác | Vẫn chặn trùng | Chưa chạy |
| LP06 | Sửa mô tả của hồ sơ đang có, giữ tên cũ | Lưu được; mã cũ giữ nguyên | Chưa chạy |
| LP07 | Đổi tên hồ sơ thành tên hồ sơ khác | Bị chặn; không ghi đè dữ liệu | Chưa chạy |
| LP08 | Tự gửi API với mã đã có, tên mới | Backend trả 409 | Chưa chạy |
| LP09 | Tự gửi API với mã mới, tên đã có | Backend trả 409 | Chưa chạy |
| LP10 | Hai cửa sổ cùng tạo một tên trước khi cửa sổ kia tải lại | Tối đa một bản ghi tên đó được tạo; yêu cầu còn lại báo trùng/xung đột | Chưa chạy |
| LP11 | Hai cửa sổ tạo hai tên khác nhau, cùng thấy một mã dự kiến | Nếu xung đột mã: tải lại/thử lưu lại để nhận mã khác; không tạo trùng mã | Chưa chạy |

Quyền thêm/sửa loại sản phẩm vẫn thuộc Admin. Với API thủ công, dùng token Admin và mã riêng cho ca kiểm tra; không gửi nhầm vào dữ liệu thực.
