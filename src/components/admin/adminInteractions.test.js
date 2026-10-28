// @vitest-environment jsdom
import { act, createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminDateInput, AdminForm } from './AdminForm';
import { Field, Input, Select } from '@/components/ui/field';

let container, root;
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function render(element) { await act(async () => root.render(element)); }
async function click(element) { await act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true }))); }
async function type(input, value) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function submit() { await act(async () => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))); }
describe('Searchable select interaction', () => {
  function Fields({ onSubmit }) {
    return h(AdminForm, { onSubmit: (event) => { event.preventDefault(); onSubmit(Object.fromEntries(new FormData(event.currentTarget))); } }, h(Field, { label: 'Nhà cung cấp' }, h(Select, { name: 'supplierId', required: true, defaultValue: '', 'aria-label': 'Nhà cung cấp' }, h('option', { value: '' }, 'Chọn nhà cung cấp'), h('option', { value: 's1' }, 'Nông trại Đà Lạt'), h('option', { value: 's2' }, 'Trang trại Hà Nội'))));
  }
  it('opens on click, filters accent-free and submits the selected ID rather than its label', async () => {
    const saved = vi.fn(); await render(h(Fields, { onSubmit: saved }));
    const input = container.querySelector('[role="combobox"]');
    await click(input); expect(input.getAttribute('aria-expanded')).toBe('true');
    await type(input, 'da lat');
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(1);
    await click(container.querySelector('[role="option"] button'));
    expect(input.value).toBe('Nông trại Đà Lạt');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    await submit(); expect(saved).toHaveBeenCalledWith({ supplierId: 's1' });
    await click(input); expect(container.querySelector('[role="listbox"]')).toBeTruthy();
  });
  it('blocks required empty IDs even if the placeholder option has a nonempty label', async () => {
    const saved = vi.fn(); await render(h(Fields, { onSubmit: saved }));
    await submit(); expect(saved).not.toHaveBeenCalled(); expect(container.textContent).toContain('Vui lòng chọn');
  });
  it('blocks arbitrary typed text that was never selected', async () => {
    const saved = vi.fn(); await render(h(Fields, { onSubmit: saved }));
    const input = container.querySelector('[role="combobox"]');
    await type(input, 'Nhà cung cấp không tồn tại'); await submit();
    expect(saved).not.toHaveBeenCalled(); expect(container.textContent).toContain('danh sách gợi ý');
  });
  it('does not let Escape turn the required placeholder into a valid selected ID', async () => {
    const saved = vi.fn(); await render(h(Fields, { onSubmit: saved }));
    const input = container.querySelector('[role="combobox"]');
    await click(input); await type(input, 'không có');
    await act(async () => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    await submit(); expect(saved).not.toHaveBeenCalled();
  });
});
describe('Date picker and inline number errors', () => {
  it('opens a calendar on input click, selects a day and submits ISO while displaying dd-mm-yyyy', async () => {
    const saved = vi.fn();
    await render(h(AdminForm, { onSubmit: (event) => { event.preventDefault(); saved(Object.fromEntries(new FormData(event.currentTarget))); } }, h(Field, { label: 'Ngày giao' }, h(AdminDateInput, { name: 'expectedDeliveryDate', defaultValue: '2026-10-26' }))));
    const input = container.querySelector('input[type="text"]');
    await click(input); expect(container.querySelector('[role="dialog"]')).toBeTruthy();
    await click(container.querySelector('[aria-label="Ngày 27 tháng 10 năm 2026"]'));
    expect(input.value).toBe('27-10-2026'); expect(container.querySelector('[role="dialog"]')).toBeNull();
    await submit(); expect(saved).toHaveBeenCalledWith({ expectedDeliveryDate: '2026-10-27' });
  });
  it('immediately marks negative quantity and blocks submission until corrected', async () => {
    const saved = vi.fn();
    await render(h(AdminForm, { onSubmit: (event) => { event.preventDefault(); saved(); } }, h(Field, { label: 'Số lượng' }, h(Input, { name: 'quantity', type: 'number', min: 1, defaultValue: 1, required: true }))));
    const input = container.querySelector('input');
    await type(input, '-2'); expect(container.textContent).toContain('phải từ 1 trở lên'); expect(input.getAttribute('aria-invalid')).toBe('true');
    await submit(); expect(saved).not.toHaveBeenCalled();
    await type(input, '2'); await submit(); expect(saved).toHaveBeenCalledTimes(1); expect(input.getAttribute('aria-invalid')).toBe('false');
  });
  it('updates cross-date constraints when the start date changes', async () => {
    function Dates() {
      const [from, setFrom] = useState('2026-10-20');
      return h(AdminForm, {}, h(Field, { label: 'Từ ngày' }, h(AdminDateInput, { value: from, 'aria-label': 'Từ ngày', onChange: (event) => setFrom(event.target.value) })), h(Field, { label: 'Đến ngày' }, h(AdminDateInput, { defaultValue: '2026-10-21', min: from })));
    }
    await render(h(Dates)); await type(container.querySelector('[aria-label="Từ ngày"]'), '22-10-2026');
    expect(container.textContent).toContain('Ngày không được trước 22-10-2026');
  });
});
