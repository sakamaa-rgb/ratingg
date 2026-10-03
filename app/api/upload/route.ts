import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "cover"; // 'video' | 'cover' | 'backdrop'

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    let subfolder = "covers";
    if (type === "video") subfolder = "videos";
    else if (type === "backdrop") subfolder = "backdrops";

    const timestamp = Date.now();
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .toLowerCase();
    const fileName = `${timestamp}_${sanitizedName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try saving to disk (works on localhost / local server)
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", subfolder);
      await fs.mkdir(uploadsDir, { recursive: true });
      const filePath = path.join(uploadsDir, fileName);
      await fs.writeFile(filePath, buffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/${subfolder}/${fileName}`,
        fileName,
        size: file.size,
        mimeType: file.type,
      });
    } catch {
      // Serverless (Vercel) Read-Only Fallback: Convert to Base64 Data URL so upload NEVER crashes
      const base64 = buffer.toString("base64");
      const mime = file.type || (type === "video" ? "video/mp4" : "image/jpeg");
      const dataUrl = `data:${mime};base64,${base64}`;

      return NextResponse.json({
        success: true,
        url: dataUrl,
        fileName,
        size: file.size,
        mimeType: file.type,
      });
    }
  } catch (err: any) {
    console.error("Upload handler error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal mengunggah file." },
      { status: 500 }
    );
  }
}
