# Xử lý cảnh báo Google API key trong commit 05d9485

## Thay đổi repository

- Bỏ API key gán cứng trong `src/constants/firebase.js`; không còn fallback key thật.
- `.env.example` chỉ khai báo `VITE_FIREBASE_API_KEY=` rỗng. Đặt giá trị của môi trường trong `.env.local` (được Git ignore) hoặc cấu hình deploy/Docker runtime.
- Frontend và Firebase worker dùng chung resolver. Khi thiếu key, không khởi tạo Firebase Messaging; hộp thư thông báo trong ứng dụng vẫn hoạt động.
- Test hồi quy chặn việc đưa Google API key vào hai file trên.
- Cấu hình local cũ được giữ trong `.env.local` để không ngắt môi trường hiện tại; **việc này không đổi/thu hồi key trên Google Cloud**. Thay bằng key mới sau khi chủ dự án hoàn tất bước bên dưới. Không gửi key mới qua chat hoặc commit.

## Việc cần hoàn tất ở tài khoản Google Cloud của chủ dự án

1. Vào Google Cloud → APIs & Services → Credentials, chọn project `backend-organic`, xác định đúng Browser API key đang dùng. Kiểm tra API restrictions và thống kê sử dụng/quota xem có bất thường.
2. Tạo key thay thế dành riêng cho Firebase web, chỉ cho phép các Firebase API mà SDK đang dùng yêu cầu. Không gộp Gemini/Maps/API tính phí khác vào cùng public key. Áp dụng website/referrer restrictions phù hợp các origin deploy thực tế và kiểm tra Web Push sau cấu hình.
3. Cập nhật key mới trong `.env.local` của từng máy và biến môi trường triển khai. Khởi động lại Vite; nếu deploy build hoặc runtime config thì cập nhật đúng kiểu đang dùng. Kiểm tra đăng ký FCM và nhận thông báo ở frontend/worker.
4. Khi môi trường đã chuyển sang key mới, thu hồi/xóa key cũ trong Google Cloud. Kiểm tra lại các ứng dụng khác dùng cùng key để tránh gián đoạn.
5. Chỉ sau khi đã thu hồi thật, mở GitHub secret-scanning alert và đóng với lý do **Revoked**. Không đánh dấu Revoked khi mới xóa chuỗi khỏi code. Nếu chủ dự án xác minh đây là Firebase public key được giới hạn đúng và chọn giữ nó, cần ghi rõ căn cứ trong xử lý cảnh báo; lượt này chưa xác minh Google Cloud nên không tự đóng cảnh báo theo giả định đó.

## Giới hạn cần hiểu

Firebase web API key không phải Admin SDK private key; theo Firebase nó nhận diện project, còn quyền truy cập dữ liệu dựa vào IAM, Security Rules và App Check theo từng dịch vụ. Tuy nhiên key dùng chung cho API không phù hợp hoặc không được hạn chế vẫn có thể bị lạm dụng/quota.

Các biến `VITE_*` là cấu hình **phía trình duyệt**: giá trị có thể được đóng gói vào JavaScript hoặc runtime-config công khai. `.env.local` không biến key frontend thành bí mật phía server. Không đặt Cloudinary API secret, service-account JSON hoặc payment secrets trong các biến này.

Bản commit sửa tiếp theo chỉ làm sạch trạng thái mã nguồn hiện tại. Commit 05d9485 và key trong lịch sử GitHub vẫn tồn tại; xóa code mới không xóa bản sao đã công khai. Thu hồi/giới hạn key ở nhà cung cấp mới xử lý được việc dùng key cũ. Không rewrite/force-push lịch sử chia sẻ trong lượt này.

Docker Compose không tự đọc `.env.local` như Vite: dùng `docker compose --env-file .env.local up -d --build` hoặc cấp biến runtime của môi trường triển khai; bảo đảm file local có đủ các biến Compose cần. Đừng commit file cấu hình local có giá trị thật.

Nguồn chính thức:
- https://firebase.google.com/docs/projects/api-keys
- https://docs.cloud.google.com/docs/authentication/api-keys-best-practices
