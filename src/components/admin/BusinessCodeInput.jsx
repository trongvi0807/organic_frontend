import { useResource } from '@/hooks/useResource';
import { loadCodeSuggestion } from '@/services/admin/codeSuggestionService';
import { DEMO_MODE } from '@/services/api';
import { Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

/** The suggested number is display-only; an empty creation payload lets the server allocate it. */
export function BusinessCodeInput({ kind, value = '', existing = false, name, ...props }) {
  const suggestion = useResource(() => existing || DEMO_MODE ? Promise.resolve(null) : loadCodeSuggestion(kind), [kind, existing]);
  const displayed = existing || DEMO_MODE ? value : suggestion.loading || suggestion.error ? '' : suggestion.data?.code || '';
  return <>
    <Input {...props} readOnly autoComplete="off" name={existing ? name : undefined} value={displayed}
      placeholder={existing ? 'Chưa có mã' : suggestion.loading ? 'Đang lấy mã…' : 'Chưa lấy được mã'}
      aria-busy={!existing && suggestion.loading} />
    {!existing && name && <input type="hidden" name={name} value="" />}
    {!existing && suggestion.error && <div className="!mt-2 flex flex-wrap items-center gap-2 text-xs text-amber-800">
      <span role="status">{suggestion.error}</span><Button variant="ghost" size="sm" onClick={suggestion.reload}>Lấy lại mã</Button>
    </div>}
  </>;
}
