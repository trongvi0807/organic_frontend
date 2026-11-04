# Bàn giao phiên bản 1.1.3 — 04/11/2026

Image frontend: `trongvi/organic-frontend:1.1.3` và `trongvi/organic-frontend:latest`.

Bao gồm các thay đổi hiện tại về nhận diện Organicfood.vn, banner combo, sản phẩm ưu đãi, footer và trang chính sách, thông báo phản hồi/đổi trả, lịch sử đơn mua, tài khoản nhân viên, đặt lại hàng và thời gian giao dự kiến.

## Kết quả kiểm tra trước khi push

- `pnpm build`: thành công.
- `pnpm test`: 640 ca, 597 đạt và 43 chưa đạt; 61 file đạt, 14 file chưa đạt. Chưa thể coi toàn bộ bộ kiểm thử đã đạt.
- Các ca chưa đạt có kiểm tra nhãn/menu cũ, hợp đồng Excel chưa khớp với context hiện tại, mock thông báo/tồn kho thiếu dữ liệu và môi trường Node thiếu `window`. Chưa sửa các ca đó trong lần đóng gói này.
- Docker build thành công. Image chạy trong container kiểm tra riêng, không nối database: `nginx -t`, `/health` và đường dẫn trực tiếp `/chinh-sach-doi-tra` đều đạt. Container kiểm tra đã dừng.
- Backend: `mvn -q -DskipTests package` thành công. Không chạy kiểm thử tích hợp trên database người dùng.
- Không tạo đơn hàng, phiếu nhập, hoàn tiền hoặc chạy migration trong lần đóng gói này. Các luồng nghiệp vụ cần người dùng kiểm tra thủ công.

## Máy khác sử dụng

```powershell
docker pull trongvi/organic-frontend:1.1.3
```

Chạy image theo cấu hình mạng/upstream trong README. Frontend dùng `/api/v1`; `BACKEND_URL` phải trỏ tới backend của máy đang chạy, không phải backend của người đóng gói.

Backend và database cần được cập nhật cùng phiên bản. Xem [hướng dẫn cập nhật PostgreSQL Docker](https://github.com/trongvi0807/organic_backend_version1.1/blob/main/docs/UPDATE_DATABASE_20261104.md). Pull code/image không sao chép database hoặc các key riêng của máy khác.
