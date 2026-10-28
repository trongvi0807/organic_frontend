import { cn } from '@/lib/utils';

// Shared visual primitives follow the user's Golden Reference, without form inputs.
export function DottedField({ label, value, className = '' }) {
  return <div className={cn('print-dotted-field flex items-baseline text-[13px] leading-6', className)}>
    <span className="print-dotted-label mr-1.5 whitespace-nowrap text-gray-900">{label}</span>
    <span className="print-dotted-value min-h-[20px] min-w-0 flex-1 border-b border-dotted border-gray-600 px-2 font-medium text-gray-900">{value ?? ''}</span>
  </div>;
}

export function PrintCheckbox({ checked = false, label, className }) {
  return <div className={cn('print-checkbox flex items-center gap-2 py-0.5 text-[13px] text-gray-900', className)}>
    <span aria-hidden="true" className="print-checkbox-box inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center border border-[#1B4D2E] bg-white text-[11px] font-bold text-[#1B4D2E]">{checked ? '✓' : ''}</span>
    <span><span className="sr-only">{checked ? 'Đã chọn: ' : 'Chưa chọn: '}</span>{label}</span>
  </div>;
}

export function OrganicPrintLogo() {
  return <div className="print-form-brand flex flex-col items-center text-center">
    <svg className="print-form-brand-leaves" viewBox="0 0 64 48" fill="currentColor" aria-hidden="true">
      <path d="M32 40 C32 20 12 8 4 12 C4 28 16 40 32 40 Z" />
      <path d="M32 40 C32 16 48 4 60 8 C56 26 46 38 32 40 Z" opacity="0.85" />
    </svg>
    <strong>ORGANICFOOD.VN</strong><span>Healthy Food – Better Life</span>
  </div>;
}

export function DottedNotes({ value, lines = 2 }) {
  return <div className="print-dotted-notes">{Array.from({ length: Math.max(1, lines) }, (_, index) => <div key={index} className="print-note-line border-b border-dotted border-gray-600">{index === 0 ? value || '' : '\u00a0'}</div>)}</div>;
}
