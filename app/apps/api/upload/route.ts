import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
const MAX_IMAGE_SIZE = 10  * 1024 * 1024; //  10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) ?? "peanut";

  if (!file)
    return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: "Invalid file type" }, { status: 415 });

  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize)
    return NextResponse.json(
      { error: `File too large (max ${isVideo ? "100" : "10"} MB)` },
      { status: 413 },
    );

  // ── Cloudinary (when credentials are present) ──────────────────────────────
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    try {
      const { v2: cloudinary } = await import("cloudinary");
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key:    process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      const buffer  = Buffer.from(await file.arrayBuffer());
      const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
      const result  = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: "auto",
        ...(isVideo ? {} : { transformation: [{ quality: "auto:good", fetch_format: "auto" }] }),
      });
      const mediaType = result.resource_type === "video" ? "video" : "image";
      return NextResponse.json({ url: result.secure_url, publicId: result.public_id, mediaType });
    } catch (err) {
      console.error("[upload] Cloudinary error:", err);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  }

  // ── Local fallback (no Cloudinary configured) ──────────────────────────────
  try {
    const ext      = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const uploadDir = join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({ url: `/uploads/${filename}`, publicId: filename, mediaType: isVideo ? "video" : "image" });
  } catch (err) {
    console.error("[upload] Local save error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
