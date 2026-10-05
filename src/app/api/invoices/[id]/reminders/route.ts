import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNotificationSender, NotificationChannel } from "@/lib/notifications/notification-sender";
import { calculateMSMEInterest } from "@/lib/msme-calculator";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, userId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const reminders = await prisma.reminder.findMany({
      where: { invoiceId: params.id },
      orderBy: { sentAt: "desc" },
    });

    return NextResponse.json({ reminders });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, userId },
      include: { user: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const body = await req.json();
    const { 
      channel = "EMAIL", 
      tone = "FORMAL", 
      subject = `Settlr Notice: Invoice #${invoice.invoiceNumber}`, 
      message, 
      buyerContact 
    } = body;

    if (!message) {
      return NextResponse.json({ error: "Message body is required" }, { status: 400 });
    }

    const targetChannel: NotificationChannel = channel.toUpperCase() === "WHATSAPP" ? "WHATSAPP" : "EMAIL";
    const contact = buyerContact || (targetChannel === "EMAIL" ? invoice.buyerEmail : invoice.buyerPhone) || "contact@example.com";

    // Calculate current interest metrics
    const calcs = calculateMSMEInterest(invoice.invoiceDate, invoice.amount, invoice.paymentTermsDays, invoice.status);

    // Send through NotificationSender
    const sender = getNotificationSender(targetChannel);
    const result = await sender.send({
      to: contact,
      recipientName: invoice.buyerName,
      supplierName: invoice.user.businessName || invoice.user.name,
      udyamNumber: invoice.user.udyamNumber,
      subject: subject.replace("{invoiceNumber}", invoice.invoiceNumber).replace("{amount}", invoice.amount.toLocaleString("en-IN")),
      bodyText: message.trim(),
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      interestOwed: calcs.interestOwed,
      totalClaim: calcs.totalClaimAmount,
      daysOverdue: calcs.daysOverdue,
      dueDate: invoice.invoiceDate.toISOString().split("T")[0],
    });

    // Record the reminder in the database
    const reminder = await prisma.reminder.create({
      data: {
        invoiceId: params.id,
        buyerName: invoice.buyerName,
        buyerContact: contact,
        channel: targetChannel,
        tone: tone.toUpperCase(),
        subject: subject,
        message: message.trim(),
        status: result.success ? "SENT" : "FAILED",
        sentAt: result.timestamp,
      },
    });

    return NextResponse.json(
      {
        message: result.success ? "Reminder sent successfully" : "Reminder failed to deliver",
        reminder,
        deliveryResult: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error sending reminder:", error);
    return NextResponse.json({ error: "Failed to send reminder" }, { status: 500 });
  }
}

