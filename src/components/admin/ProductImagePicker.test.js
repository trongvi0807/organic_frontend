// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { it, expect, vi } from 'vitest';
import { ProductImagePicker, validateProductImage } from './ProductImagePicker';

it('requires an image on creation, previews the selection and releases its URL', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  URL.createObjectURL = vi.fn(() => 'blob:chosen-photo'); URL.revokeObjectURL = vi.fn();
  const host = document.createElement('div'), root = createRoot(host), onChange = vi.fn();
  try {
    await act(async () => root.render(h(ProductImagePicker, { onChange })));
    const input = host.querySelector('input[type=file]'); expect(input.required).toBe(true);
    const file = new File(['photo'], 'carrot.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
    expect(onChange).toHaveBeenCalledWith(file);
    await act(async () => root.render(h(ProductImagePicker, { file, onChange })));
    expect(host.querySelector('img').getAttribute('src')).toBe('blob:chosen-photo');
    expect(host.textContent).toContain('carrot.png');
    await act(async () => root.render(h(ProductImagePicker, { existingUrl: 'https://example.com/old.png', onChange })));
    expect(host.querySelector('input').required).toBe(false);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:chosen-photo');
  } finally { await act(async () => root.unmount()); }
});

it('rejects empty, unsupported and oversized images', () => {
  expect(validateProductImage(new File([], 'empty.png', { type: 'image/png' }))).toContain('chọn ảnh');
  expect(validateProductImage(new File(['svg'], 'x.svg', { type: 'image/svg+xml' }))).toContain('Chỉ hỗ trợ');
  expect(validateProductImage({ type: 'image/png', size: 5 * 1024 * 1024 + 1 })).toContain('5 MB');
  expect(validateProductImage({ type: 'image/webp', size: 1024 })).toBe('');
});
