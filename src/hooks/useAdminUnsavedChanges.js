import { useEffect } from 'react';

// Modal forms are discarded when navigating away; list/search filters are excluded.
export function useAdminUnsavedChanges(scope) {
  useEffect(() => {
    let dirtyForms = new WeakSet();
    const dirty = () => [...document.querySelectorAll('[role="dialog"] form')].some((form) => dirtyForms.has(form));
    const changed = (event) => {
      const form = event.target.closest?.('form');
      if (form?.closest('[role="dialog"]')) dirtyForms.add(form);
    };
    const navigate = (event) => {
      const link = event.target.closest?.('a[href]');
      if (!link || event.defaultPrevented || link.target === '_blank' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const target = new URL(link.href, window.location.href);
      if (target.href === window.location.href || !dirty()) return;
      if (!window.confirm('Bạn có thông tin chưa lưu. Rời trang và bỏ các thay đổi này?')) {
        event.preventDefault(); event.stopPropagation();
      } else dirtyForms = new WeakSet();
    };
    const unload = (event) => { if (dirty()) { event.preventDefault(); event.returnValue = ''; } };
    document.addEventListener('input', changed, true);
    document.addEventListener('change', changed, true);
    document.addEventListener('click', navigate, true);
    window.addEventListener('beforeunload', unload);
    return () => {
      document.removeEventListener('input', changed, true);
      document.removeEventListener('change', changed, true);
      document.removeEventListener('click', navigate, true);
      window.removeEventListener('beforeunload', unload);
    };
  }, [scope]);
}
