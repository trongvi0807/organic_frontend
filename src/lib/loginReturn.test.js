import { expect, it } from 'vitest';
import { loginReturnPath } from './loginReturn';

it('restores the complete signed payment URL after customer login', () => {
  const path = '/payment/result?vnp_TxnRef=abc&vnp_ResponseCode=00&vnp_SecureHash=signature';
  expect(loginReturnPath({ roles: ['CUSTOMER'] }, path)).toBe(path);
  expect(loginReturnPath({ roles: ['ROLE_CUSTOMER'] }, '/payment/cancel?paymentId=p')).toBe('/payment/cancel?paymentId=p');
});
it('rejects external redirects, unrelated paths and a customer return for staff', () => {
  const customer = { roles: ['CUSTOMER'] };
  for (const path of ['//evil.example/payment/result', 'https://evil.example', '/admin', '/payment/result-evil', null]) {
    expect(loginReturnPath(customer, path)).toBe('/');
  }
  expect(loginReturnPath({ roles: ['ADMIN'] }, '/payment/result?vnp_ResponseCode=00')).toBe('/admin/products');
});
