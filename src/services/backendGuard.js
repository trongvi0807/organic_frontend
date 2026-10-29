import { DEMO_MODE } from './api';
export function requireBackend() {
  if (DEMO_MODE) throw new Error('Chức năng này hiện chưa sẵn sàng. Vui lòng thử lại sau hoặc liên hệ người quản lý.');
}
