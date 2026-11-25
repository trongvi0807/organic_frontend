# Combo và sản phẩm giảm giá trên trang chủ

- “Hôm nay, mình chọn gì?” chỉ giới thiệu danh mục hàng hóa. Danh mục cũ có tên/mã chứa `combo` được bỏ khỏi khu vực khám phá, không xóa sản phẩm hoặc thay đổi danh mục đã lưu.
- Banner lấy các chương trình `promotionType=combo` từ `/api/v1/home/promotions`. Mỗi lần hiển thị một combo; tự chuyển sau 4 giây, không có nút/chấm điều khiển bên dưới. Thời gian nằm ở prop `autoplayMs` của `ComboCarousel.jsx`.
- Banner tạm dừng khi di chuột vào, khi khách đang thao tác bên trong hoặc khi giỏ hàng đang cập nhật. Khi tiếp tục, bắt đầu lại chu kỳ 4 giây. Không tự chạy nếu hệ điều hành bật giảm chuyển động. Có thể vuốt ngang hoặc dùng phím mũi tên khi vùng banner được chọn.
- Nhấp một lần vào nội dung hoặc nền banner để chuyển combo tiếp theo; nhấp đúp để mở hộp chi tiết combo vừa nhấp. Nhấp một lần được chờ ngắn để phân biệt với nhấp đúp. Nút mua hàng, liên kết sản phẩm và ô chọn quy cách giữ thao tác riêng. Nhấn Enter khi vùng banner được chọn cũng mở chi tiết.
- Khi hộp chi tiết đang mở, banner tạm dừng. Hộp hiển thị sản phẩm, lựa chọn quy cách, giá và điều kiện hiện tại từ dữ liệu ưu đãi; thêm combo vẫn dùng luồng kiểm tra giỏ hàng hiện có.
- Các slide giữ nguyên quy cách đã chọn khi tự chuyển. Combo hết hạn bị loại theo thời gian từ máy chủ.
- “Chọn điều lành, thêm tiết kiệm” chỉ hiển thị tối đa 8 sản phẩm có giá bán nhỏ hơn giá gốc. Giá giảm có điều kiện mua đủ combo không được biến thành giá mua lẻ.
- Backend thêm `discountedProducts` vào `/api/v1/home` và hỗ trợ `/api/v1/home/products?section=discounted`. Dữ liệu chỉ gồm quy cách giảm giá còn có thể bán, không phụ thuộc việc sản phẩm có nằm trong danh sách mới/nổi bật hay không.
- Backend lọc danh mục combo trước khi giới hạn 8 danh mục. Các danh mục hàng hóa vẫn xếp theo số sản phẩm còn bán được.

Không thay đổi schema hoặc dữ liệu kinh doanh. Khởi động lại backend và tải lại frontend để nhận đầy đủ dữ liệu mới.

## Kiểm tra thủ công

1. Mở trang chủ, kiểm tra không còn danh mục combo trong “Hôm nay, mình chọn gì?”.
2. Nếu có ít nhất hai combo đang hiệu lực, quan sát banner tự chuyển sau mỗi 4 giây. Di chuột vào để tạm dừng, di chuột ra để tiếp tục. Không có cụm nút ở chân banner.
3. Chọn một quy cách: banner dừng khi đang thao tác; quay lại combo vẫn giữ lựa chọn.
   Nhấp vào nền banner một lần để chuyển combo, nhấp đúp để mở đúng combo mà không chuyển trước. Kiểm tra đóng hộp bằng nút Đóng hoặc Escape; thao tác mua hàng và chọn quy cách không làm chuyển slide.
4. Đối chiếu sản phẩm trong khu ưu đãi: có giá gốc gạch ngang và giá bán thấp hơn. Sản phẩm chỉ giảm khi mua đủ combo không tự xuất hiện như sản phẩm giảm giá mua lẻ.
5. Mở chi tiết sản phẩm: banner chỉ có các combo chứa sản phẩm đó, tiêu đề “Mua kèm để tiết kiệm hơn” dùng font thống nhất với giao diện.

Banner hiện giữ thứ tự từ API ưu đãi (chương trình mới trước). Thay đổi này chưa bổ sung xếp hạng combo theo doanh số Top-K.
