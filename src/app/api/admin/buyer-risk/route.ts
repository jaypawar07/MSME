import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aggregateBuyerPaymentRisk } from "@/lib/analytics/buyer-risk-aggregator";

// Per-user data: never prerender at build time.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pooled buyer risk scores are shared across suppliers, but raw invoice
    // numbers belonging to other tenants are only visible to admins.
    const userId = (session.user as any).id as string;
    const isAdmin = (session.user as any).role === "ADMIN";
    const url = new URL(req.url);
    const search = url.searchParams.get("q")?.toLowerCase();
    const sortBy = url.searchParams.get("sortBy") || "overdue"; // overdue, risk, lateRate, invoices

    // Fetch all invoices across all users
    const allInvoices = await prisma.invoice.findMany({
      select: {
        id: true,
        userId: true,
        buyerName: true,
        buyerGstin: true,
        invoiceNumber: true,
        amount: true,
        invoiceDate: true,
        paymentTermsDays: true,
        status: true,
      },
    });

    const dataset = aggregateBuyerPaymentRisk(allInvoices);

    let buyers = dataset.buyers;
    if (!isAdmin) {
      const ownInvoiceNumbers = new Set(
        allInvoices.filter((inv) => inv.userId === userId).map((inv) => inv.invoiceNumber)
      );
      buyers = buyers.map((b) => ({
        ...b,
        sampleInvoiceNumbers: b.sampleInvoiceNumbers.filter((n) => ownInvoiceNumbers.has(n)),
      }));
    }

    // Apply search filter if query provided
    if (search) {
      buyers = buyers.filter(
        (b) =>
          b.normalizedName.includes(search) ||
          b.buyerGstins.some((g) => g.toLowerCase().includes(search))
      );
    }

    // Apply sorting
    if (sortBy === "risk") {
      buyers.sort((a, b) => b.riskScore - a.riskScore);
    } else if (sortBy === "lateRate") {
      buyers.sort((a, b) => b.latePaymentRate - a.latePaymentRate);
    } else if (sortBy === "invoices") {
      buyers.sort((a, b) => b.totalInvoices - a.totalInvoices);
    } else {
      // Default: overdue value
      buyers.sort((a, b) => b.totalOverdueValue - a.totalOverdueValue);
    }

    return NextResponse.json({
      success: true,
      dataset: {
        ...dataset,
        buyers,
      },
    });
  } catch (error: any) {
    console.error("Buyer risk analytics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load buyer risk analytics" },
      { status: 500 }
    );
  }
}
