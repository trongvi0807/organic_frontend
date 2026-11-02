# Cửa hàng: tồn kho, danh mục và sản phẩm yêu thích

## Thay đổi

- Trang chủ, danh sách/tìm kiếm sản phẩm và sản phẩm liên quan chỉ lấy sản phẩm có ít nhất một quy cách còn bán được.
- Hàng còn bán được là hàng đã duyệt nhập, còn hạn và còn ít nhất một đơn vị sau khi trừ hàng giữ cho các đơn khác. Chưa duyệt nhập không làm sản phẩm xuất hiện.
- Nếu quy cách rẻ nhất hết hàng, thẻ sản phẩm chọn quy cách còn hàng và hiển thị đúng giá của quy cách đó. Trang quản trị vẫn giữ đầy đủ sản phẩm.
- Lọc và đếm ở backend trước phân trang; không lấy một trang rồi bỏ bớt sản phẩm hết hàng ở frontend.
- Danh sách tự cập nhật nền khoảng 30 giây khi trang đang hiển thị, và khi quay lại cửa sổ. Không thêm nút tải lại số lượng.
- “Hôm nay, mình chọn gì?” hiển thị tối đa 8 danh mục có nhiều sản phẩm còn bán nhất, đếm từ dữ liệu thực thay vì chỉ đếm vài thẻ trên trang chủ.
- Bấm chữ “Sản phẩm” vào trang sản phẩm; nút mũi tên cạnh bên mở danh sách danh mục gốc. Bấm danh mục cha mới mở cấp tiếp theo. Vẫn dùng được bàn phím và giao diện di động.
- Các trang tài khoản, đơn hàng, điểm, đánh giá, phản hồi, đổi trả và yêu thích dùng thanh điều hướng chung, có biểu tượng và màu xanh cho mục đang chọn.
- Trang `/yeu-thich` có tìm kiếm tên/mã, phân trang, xem nhanh và bỏ lưu bằng trái tim. Có thể vào từ menu tài khoản.

## Lưu yêu thích

Dùng các lựa chọn trái tim đã có. Danh sách được lưu riêng cho từng tài khoản hoặc khách chưa đăng nhập trên **trình duyệt hiện tại**; có đồng bộ các tab cùng trình duyệt. Không có bảng yêu thích mới và chưa đồng bộ giữa các thiết bị. Các lựa chọn cũ được chuyển sang định dạng lưu mới một lần.

Chỉ lưu mã định danh nội bộ, không lưu giá hoặc thông tin sản phẩm giả. Tên, ảnh, giá được đọc lại từ dữ liệu sản phẩm công khai. Không hiển thị ID cho người dùng. Lỗi mạng không tự xóa lựa chọn.

Sản phẩm tạm hết hàng vẫn nằm trong trang yêu thích và không thể thêm vào giỏ, để khách không mất món đã lưu. Việc ẩn hết hàng áp dụng cho các danh sách bán hàng công khai. Nếu sản phẩm ngừng bán/không còn được công khai, trang yêu thích thông báo và cho phép bỏ lưu, không tự xóa.

## Kiểm tra thủ công

1. Chọn sản phẩm đang bán nhưng chưa có phiếu nhập đã duyệt: không hiện trên trang chủ/danh sách công khai; vẫn thấy trong Admin.
2. Nhập và duyệt phiếu có lô còn hạn, số lượng đủ một gói/hộp: sản phẩm xuất hiện sau lần cập nhật nền; không cần tải lại cả trang.
3. Đặt giữ hết số lượng: sản phẩm biến mất. Hủy đơn chưa thanh toán: số lượng giải phóng và sản phẩm xuất hiện lại.
4. Chỉ còn lô hết hạn hoặc hàng thu hồi chưa nhập lại: sản phẩm không hiện tại các danh sách bán hàng.
5. Một sản phẩm có 500g hết hàng, 1kg còn hàng: vẫn hiện với giá và quy cách 1kg.
6. Kiểm tra tổng sản phẩm, phân trang và lọc danh mục cha sau khi hết hàng; trang trống cuối danh sách tự quay về trang đầu.
7. Kiểm tra mục “Hôm nay, mình chọn gì?” không vượt 8 thẻ và thứ tự theo số sản phẩm giảm dần.
8. Bấm chữ “Sản phẩm”: vào trang sản phẩm. Bấm mũi tên: chỉ danh sách gốc xuất hiện. Di chuột/lấy focus không tự bung cấp con; bấm danh mục cha mới mở.
9. Lưu vài sản phẩm bằng trái tim, vào “Sản phẩm yêu thích”, tìm tên/mã, xem nhanh, bỏ lưu, tải lại trang để kiểm tra dữ liệu còn giữ.
10. Mở tab khác cùng tài khoản: lựa chọn cập nhật giữa các tab. Đăng xuất/đổi tài khoản: không hiển thị danh sách của tài khoản trước.
11. Khi mất kết nối, yêu thích vẫn được giữ; thử lại sau khi có mạng. Hàng hết vẫn giữ trong yêu thích để tìm lại.

Các thay đổi này không cần migration SQL. Cần khởi động backend mới và cập nhật frontend. Chỉ build/biên dịch; các thao tác nghiệp vụ ở trên dành cho người dùng kiểm tra thủ công.

Trang chủ mặc định mở “Sản phẩm còn hàng”, hiển thị tối đa 8 sản phẩm khác nhau từ các bộ sưu tập đã có. “Mộc chọn lọc” vẫn là tab riêng chỉ gồm sản phẩm được đánh dấu nổi bật. Không tự đánh dấu sản phẩm nổi bật hoặc thêm hàng vào kho để làm đầy giao diện.
