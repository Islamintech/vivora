// Unsigned client-side upload to Cloudinary. Configure these in .env.local:
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
//   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const cloudinaryConfigured = !!(CLOUD_NAME && UPLOAD_PRESET);

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
