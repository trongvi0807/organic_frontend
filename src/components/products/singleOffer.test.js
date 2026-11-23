// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { SaleOfferNotice } from './SaleOptionPicker';
import { ProductDescription } from './ProductDescription';
import { DeliveryEstimate } from '@/components/orders/DeliveryEstimate';

let root, container;
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; container=document.createElement('div');document.body.append(container);root=createRoot(container); });
afterEach(async () => { await act(async () => root.unmount());container.remove(); });
it('shows one nearest expiry for ordinary stock and an exact expiry for campaigns, without date controls', async () => {
  const regular={variantId:'v',expiryDate:null,nearestExpiryDate:'2026-12-20',promotionId:null,availableQuantity:20};
  await act(async () => root.render(h(SaleOfferNotice,{choices:[regular],selected:regular})));
  expect(container.textContent).toContain('Hạn sử dụng: 20-12-2026');
  expect(container.textContent).not.toContain('gần nhất');
  expect(container.querySelectorAll('input, select, button')).toHaveLength(0);
  await act(async () => root.render(h(SaleOfferNotice,{choices:[regular],selected:{...regular,nearestExpiryDate:'2026-12-30'}})));
  expect(container.textContent).toContain('30-12-2026');expect(container.textContent).not.toContain('20-12-2026');
  const offer={...regular,expiryDate:'2026-12-20',promotionId:'offer'};
  await act(async () => root.render(h(SaleOfferNotice,{choices:[regular,offer],selected:offer})));
  expect(container.textContent).toContain('20-12-2026');expect(container.textContent).not.toContain('Chọn hạn sử dụng');
  expect(container.querySelector('input')).toBeNull();
});
it('formats actual product description sections and escapes markup rather than inventing brand claims', async () => {
  await act(async () => root.render(h(ProductDescription,{description:'**1. Giới thiệu sản phẩm**\nRau có lá xanh.\n**2. Bảo quản**\n<img src=x onerror=alert(1)>'})));
  expect(container.querySelectorAll('h3')).toHaveLength(2);expect(container.querySelector('img')).toBeNull();
  expect(container.textContent).toContain('Rau có lá xanh.');expect(container.textContent).not.toContain('chứng nhận');
});
it('keeps delivery time and distance while omitting the route-data sentence', async () => {
  await act(async () => root.render(h(DeliveryEstimate,{shipment:{status:'in_transit',estimateStatus:'estimated',estimatedArrivalAt:'2026-12-20T17:00:00',routeDistanceMeters:11000,routeDurationSeconds:1080}})));
  expect(container.textContent).not.toContain('Dữ liệu tuyến đường');
  expect(container.textContent).toContain('Dự kiến');
  expect(container.textContent).toContain('11 km');
});
