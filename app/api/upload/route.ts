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

    // Determine upload directory inside public
    const uploadsDir = path.join(process.cwd(), "public", "uploads", subfolder);
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate safe unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .toLowerCase();
    const fileName = `${timestamp}_${sanitizedName}`;
    const filePath = path.join(uploadsDir, fileName);

    // Write file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${subfolder}/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      size: file.size,
      mimeType: file.type,
    });
  } catch (err: any) {
    console.error("Upload handler error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to save uploaded file." },
      { status: 500 }
    );
  }
}
