import { today } from './apiData';

// Internal shipment reference; a carrier-issued waybill may still replace it.
export function createShipmentCode(existing = [], day = today()) {
  const used = new Set(existing.map((item) => String(item.trackingCode || '').trim().toUpperCase()));
  const date = day.replaceAll('-', '');
  let code;
  do { code = `VC-${date}-${crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`; } while (used.has(code));
  return code;
}
