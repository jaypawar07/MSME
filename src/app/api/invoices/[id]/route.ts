import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        userId,
      },
      include: {
        reminders: {
          orderBy: { sentAt: "desc" },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "PAID") {
        updateData.paidAt = new Date();
      } else if (body.status !== "PAID" && existing.status === "PAID") {
        updateData.paidAt = null;
      }
    }

    if (body.buyerName !== undefined) updateData.buyerName = body.buyerName.trim();
    if (body.buyerEmail !== undefined) updateData.buyerEmail = body.buyerEmail ? body.buyerEmail.trim() : null;
    if (body.buyerPhone !== undefined) updateData.buyerPhone = body.buyerPhone ? body.buyerPhone.trim() : null;
    if (body.buyerGstin !== undefined) updateData.buyerGstin = body.buyerGstin ? body.buyerGstin.trim().toUpperCase() : null;
    if (body.invoiceNumber !== undefined) updateData.invoiceNumber = body.invoiceNumber.trim();
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
    if (body.invoiceDate !== undefined) updateData.invoiceDate = new Date(body.invoiceDate);
    if (body.paymentTermsDays !== undefined) updateData.paymentTermsDays = parseInt(body.paymentTermsDays, 10);
    if (body.photoUrl !== undefined) updateData.photoUrl = body.photoUrl;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        reminders: {
          orderBy: { sentAt: "desc" },
        },
      },
    });

    return NextResponse.json({ message: "Invoice updated", invoice: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    await prisma.invoice.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Invoice deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
