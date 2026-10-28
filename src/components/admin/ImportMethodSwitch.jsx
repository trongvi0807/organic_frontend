import { FileSpreadsheet, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ImportMethodSwitch({ excel, onChange, disabled }) {
  return <div className="!mb-5 flex flex-wrap gap-2" role="group" aria-label="Cách lập chứng từ"><Button variant={excel ? 'outline' : 'default'} disabled={disabled} aria-pressed={!excel} onClick={() => onChange(false)}><PenLine size={16} />Nhập thủ công</Button><Button variant={excel ? 'default' : 'outline'} disabled={disabled} aria-pressed={excel} onClick={() => onChange(true)}><FileSpreadsheet size={16} />Nhập từ Excel</Button></div>;
}
