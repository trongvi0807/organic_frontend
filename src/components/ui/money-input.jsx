import { Input } from './field';
import { numberInputDisplay, numberInputValue } from '@/lib/purchaseDocuments';

/** Format for display only; keep the ungrouped decimal value for API payloads. */
export function MoneyInput({ value, onChange, ...props }) {
  return <Input {...props} type="text" inputMode="decimal" value={numberInputDisplay(value)} onChange={(event) => {
    const next = numberInputValue(event.target.value, 2);
    if (next !== null) onChange(next);
  }} />;
}
