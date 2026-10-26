# Trang Điểm nổi bật

Trang mới `/diem-noi-bat`, component chính `src/pages/client/HighlightsPage.jsx`. Chạy frontend bằng `pnpm dev`, chọn “Điểm nổi bật” trên header/mobile menu hoặc footer. Mục này luôn hiển thị, kể cả khi Home chưa có dữ liệu `content.highlights`.

Trang chủ giữ khối highlights do Admin nhập và thêm liên kết sang trang riêng. Logo, giỏ hàng, footer và trang truy xuất hiện có được giữ nguyên; không cần thêm dependency hay biến môi trường mới.

## Bố cục

1. **Hero:** ảnh cánh đồng cục bộ, lớp phủ xanh, tiêu đề serif, nút khám phá và dải điều hướng 4 chủ đề.
2. **Tiêu chuẩn canh tác:** lưới 3 thẻ màu xanh nhạt/be/nâu gỗ, icon và sơ đồ hành trình tìm hiểu nguồn gốc. Các thẻ dẫn đến hồ sơ công khai tại trang Về cửa hàng.
3. **Chứng nhận:** thẻ tham khảo USDA Organic, EU Organic, VietGAP; bên dưới là danh sách hồ sơ do backend Home công bố, có tổ chức cấp, số hồ sơ, ngày hết hạn và số sản phẩm liên quan.
4. **Dinh dưỡng & hương vị:** ảnh rau củ, các gợi ý về bữa ăn đa dạng, đọc thành phần và chọn thực phẩm phù hợp; dẫn đến nguồn WHO.
5. **Bao bì:** minh họa SVG túi giấy/chai/hộp, ba nút “Giảm bớt / Dùng lại / Phân loại” thay đổi nội dung ngay trên trang, có `aria-pressed`, `aria-controls` và vùng thông báo. Dẫn đến nguồn EPA.
6. **CTA cuối:** mở danh mục hoặc trang nguồn gốc.

## Thành phần và chỉnh nội dung

```text
src/pages/client/HighlightsPage.jsx
src/components/highlights/
  HighlightHero.jsx
  StandardGrid.jsx
  CertificationSection.jsx
  HealthBenefits.jsx
  PackagingSection.jsx
  SectionHeading.jsx
src/constants/highlights.js
```

Các thẻ canh tác, liên kết nguồn và nội dung bao bì nằm trong `src/constants/highlights.js`. Ảnh dùng `public/images/farm.jpg` và `public/images/vegetables.jpg`, không cần tải ảnh bên ngoài. Minh họa bao bì dựng bằng SVG trong component, không phải ảnh chứng minh vật liệu đang được sử dụng thực tế.

Toàn bộ giao diện mới dùng Tailwind, tái sử dụng `Reveal`/IntersectionObserver của dự án cho fade-in/slide-up nhẹ, có tôn trọng `prefers-reduced-motion`. Anchor có khoảng tránh header; trang xử lý hash sau khi lazy-load để liên kết sâu mở đúng khu vực. Utility khoảng cách dùng tiền tố `!` tại những nơi cần vượt reset heading/paragraph không thuộc CSS layer của theme cũ.

## Dữ liệu và phạm vi nội dung

- Dùng HomeContext hiện có, không gọi thêm API khác. `/api/v1/home` trả `certifications`, endpoint công khai đã lọc hồ sơ hợp lệ. Frontend vẫn kiểm tra ngày hiện tại bằng helper chứng nhận đã có; không tự tạo số chứng nhận hoặc ngày hết hạn.
- Ba thẻ tên tiêu chuẩn là **tham khảo kiến thức**, dùng biểu tượng chung và ghi rõ phạm vi; không phải logo/chứng nhận Mộc đã đạt. VietGAP không được trình bày như tương đương chứng nhận hữu cơ.
- Tiêu chuẩn canh tác và bao bì được trình bày như định hướng lựa chọn/tìm hiểu. Không khẳng định toàn bộ hàng hóa “không hóa chất”, mọi bao bì đều phân hủy sinh học hoặc đã có chuỗi cung ứng khép kín khi chưa có hồ sơ xác nhận.
- Nội dung sức khỏe nói về sự đa dạng, cân bằng và lựa chọn phù hợp. Không thêm tỷ lệ dinh dưỡng, khẳng định hữu cơ vượt trội hơn mọi thực phẩm khác hoặc an toàn tuyệt đối cho mọi độ tuổi.
- API lỗi chỉ ảnh hưởng phần hồ sơ chứng nhận: thông báo tiếng Việt và nút Thử lại; banner, tiêu chuẩn, dinh dưỡng, bao bì vẫn sử dụng được. Chứng nhận trống có thông báo đang cập nhật.

## Nguồn nội dung được đối chiếu 22/10/2026

- [WHO — Healthy diet](https://www.who.int/en/news-room/fact-sheets/detail/healthy-diet): nguyên tắc bữa ăn đa dạng, cân bằng; nhu cầu khác nhau theo đặc điểm cá nhân.
- [USDA AMS — Labeling Organic Products](https://www.ams.usda.gov/rules-regulations/organic/labeling): nhận diện và phạm vi nhãn hữu cơ USDA.
- [European Commission — The organic logo](https://agriculture.ec.europa.eu/farming/organic-farming/organic-logo_en): mã cơ quan kiểm soát và nơi sản xuất nguyên liệu đi cùng nhãn EU.
- [VSQI — Tra cứu lĩnh vực nông nghiệp](https://tieuchuan.vsqi.gov.vn/tim-kiem?ic%5B%5D=65.020): danh mục VietGAP/thực hành nông nghiệp tốt hiện hành. Không đưa bản tiêu chuẩn 2017 đã bị rút vào làm căn cứ hiện tại.
- [US EPA — Plastic recycling and composting FAQ](https://www.epa.gov/trash-free-waters/frequently-asked-questions-about-plastic-recycling-and-composting): đọc nhãn tái chế/ủ phân, vật liệu compostable có thể cần điều kiện công nghiệp.

## Kiểm thử

- Bộ test hiện có: **57/57 đạt, 10 file**. Không thêm test chỉ sao chép nội dung/markup cho trang giới thiệu này; sử dụng lại helper hiệu lực chứng nhận đã được kiểm thử.
- Build production thành công, trang được lazy-load thành chunk riêng.
- QA trình duyệt cô lập trên Vite 5179 + fixture 19091: kiểm tra các phần nội dung, nguồn chứng nhận QA, điều hướng neo, thay đổi 3 nội dung bao bì bằng chuột/Enter, menu desktop/mobile và liên kết danh mục/nguồn gốc.
- Desktop 1440×1000; mobile 390×844, thêm vùng nội dung 320px: không tràn ngang (`scrollWidth=clientWidth`). Luồng bình thường không có warning/error console.
- Chủ động dừng fixture API: request Home qua Vite trả 500, phần hồ sơ hiện lỗi và Thử lại; các phần khác vẫn có mặt. Khởi động lại fixture và bấm Thử lại khôi phục chứng nhận QA. Lỗi tài nguyên trong pha này là tình huống chủ động kiểm tra, không phải kiểm thử console sạch.
- Vite demo riêng 5180 với Home không có `highlights`/chứng nhận: menu Điểm nổi bật vẫn hiện, chứng nhận có trạng thái trống, liên kết sâu `#chung-nhan` mở đúng phần nội dung.
- Các kiểm tra trình duyệt dùng fixture/demo, không được hiểu là đã xác nhận chứng nhận hay quy trình canh tác của cửa hàng thật. Không sửa backend hoặc database.

Ảnh tại `docs/screenshots/highlights/`: `desktop-hero.jpg`, `desktop-standards.jpg`, `desktop-packaging.jpg`, `mobile-hero.jpg`, `mobile-packaging.jpg`.
