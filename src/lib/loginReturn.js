import { hasRole, loginPath } from './permissions';

// Preserve protected customer workflows without accepting external redirects.
export function loginReturnPath(user, from) {
  if (hasRole(user, 'CUSTOMER') && typeof from === 'string' && !/[\\\s]/.test(from)
    && /^\/(?:payment\/(?:result|cancel)|phan-hoi|doi-tra|don-hang(?:\/[^/?#]+)?|tai-khoan|danh-gia-cua-toi|diem-thuong)(?:\?|$)/.test(from)) {
    return from;
  }
  return loginPath(user);
}
