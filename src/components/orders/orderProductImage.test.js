// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { OrderProductImage } from './OrderPrimitives';

let root, container;
const render = async (imageUrl) => act(async () => root.render(h(OrderProductImage, {
  item: { productName: 'Cà rốt hữu cơ', imageUrl },
})));

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

it('shows the actual image returned for the ordered product', async () => {
  await render('https://images.example.com/carrot.jpg');
  const image = container.querySelector('img');
  expect(image.getAttribute('src')).toBe('https://images.example.com/carrot.jpg');
  expect(image.alt).toBe('Cà rốt hữu cơ');
  expect(container.querySelector('svg')).toBeNull();
});

it('shows a newly supplied image after an earlier URL failed', async () => {
  await render('https://images.example.com/old.jpg');
  await act(async () => container.querySelector('img').dispatchEvent(new Event('error')));
  expect(container.textContent).toBe('Chưa có ảnh');
  await render('https://images.example.com/carrot.jpg');
  expect(container.querySelector('img').getAttribute('src')).toBe('https://images.example.com/carrot.jpg');
});

it('uses an honest empty state for missing or unsafe image URLs', async () => {
  for (const value of [null, '', 'javascript:alert(1)']) {
    await render(value);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toBe('Chưa có ảnh');
  }
});
