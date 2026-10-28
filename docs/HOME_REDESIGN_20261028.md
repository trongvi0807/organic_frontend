# Trang chủ Mộc — cập nhật bố cục và chuyển động

Tham khảo ngày 28-10-2026:

- https://organicfood.vn/ — cách phân nhóm danh mục, hàng mới, các khối mua sắm và nội dung tìm hiểu.
- https://www.pukkaherbs.com/uk/en — hình ảnh thiên nhiên, cách kể chuyện thương hiệu và các vùng màu nhẹ. Trang dùng nhiều JavaScript; phần nội dung được đối chiếu thêm với trang Explore công khai của Pukka. Chuyển động mới được triển khai riêng theo hướng nhẹ nhàng, không sao chép mã hoặc tài sản thương hiệu.

## Thứ tự nội dung

1. Hero hai cột: thông điệp từ quản trị, ảnh lớn bo vòm, họa tiết lá, nút mua sắm và câu chuyện thương hiệu. Nhiều banner có nút chuyển và số thứ tự; không tự chạy để tránh làm gián đoạn thao tác.
2. Bốn lối tắt: nguồn gốc, chứng nhận, sản phẩm và theo dõi đơn.
3. Danh mục bằng hình ảnh thực tế từ sản phẩm tương ứng, có tên và số sản phẩm từ API.
4. Giá tốt: chỉ hiện khi có sản phẩm thực sự có compareAtPrice cao hơn minPrice. Không giả lập đếm ngược hoặc dữ liệu bán chạy.
5. Bộ sưu tập: nổi bật / hàng mới / có chứng nhận, lọc danh mục có tìm kiếm, dùng ProductCard hiện có. Giữ nguyên xem nhanh, yêu thích, thêm giỏ và hiển thị giá.
6. Hai banner danh mục nổi bật lấy từ danh mục có ảnh; đường dẫn tới danh mục thật.
7. Câu chuyện nguồn gốc, danh sách vùng/cơ sở từ API, các điểm nổi bật của cửa hàng.
8. Chứng nhận: giữ ảnh giấy chứng nhận trong từng thẻ, mở phóng to; ba hồ sơ DEMO-CERT vẫn ghi rõ Mẫu, không con dấu đỏ.
9. Góc tìm hiểu gồm ba nội dung dẫn tới các mục đã có; không giả bài blog, đánh giá khách hàng hoặc video.
10. FAQ từ dữ liệu quản trị; thông tin liên hệ và CTA mua sắm cuối trang. Địa chỉ/hotline dùng cấu hình đã được người dùng cung cấp.

## File chính

- `src/pages/client/HomePage.jsx`: ghép trang, dữ liệu từ HomeContext hiện có.
- `src/components/home/HomeHero.jsx`: banner và điều khiển chuyển ảnh.
- `src/components/home/HomeShopping.jsx`: danh mục, ưu đãi, bộ sưu tập, banner danh mục.
- `src/components/home/HomeEditorial.jsx`: nguồn gốc, điểm nổi bật, góc tìm hiểu, FAQ.
- `src/styles/home-page.css`: style chỉ nằm trong `.home-page`; không thay CSS của trang sản phẩm, admin hoặc logo.
- `src/components/products/ProductCard.jsx`: nhãn phần trăm giảm giá tính từ cùng giá bán/giá so sánh trong component dùng chung, để trang chủ và danh mục thống nhất. Không thay giá hoặc API.

## Hiệu ứng và responsive

- Dùng Reveal / IntersectionObserver hiện có cho fade-in và trượt lên khi cuộn. Không thêm thư viện animation.
- Hero vào nhẹ; ảnh danh mục/nội dung zoom khoảng 1.05, card nâng nhẹ và shadow mềm khi hover.
- `prefers-reduced-motion` tắt chuyển động. Chuyển banner giữ focus nút đang dùng; khu điều khiển tối thiểu 44px.
- Mobile: hero một cột, sản phẩm hai cột, danh mục hai cột; nội dung nguồn gốc và chứng nhận xuống một cột. Desktop sản phẩm bốn cột.
- Có skeleton tải trang, trạng thái tải lỗi/thử lại, bộ sưu tập trống; chỉ ảnh hero đặt ưu tiên tải cao, ảnh nội dung tải lazy.

## Dữ liệu và phạm vi

Không thay backend/API/SQL. Không dùng số thống kê, nhận xét, giao hàng miễn phí, thời hạn giao hoặc chứng nhận tự đặt. Các sản phẩm trùng giữa bộ sưu tập được khử trùng theo ID cho các vùng tổng hợp; ID không hiển thị thành mã nghiệp vụ trên giao diện.

Chỉ rà soát mã nguồn và đường dẫn. Không chạy build, test tự động, gọi API nghiệp vụ hoặc kiểm thử trình duyệt theo yêu cầu người dùng tự thực hiện kiểm thử.

### Người dùng tự kiểm tra

1. Mở trang chủ ở desktop và mobile; xem ảnh hero, danh mục, ảnh giấy chứng nhận và thứ tự nội dung.
2. Chuyển banner nếu có nhiều banner; thao tác bằng Tab/Enter và kiểm tra focus giữ nguyên.
3. Chuyển các bộ sưu tập/lọc danh mục; kiểm tra giá giảm đúng API, xem nhanh và thêm giỏ vẫn hoạt động.
4. Bấm danh mục, nguồn gốc, chứng nhận, theo dõi đơn và góc tìm hiểu; kiểm tra đúng trang/mục.
5. Kiểm tra nguồn dữ liệu không có ưu đãi/chứng nhận/FAQ; các khối không tạo thông tin giả. Thử giảm chuyển động trong cài đặt hệ điều hành.
