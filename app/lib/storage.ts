import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const IMAGE_DATA_URI = /^data:image\/(jpeg|jpg|png|webp|gif);base64,([A-Za-z0-9+/=]+)$/;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export class ImageError extends Error {}

/**
 * Stores a base64 image (data URI) and returns its public URL. Uses Cloudinary
 * when configured, otherwise writes to /public/uploads like /api/upload does.
 * Plain http(s) URLs are passed through unchanged.
 */
export async function saveImage(input: string, folder = "peanut"): Promise<string> {
  if (/^https?:\/\//.test(input) || input.startsWith("/uploads/")) return input;

  const match = IMAGE_DATA_URI.exec(input);
  if (!match) throw new ImageError("Only JPEG, PNG, WebP or GIF images are allowed");
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_IMAGE_BYTES) throw new ImageError("Image too large (max 10 MB)");

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    const { uploadToCloudinary } = await import("@/app/lib/cloudinary");
    const { url } = await uploadToCloudinary(input, folder);
    return url;
  }

  const ext = match[1] === "jpeg" ? "jpg" : match[1];
  const filename = `${randomUUID()}.${ext}`;
  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), buffer);
  return `/uploads/${filename}`;
}
