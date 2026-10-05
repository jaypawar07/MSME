import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseInvoiceCSV, type ParsedInvoiceRow } from "@/lib/csv/invoice-csv-parser";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    // Fetch existing invoice numbers for this user for server-side verification
    const existingInvoices = await prisma.invoice.findMany({
      where: { userId },
      select: { invoiceNumber: true },
    });
    const existingSet = new Set(
      existingInvoices.map((i) => i.invoiceNumber.trim().toLowerCase())
    );

    let rowsToImport: ParsedInvoiceRow[] = [];

    if (body.csvText) {
      const parseResult = parseInvoiceCSV(
        body.csvText,
        existingInvoices.map((i) => i.invoiceNumber)
      );
      rowsToImport = parseResult.rows.filter((r) => r.isValid && !r.isDuplicate);
    } else if (Array.isArray(body.rows)) {
      // Filter valid rows and re-verify against database
      const seenBatch = new Set<string>();
      rowsToImport = body.rows.filter((r: ParsedInvoiceRow) => {
        const lower = r.invoiceNumber?.trim().toLowerCase();
        if (!lower || existingSet.has(lower) || seenBatch.has(lower) || !r.isValid) {
          return false;
        }
        seenBatch.add(lower);
        return true;
      });
    }

    if (rowsToImport.length === 0) {
      return NextResponse.json(
        { error: "No valid new invoices found to import. All rows are either duplicates or invalid." },
        { status: 400 }
      );
    }

    // Insert new invoices in a transaction / batch
    const createdInvoices = await prisma.$transaction(
      rowsToImport.map((row) =>
        prisma.invoice.create({
          data: {
            userId,
            buyerName: row.buyerName.trim(),
            buyerEmail: row.buyerEmail?.trim() || null,
            buyerPhone: row.buyerPhone?.trim() || null,
            buyerGstin: row.buyerGstin?.trim().toUpperCase() || null,
            invoiceNumber: row.invoiceNumber.trim(),
            amount: row.amount,
            invoiceDate: new Date(row.invoiceDate),
            paymentTermsDays: Math.min(Math.max(row.paymentTermsDays || 45, 1), 45),
            notes: row.notes?.trim() || "Imported via CSV",
            status: "PENDING",
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${createdInvoices.length} invoices into Settlr`,
      importedCount: createdInvoices.length,
      skippedDuplicates: (body.rows?.length || 0) - createdInvoices.length,
    });
  } catch (error: any) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import CSV invoices" },
      { status: 500 }
    );
  }
}
