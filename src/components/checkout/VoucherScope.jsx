export function VoucherScope({ voucher }) {
  const products = voucher.productNames || [], batches = voucher.batchCodes || [];
  if (!products.length && !batches.length) return null;
  return <details className="!mt-3 text-xs leading-6 text-stone-600">
    <summary className="cursor-pointer font-medium text-primary">Xem sản phẩm áp dụng</summary>
    <div className="!mt-2 max-h-36 overflow-y-auto rounded-lg bg-white p-3">
      {!!products.length && <><p className="font-medium">Sản phẩm</p><ul className="list-inside list-disc">{products.map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}</ul></>}
      {!!batches.length && <><p className="!mt-2 font-medium">Hoặc hàng thuộc các lô</p><ul className="list-inside list-disc">{batches.map((code) => <li key={code}>{code}</li>)}</ul></>}
    </div>
  </details>;
}
