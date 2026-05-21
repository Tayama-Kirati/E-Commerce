import { v2 as cloudinary } from "cloudinary";
 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});
 
export async function uploadToCloudinary(
  base64: string,
  folder  = "peanut/products",
  options: Record<string, unknown> = {}
) {
  const result = await cloudinary.uploader.upload(base64, {
    folder,
    transformation: [
      { width: 1200, height: 1200, crop: "limit" },
      { quality: "auto:good", fetch_format: "auto" },
    ],
    ...options,
  });
  return { url: result.secure_url, publicId: result.public_id };
}
 
export async function deleteFromCloudinary(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}
 
// Generate signed upload URL for direct browser uploads
export function generateUploadSignature(folder = "peanut/products") {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const params = { timestamp, folder, upload_preset: "peanut_products" };
  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );
  return { signature, timestamp, cloudName: process.env.CLOUDINARY_CLOUD_NAME };
}
 