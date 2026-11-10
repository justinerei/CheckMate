export const MAX_PAGES = 10;
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const MAX_REQUEST_BYTES = MAX_PHOTO_BYTES + 128 * 1024;

export function validPageCount(value: string): number | null {
  if (!/^(?:[1-9]|10)$/.test(value)) return null;
  return Number(value);
}

export function validPageNumber(value: string, count: number): number | null {
  const page = validPageCount(value);
  return page !== null && page <= count ? page : null;
}

export function imageFormat(bytes: Uint8Array): "jpg" | "png" | null {
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= signature.length && signature.every((value, i) => bytes[i] === value)) return "png";
  return null;
}

export function privatePhotoPath(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png)$/.test(value);
}

export function pagesComplete(count: number | null, pages: number[]): boolean {
  return count !== null && count >= 1 && count <= MAX_PAGES && pages.length === count && Array.from({ length: count }, (_, i) => i + 1).every(page => pages.includes(page));
}
