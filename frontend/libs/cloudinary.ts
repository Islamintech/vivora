// Unsigned client-side upload to Cloudinary. Configure these in .env.local:
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
//   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const cloudinaryConfigured = !!(CLOUD_NAME && UPLOAD_PRESET);

/**
 * Ask Cloudinary for a sensibly-sized copy of an image.
 *
 * Uploads store the original file, and a phone camera produces 3-6MB PNGs.
 * Served raw to a guest on restaurant wifi those either crawl or fail
 * outright - which is what filled the error log with "Image failed to load"
 * for images that were, in fact, returning HTTP 200 all along.
 *
 * The transform is part of the URL, so this fixes photos already uploaded
 * without re-uploading anything or touching the database. Measured on a real
 * 6,070,712-byte menu photo: 9,542 bytes at w_200 and 111,799 at w_800.
 *
 * - `f_auto` serves WebP/AVIF to browsers that take it
 * - `q_auto` picks a quality that still looks right
 * - `c_limit` only ever shrinks, so a small image is never blown up
 *
 * Anything that is not a Cloudinary delivery URL is returned untouched, so
 * menus still holding pasted image links keep working.
 */
export function sized(url: string | null | undefined, width: number): string | undefined {
  if (!url) return undefined;
  const marker = '/image/upload/';
  const at = url.indexOf(marker);
  if (!url.startsWith('https://res.cloudinary.com/') || at === -1) return url;

  const after = url.slice(at + marker.length);
  // Already transformed (an earlier save, or a hand-written URL): leave it be
  // rather than stacking a second set of options onto it.
  if (/^[a-z]{1,2}_[^/]+\//.test(after)) return url;

  return `${url.slice(0, at + marker.length)}f_auto,q_auto,c_limit,w_${width}/${after}`;
}

/** Uploads an image File to Cloudinary and returns its secure URL. */
export async function uploadImage(file: File): Promise<string> {
  if (!cloudinaryConfigured) {
    throw new Error('Cloudinary is not configured');
  }
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', UPLOAD_PRESET as string);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upload failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  return data.secure_url as string;
}
