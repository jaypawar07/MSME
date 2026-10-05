import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildDisputePackageData, generateDisputePackageHtml } from "@/lib/dispute/dispute-package-generator";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, userId },
      include: {
        user: true,
        reminders: {
          orderBy: { sentAt: "asc" },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const disputeData = buildDisputePackageData({
      claimant: {
        name: invoice.user.name,
        businessName: invoice.user.businessName,
        udyamNumber: invoice.user.udyamNumber,
        email: invoice.user.email,
        phone: invoice.user.phone,
      },
      respondent: {
        name: invoice.buyerName,
        gstin: invoice.buyerGstin,
        email: invoice.buyerEmail,
        phone: invoice.buyerPhone,
      },
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        invoiceDate: invoice.invoiceDate,
        paymentTermsDays: invoice.paymentTermsDays,
        photoUrl: invoice.photoUrl,
        proofOfDeliveryUrl: (invoice as any).proofOfDeliveryUrl,
        notes: invoice.notes,
      },
      reminders: invoice.reminders.map((r) => ({
        sentAt: r.sentAt,
        tone: r.tone,
        channel: r.channel,
        subject: r.subject,
        message: r.message,
        status: r.status,
      })),
    });

    const url = new URL(req.url);
    const format = url.searchParams.get("format");

    if (format === "html") {
      const html = generateDisputePackageHtml(disputeData);
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return NextResponse.json({
      success: true,
      disputeData,
    });
  } catch (error: any) {
    console.error("Dispute package error:", error);
    return NextResponse.json({ error: "Failed to generate dispute package" }, { status: 500 });
  }
}
