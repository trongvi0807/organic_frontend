import { hasRole, loginPath } from './permissions';

// Preserve a payment return across reauthentication without accepting external redirects.
export function loginReturnPath(user, from) {
  if (hasRole(user, 'CUSTOMER') && typeof from === 'string' && /^\/payment\/(result|cancel)(\?|$)/.test(from)) {
    return from;
  }
  return loginPath(user);
}
