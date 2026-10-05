import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    const whereClause: any = { userId };
    if (statusFilter && statusFilter !== "ALL") {
      whereClause.status = statusFilter;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        reminders: {
          orderBy: { sentAt: "desc" },
        },
      },
      orderBy: {
        invoiceDate: "asc", // Will sort properly in frontend by calculated due date or invoice date
      },
    });

    return NextResponse.json({ invoices });
  } catch (error: any) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    const {
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerGstin,
      invoiceNumber,
      amount,
      invoiceDate,
      paymentTermsDays = 45,
      status = "PENDING",
      photoUrl,
      notes,
    } = body;

    if (!buyerName || !invoiceNumber || !amount || !invoiceDate) {
      return NextResponse.json(
        { error: "Buyer name, invoice number, amount, and invoice date are required" },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    const parsedTerms = parseInt(paymentTermsDays, 10) || 45;
    if (parsedTerms < 1 || parsedTerms > 45) {
      return NextResponse.json(
        { error: "Payment terms under Section 15 of MSMED Act 2006 cannot exceed 45 days" },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.create({
      data: {
        userId,
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail ? buyerEmail.trim() : null,
        buyerPhone: buyerPhone ? buyerPhone.trim() : null,
        buyerGstin: buyerGstin ? buyerGstin.trim().toUpperCase() : null,
        invoiceNumber: invoiceNumber.trim(),
        amount: parsedAmount,
        invoiceDate: new Date(invoiceDate),
        paymentTermsDays: parsedTerms,
        status: status || "PENDING",
        photoUrl: photoUrl || null,
        notes: notes ? notes.trim() : null,
      },
      include: {
        reminders: true,
      },
    });

    return NextResponse.json({ message: "Invoice created successfully", invoice }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: error.message || "Failed to create invoice" }, { status: 500 });
  }
}
