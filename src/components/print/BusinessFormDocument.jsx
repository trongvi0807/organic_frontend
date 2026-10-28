import { forwardRef } from 'react';
import PrintFormLayout, { DottedField, DottedNotes, PrintCheckbox, PrintFormSection, PrintFormTable, printDate, printNumber } from './PrintFormLayout';
import PurchaseRequisitionForm from './forms/PurchaseRequisitionForm';
import PurchaseOrderPrintForm from './forms/PurchaseOrderPrintForm';
import { businessForm } from '@/constants/businessForms';

function format(value, type) {
  if (value == null || value === '') return '';
  return type === 'date' ? printDate(value) : type === 'number' ? printNumber(value) : value;
}
function Fields({ items, data, columns = 1 }) {
  return <div className="print-schema-fields" style={{ '--field-columns': columns }}>{items.map((field) => <DottedField key={field.key} label={field.label} value={format(data[field.key], field.format)} />)}</div>;
}
function Block({ node, data, landscape = false }) {
  if (node.type === 'columns') return <div className="print-two-columns">{node.content.map((child, index) => <Block key={index} node={child} data={data} landscape={landscape} />)}</div>;
  if (node.type === 'section') return <PrintFormSection title={node.title} className={node.content.some((child) => child.type === 'table') ? 'print-table-section' : undefined}>{node.content.map((child, index) => <Block key={index} node={child} data={data} landscape={landscape} />)}</PrintFormSection>;
  if (node.type === 'fields') return <Fields {...node} data={data} />;
  if (node.type === 'notes') return <div>{node.label && <strong>{node.label}</strong>}<DottedNotes value={data[node.key]} lines={node.lines} /></div>;
  if (node.type === 'summary') return <div className="print-schema-summary"><Fields items={node.items} data={data} columns={Math.min(3, node.items.length)} /></div>;
  if (node.type === 'checks') return <div className="print-schema-checks" style={{ '--check-columns': node.columns }}>{node.options.map((option) => <PrintCheckbox key={option.value} checked={Array.isArray(data[node.key]) && data[node.key].includes(option.value)} label={option.label} />)}</div>;
  if (node.type === 'table') {
    const columns = node.columns.map((column) => ({ ...column,
      width: column.key === 'stt' ? '4%' : column.key === 'productCode' ? '8%' : column.key === 'productName' ? '20%' : column.key === 'unit' ? '6%' : undefined,
      render: column.key === 'stt' ? (_, rowIndex) => rowIndex + 1 : column.format ? (row) => format(row[column.key], column.format) : undefined,
    }));
    return <PrintFormTable columns={columns} rows={data[node.key] || []} minRows={node.minRows ?? (landscape ? 6 : 8)} />;
  }
  return null;
}

export const BusinessFormDocument = forwardRef(function BusinessFormDocument({ formId, data = {}, ...props }, ref) {
  const form = businessForm(formId);
  if (!form) return <p role="alert">Không tìm thấy biểu mẫu.</p>;
  if (formId === 'requisition') return <PurchaseRequisitionForm {...props} ref={ref} data={data} />;
  if (formId === 'purchase_order') return <PurchaseOrderPrintForm {...props} ref={ref} data={data} />;
  const signers = form.signatures.map((slot, index) => ({ ...slot, name: data.signers?.[index] }));
  return <PrintFormLayout {...props} ref={ref} title={form.title} formCode={form.code} orientation={form.orientation || 'portrait'} documentNumber={data.documentNumber} createdAt={data.createdAt} time={data.time} documentNumberLabel={form.numberLabel} createdAtLabel={form.dateLabel} signatures={signers} confirmationTitle="Xác nhận" footerDisclaimer={form.disclaimer} sheetClassName={`print-document-${form.id}`}>
    <div className="print-dense">{form.sections.map((node, index) => <Block key={index} node={node} data={data} landscape={form.orientation === 'landscape'} />)}</div>
  </PrintFormLayout>;
});
export default BusinessFormDocument;
