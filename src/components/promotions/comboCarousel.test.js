// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ComboCarousel } from './ComboCarousel';

let root, container;
const offers = [{ id: 'a', name: 'Rau xanh' }, { id: 'b', name: 'Bữa sáng' }];
const active = () => container.querySelector('.combo-carousel-slide.is-active').getAttribute('aria-label');
const render = async (list = offers) => act(async () => root.render(h(ComboCarousel, { offers: list },
  offer => h('label', {}, offer.name, h('input', { defaultValue: offer.id, 'aria-label': offer.name })))));

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); vi.restoreAllMocks();
});

it('advances every six seconds without controls, including when the feed ticks every second', async () => {
  await render(); expect(active()).toContain('Rau xanh');
  expect(container.querySelectorAll('button')).toHaveLength(0);
  await act(async () => vi.advanceTimersByTime(3000));
  await render(offers.map(offer => ({ ...offer })));
  await act(async () => vi.advanceTimersByTime(3000));
  expect(active()).toContain('Bữa sáng');
  await act(async () => vi.advanceTimersByTime(6000));
  expect(active()).toContain('Rau xanh');
});

it('advances on pointer entry and starts a fresh six-second interval', async () => {
  await render();
  await act(async () => vi.advanceTimersByTime(5500));
  await act(async () => container.querySelector('.combo-carousel').dispatchEvent(new MouseEvent('mouseover', { bubbles: true })));
  expect(active()).toContain('Bữa sáng');
  await act(async () => vi.advanceTimersByTime(500));
  expect(active()).toContain('Bữa sáng');
  await act(async () => vi.advanceTimersByTime(5500));
  expect(active()).toContain('Rau xanh');
});

it('pauses while a shopper edits and preserves their input across slides', async () => {
  await render();
  const input = container.querySelector('input'); input.value = 'Quy cách đã chọn';
  await act(async () => input.focus());
  await act(async () => vi.advanceTimersByTime(12000));
  expect(active()).toContain('Rau xanh');
  await act(async () => input.blur());
  await act(async () => vi.advanceTimersByTime(12000));
  expect(input.value).toBe('Quy cách đã chọn');
});

it('falls back to a remaining offer when the current one expires and keeps other slides inert', async () => {
  await render();
  expect(container.querySelector('[aria-hidden="true"]').hasAttribute('inert')).toBe(true);
  await render([offers[1]]); expect(active()).toContain('Bữa sáng');
});
