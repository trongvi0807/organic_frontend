import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { exactAddress, prepareAddresses } from './address';
import { profileAddressPayload } from './profileAddress';
const data = prepareAddresses(JSON.parse(readFileSync('public/data/address/vietnam.json', 'utf8')));
const current = exactAddress(data, 'Phường Sài Gòn, Thành phố Hồ Chí Minh');
const selected = { provinceCode: current.provinceCode, wardCode: current.code, street: ' 36 Trịnh Đình Trọng ' };
describe('Three visible address fields with legacy API compatibility', () => {
  it('submits current province/ward/street and a real unambiguous historical district', () => {
    const body = profileAddressPayload({ receiverName: 'An', receiverPhone: '0344855913' }, selected, data);
    expect(body).toMatchObject({ receiverName: 'An', province: 'Thành phố Hồ Chí Minh', ward: 'Phường Sài Gòn', streetAddress: '36 Trịnh Đình Trọng', district: '1' });
    expect(body).not.toHaveProperty('provinceCode');
  });
  it('retains an existing historical district only when it belongs to the same resolved address', () => {
    const body = profileAddressPayload({}, selected, data, { province: 'Hồ Chí Minh', ward: 'Bến Nghé', district: 'Quận 1' });
    expect(body.district).toBe('Quận 1');
    const other = profileAddressPayload({}, selected, data, { province: 'Hà Nội', ward: 'Không khớp', district: 'Không giữ lại' });
    expect(other.district).toBe('1');
  });
  it('blocks ambiguous or unavailable mappings instead of fabricating district data', () => {
    for (const aliases of [[], [['A', '1'], ['B', '3']]]) {
      const fixture = { ...data, wards: data.wards.map((ward) => ward.code === current.code ? { ...ward, aliases } : ward) };
      expect(() => profileAddressPayload({}, selected, fixture)).toThrow('Backend cần cho phép địa chỉ hai cấp');
    }
  });
  it('rejects cross-province selection, blank street and excessively long street', () => {
    expect(() => profileAddressPayload({}, { ...selected, provinceCode: '01' }, data)).toThrow();
    expect(() => profileAddressPayload({}, { ...selected, street: ' ' }, data)).toThrow();
    expect(() => profileAddressPayload({}, { ...selected, street: 'x'.repeat(256) }, data)).toThrow('255');
  });
});
