import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { extractInvoiceDataFromImage } from "@/lib/ocr/invoice-ocr";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No invoice file uploaded" }, { status: 400 });
    }

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "application/pdf",
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file format. Please upload a JPG, PNG, WEBP, or PDF file." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save image to public/uploads/invoices
    const uploadDir = path.join(process.cwd(), "public", "uploads", "invoices");
    await mkdir(uploadDir, { recursive: true });

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${uniqueSuffix}-${originalName}`;
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);
    const photoUrl = `/uploads/invoices/${filename}`;

    // Perform LLM Vision OCR extraction
    const extractedData = await extractInvoiceDataFromImage(buffer, file.type, file.name);

    return NextResponse.json({
      success: true,
      message: "Invoice scanned successfully via Vision OCR",
      photoUrl,
      fileName: file.name,
      extractedData,
    });
  } catch (error: any) {
    console.error("OCR extraction error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process and extract data from invoice" },
      { status: 500 }
    );
  }
}
