import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateMSMEInterest } from "@/lib/msme-calculator";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Fetch user's company settings for custom rate if set
    const settings = await (prisma as any).companySettings.findUnique({
      where: { userId },
    });
    const annualRate = settings?.effectiveAnnualRate || 16.5;

    const invoices = await (prisma as any).invoice.findMany({
      where: { userId },
      include: {
        reminders: true,
        financingLeads: true,
      },
      orderBy: { invoiceDate: "desc" },
    });

    // Generate CSV data
    const headers = [
      "Invoice Number",
      "Buyer Name",
      "Buyer Email",
      "Buyer Phone",
      "Buyer GSTIN",
      "Invoice Date",
      "Payment Terms (Days)",
      "Statutory Due Date",
      "Principal Amount (INR)",
      "Status",
      "Days Elapsed",
      "Days Overdue",
      "Accrued Statutory Interest (INR)",
      "Total Claim Amount (INR)",
      "Reminders Sent Count",
      "Proof of Delivery Available",
    ];

    const rows = invoices.map((inv: any) => {
      const calcs = calculateMSMEInterest(
        inv.invoiceDate,
        inv.amount,
        inv.paymentTermsDays,
        inv.status
      );

      return [
        `"${inv.invoiceNumber.replace(/"/g, '""')}"`,
        `"${inv.buyerName.replace(/"/g, '""')}"`,
        `"${(inv.buyerEmail || "").replace(/"/g, '""')}"`,
        `"${(inv.buyerPhone || "").replace(/"/g, '""')}"`,
        `"${(inv.buyerGstin || "").replace(/"/g, '""')}"`,
        format(new Date(inv.invoiceDate), "yyyy-MM-dd"),
        inv.paymentTermsDays,
        format(new Date(calcs.dueDate), "yyyy-MM-dd"),
        inv.amount.toFixed(2),
        inv.status,
        calcs.daysElapsed,
        calcs.daysOverdue,
        calcs.interestOwed.toFixed(2),
        calcs.totalClaimAmount.toFixed(2),
        inv.reminders?.length || 0,
        inv.proofOfDeliveryUrl ? "YES" : "NO",
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const filename = `settlr_company_data_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export company data" },
      { status: 500 }
    );
  }
}
