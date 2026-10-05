import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseGSTRCsv, reconcileInvoicesWithGSTR } from "@/lib/gst/gst-reconciler";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { csvContent } = body;

    if (!csvContent || typeof csvContent !== "string") {
      return NextResponse.json({ error: "No GSTR CSV content provided" }, { status: 400 });
    }

    // Fetch user invoices
    const systemInvoices = await prisma.invoice.findMany({
      where: { userId },
      select: {
        invoiceNumber: true,
        buyerName: true,
        buyerGstin: true,
        amount: true,
        invoiceDate: true,
      },
    });

    const parsedGstr = parseGSTRCsv(csvContent);
    const reconciliation = reconcileInvoicesWithGSTR(systemInvoices, parsedGstr);

    return NextResponse.json({
      success: true,
      reconciliation,
    });
  } catch (error: any) {
    console.error("GST reconciliation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reconcile GST records" },
      { status: 500 }
    );
  }
}
