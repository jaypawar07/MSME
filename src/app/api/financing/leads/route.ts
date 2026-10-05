import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    const {
      invoiceId,
      contactName,
      contactPhone,
      contactEmail,
      requestedAmount,
      discountTenorDays = 30,
      businessPan,
      consentGiven,
      notes,
    } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }
    if (!contactName || !contactPhone || !contactEmail) {
      return NextResponse.json({ error: "Contact name, phone, and email are required" }, { status: 400 });
    }
    if (!consentGiven) {
      return NextResponse.json({ error: "User consent is required to share with TReDS partners" }, { status: 400 });
    }

    // Verify invoice belongs to user
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const leadAmount = parseFloat(requestedAmount) || invoice.amount;

    // Create FinancingLead record
    const lead = await prisma.financingLead.create({
      data: {
        invoiceId,
        userId,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim(),
        requestedAmount: leadAmount,
        discountTenorDays: parseInt(discountTenorDays, 10) || 30,
        businessPan: businessPan ? businessPan.trim().toUpperCase() : null,
        status: "SUBMITTED",
        consentGiven: true,
        consentAt: new Date(),
        notes: notes ? notes.trim() : `Lead generated for invoice #${invoice.invoiceNumber} (${invoice.buyerName})`,
      },
    });

    // Estimate TReDS discounting parameters (Stub quote for partner network)
    const advanceRate = 0.88; // 88% upfront
    const estimatedAdvanceAmount = Math.round(leadAmount * advanceRate * 100) / 100;
    const estimatedDiscountFee = Math.round(leadAmount * 0.0125 * 100) / 100;

    return NextResponse.json({
      success: true,
      message: "Financing referral lead submitted successfully. A TReDS / factoring desk specialist will reach out within 24 business hours.",
      leadId: lead.id,
      quote: {
        requestedAmount: leadAmount,
        advanceRatePercent: 88,
        estimatedUpfrontPayout: estimatedAdvanceAmount,
        estimatedDiscountFee,
        partnerNetwork: "RBI-Regulated TReDS Exchanges (RXIL / M1xchange / Invoicemart)",
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("Financing lead creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit financing lead" },
      { status: 500 }
    );
  }
}
