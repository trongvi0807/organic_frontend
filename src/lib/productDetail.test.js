import { describe, expect, it } from 'vitest';
import { productHref, productImages, reviewMedia, safeMediaUrl, sellableVariants, validateReviewFiles } from './productDetail';

describe('Product detail data and media', () => {
  it('uses public slugs and preserves a UUID fallback', () => {
    expect(productHref({ id: '123', slug: 'ca-rot-huu-co' })).toBe('/san-pham/ca-rot-huu-co');
    expect(productHref({ id: '123' })).toBe('/san-pham/id/123');
    expect(productHref({ id: '123', slug: 'x/y' })).toBe('/san-pham/x%2Fy');
  });
  it('orders primary images first, removes duplicates and unsafe URLs', () => {
    const images = productImages({ productName: 'Cà rốt', images: [{ imageUrl: 'javascript:alert(1)' }, { id: 'b', imageUrl: 'https://farm.example/side.jpg', sortOrder: 2 }, { id: 'a', imageUrl: 'https://farm.example/front.jpg', isPrimary: true, sortOrder: 9 }, { imageUrl: 'https://farm.example/side.jpg' }] });
    expect(images.map((i) => i.url)).toEqual(['https://farm.example/front.jpg', 'https://farm.example/side.jpg']);
    expect(productImages({ productName: 'Rau', imageUrl: '/images/vegetables.jpg' })[0].url).toBe('/images/vegetables.jpg');
    expect(productImages({ productName: 'Rau' })).toEqual([]);
    expect(safeMediaUrl('//third-party.example/image')).toBeNull();
    expect(safeMediaUrl('https://user:password@example.com/x')).toBeNull();
  });
  it('only offers active variants with a positive price and package quantity', () => {
    expect(sellableVariants({ variants: [{ id: 'big', status: 'active', sellingPrice: 90000, netQuantity: 1 }, { id: 'small', status: 'active', sellingPrice: 45000, netQuantity: .5 }, { id: 'inactive', status: 'inactive', sellingPrice: 10, netQuantity: 1 }, { id: 'empty', status: 'active', sellingPrice: 0, netQuantity: 1 }] }).map((v) => v.id)).toEqual(['small','big']);
  });
  it('reads existing review images and proposed video media without accepting executable URLs', () => {
    expect(reviewMedia({ images: [{ id: '1', imageUrl: 'https://farm.example/review.jpg' }] })[0].type).toBe('image');
    expect(reviewMedia({ media: [{ type: 'video', url: 'https://farm.example/clip.mp4' }, { type: 'image', url: 'data:image/svg+xml,evil' }] })).toHaveLength(1);
  });
  it('displays mediaType and imageUrl returned by the actual backend review DTO', () => {
    expect(reviewMedia({ media: [{ id: 'video-1', mediaType: 'video', imageUrl: 'https://farm.example/review.mp4', thumbnailUrl: 'https://farm.example/poster.jpg', altText: 'Trải nghiệm thực tế' }] }))
      .toEqual([{ id: 'video-1', type: 'video', url: 'https://farm.example/review.mp4', poster: 'https://farm.example/poster.jpg', alt: 'Trải nghiệm thực tế' }]);
  });
  it('supports the new private review DTO mediaUrl field', () => {
    expect(reviewMedia({ media: [{ id: 'm', mediaType: 'image', mediaUrl: '/images/proof.jpg' }] })[0].url).toBe('/images/proof.jpg');
  });
});

describe('Review draft attachments', () => {
  const photo = () => new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
  const video = () => new File(['video'], 'video.mp4', { type: 'video/mp4' });
  it('accepts 5 photos and one video', () => expect(() => validateReviewFiles([...Array.from({ length: 5 }, photo), video()])).not.toThrow());
  it('blocks unsupported/empty files and excessive attachment counts', () => {
    expect(() => validateReviewFiles([new File(['svg'], 'x.svg', { type: 'image/svg+xml' })])).toThrow('JPEG');
    expect(() => validateReviewFiles([new File([], 'x.jpg', { type: 'image/jpeg' })])).toThrow('rỗng');
    expect(() => validateReviewFiles(Array.from({ length: 6 }, photo))).toThrow('5 ảnh');
    expect(() => validateReviewFiles([video(), video()])).toThrow('1 video');
  });
  it('checks per-file and combined byte limits before creating preview URLs', () => {
    expect(() => validateReviewFiles([{ type: 'image/png', size: 5 * 1024 ** 2 + 1 }])).toThrow('5 MB');
    expect(() => validateReviewFiles([{ type: 'video/webm', size: 50 * 1024 ** 2 + 1 }])).toThrow('50 MB');
    expect(() => validateReviewFiles([...Array.from({length:5}, () => ({type:'image/png',size:5 * 1024 ** 2})), {type:'video/mp4',size:50 * 1024 ** 2}])).not.toThrow();
  });
});
