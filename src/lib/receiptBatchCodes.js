import { today } from './apiData';

const key = (value) => String(value ?? '').trim().toUpperCase();

// A readable suggestion for the existing batchCode field. Backend remains authoritative.
export function fillReceiptBatchCodes(items, batches = []) {
  const used = new Set([...batches.map((batch) => key(batch.batchCode)), ...items.map((item) => key(item.batchCode))].filter(Boolean));
  const day = today().split('-').reverse().join('');
  let changed = false;
  const next = items.map((item) => {
    if (Number(item.quantityReceived) <= 0 || key(item.batchCode)) return item;
    const sku = key(item.variant?.sku).replace(/[^A-Z0-9_-]/g, '').slice(0, 45) || 'HANG';
    let code;
    do { code = `LO-${day}-${sku}-${crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`; } while (used.has(code));
    used.add(code); changed = true;
    return { ...item, batchCode: code };
  });
  return changed ? next : items;
}
