import { DEMO_MODE } from './api';
export function requireBackend() {
  if (DEMO_MODE) throw new Error('Chức năng này dùng API thật. Đặt VITE_DEMO_MODE=false và chạy backend để sử dụng.');
}
