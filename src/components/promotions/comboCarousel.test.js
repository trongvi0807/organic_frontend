// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ComboCarousel } from './ComboCarousel';

let root, container;
const offers = [{ id: 'a', name: 'Rau xanh' }, { id: 'b', name: 'Bữa sáng' }];
const active = () => container.querySelector('.combo-carousel-slide.is-active').getAttribute('aria-label');
const render = async (list = offers, props = {}) => act(async () => root.render(h(ComboCarousel, { offers: list, ...props },
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

it('advances every four seconds without controls, including when the feed refreshes', async () => {
  await render(); expect(active()).toContain('Rau xanh');
  expect(container.querySelectorAll('button')).toHaveLength(0);
  await act(async () => vi.advanceTimersByTime(2000));
  await render(offers.map(offer => ({ ...offer })));
  await act(async () => vi.advanceTimersByTime(1999));
  expect(active()).toContain('Rau xanh');
  await act(async () => vi.advanceTimersByTime(1));
  expect(active()).toContain('Bữa sáng');
  await act(async () => vi.advanceTimersByTime(4000));
  expect(active()).toContain('Rau xanh');
});

it('pauses while hovered and resumes with a fresh four-second interval', async () => {
  await render();
  await act(async () => vi.advanceTimersByTime(3500));
  await act(async () => container.querySelector('.combo-carousel').dispatchEvent(new MouseEvent('mouseover', { bubbles: true })));
  await act(async () => vi.advanceTimersByTime(8000));
  expect(active()).toContain('Rau xanh');
  await act(async () => container.querySelector('.combo-carousel').dispatchEvent(new MouseEvent('mouseout', { bubbles: true })));
  await act(async () => vi.advanceTimersByTime(3999));
  expect(active()).toContain('Rau xanh');
  await act(async () => vi.advanceTimersByTime(1));
  expect(active()).toContain('Bữa sáng');
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

it('advances once after a single background click', async () => {
  await render();
  await act(async () => container.querySelector('.combo-carousel-track').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })));
  await act(async () => vi.advanceTimersByTime(499));
  expect(active()).toContain('Rau xanh');
  await act(async () => vi.advanceTimersByTime(1));
  expect(active()).toContain('Bữa sáng');
});

it('opens the clicked combo on double click without advancing to the next combo', async () => {
  const onView = vi.fn();
  await render(offers, { onView });
  const banner = container.querySelector('.combo-carousel-track');
  await act(async () => banner.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })));
  await act(async () => vi.advanceTimersByTime(200));
  await act(async () => {
    banner.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 2 }));
    banner.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, detail: 2 }));
  });
  await act(async () => vi.advanceTimersByTime(1000));
  expect(onView).toHaveBeenCalledExactlyOnceWith(offers[0]);
  expect(active()).toContain('Rau xanh');
});

it('cancels a pending advance when a shopper starts using a field', async () => {
  const onView = vi.fn();
  await render(offers, { onView });
  await act(async () => container.querySelector('.combo-carousel-track').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })));
  await act(async () => vi.advanceTimersByTime(100));
  await act(async () => container.querySelector('input').click());
  await act(async () => vi.advanceTimersByTime(500));
  expect(active()).toContain('Rau xanh');
  expect(onView).not.toHaveBeenCalled();
});

it('supports Enter to view a combo without intercepting child links or buttons', async () => {
  const onView = vi.fn(), buy = vi.fn();
  await act(async () => root.render(h(ComboCarousel, { offers, onView },
    offer => h('div', {}, h('a', { href: '#product' }, offer.name), h('button', { onClick: buy }, 'Mua')))));
  await act(async () => {
    container.querySelector('a').dispatchEvent(new MouseEvent('dblclick', { bubbles: true, detail: 2 }));
    container.querySelector('button').click();
    container.querySelector('button').dispatchEvent(new MouseEvent('dblclick', { bubbles: true, detail: 2 }));
  });
  await act(async () => vi.advanceTimersByTime(500));
  expect(buy).toHaveBeenCalledTimes(1);
  expect(onView).not.toHaveBeenCalled();
  expect(active()).toContain('Rau xanh');
  await act(async () => container.querySelector('.combo-carousel').dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })));
  expect(onView).toHaveBeenCalledExactlyOnceWith(offers[0]);
});

it('cancels pending clicks when offers change or the carousel becomes busy', async () => {
  await render();
  await act(async () => container.querySelector('.combo-carousel-track').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })));
  await render([offers[1]]);
  await act(async () => vi.advanceTimersByTime(500));
  expect(active()).toContain('Bữa sáng');
  await render(offers);
  await act(async () => container.querySelector('.combo-carousel-track').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })));
  await render(offers, { busy: true });
  await act(async () => vi.advanceTimersByTime(500));
  expect(active()).toContain('Rau xanh');
});
