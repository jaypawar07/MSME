import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Fetch or create default CompanySettings
    let settings = await prisma.companySettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          userId,
          rbiBaseRate: 5.5,
          statutoryMultiplier: 3.0,
          effectiveAnnualRate: 16.5,
          rateEffectiveDate: new Date(),
          rateNotes: "Default 16.5% p.a. (3x RBI Bank Rate 5.5%) under Section 16 MSMED Act 2006",
        },
      });
    }

    // Fetch Rate Audit Logs
    const auditLogs = await prisma.rateAuditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Fetch Team Members
    const teamMembers = await prisma.teamMember.findMany({
      where: { ownerUserId: userId },
      orderBy: { invitedAt: "desc" },
    });

    return NextResponse.json({
      settings,
      auditLogs,
      teamMembers,
      currentUserRole: (session.user as any).role || "OWNER",
      companyName: (session.user as any).businessName || session.user.name,
    });
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role || "OWNER";

    if (userRole === "STAFF") {
      return NextResponse.json(
        { error: "Access Denied: Staff accounts cannot modify company settings." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      enableWhatsApp,
      enableEmail,
      sendDay1,
      sendDay30,
      sendDay45,
      sendDay60,
      quietHoursStart,
      quietHoursEnd,
      rbiBaseRate,
      statutoryMultiplier,
      effectiveAnnualRate,
      rateEffectiveDate,
      rateNotes,
      tallyStatus,
      whatsappStatus,
      whatsappPhoneNumberId,
      whatsappAccountId,
      whatsappApiKey,
      gstGspStatus,
      gstGspUsername,
    } = body;

    // Get current settings to detect interest rate change
    const currentSettings = await prisma.companySettings.findUnique({
      where: { userId },
    });

    const oldRate = currentSettings?.effectiveAnnualRate ?? 16.5;
    const newRate = typeof effectiveAnnualRate === "number" ? effectiveAnnualRate : oldRate;

    // If rate changed, log audit record
    if (Math.abs(oldRate - newRate) > 0.001) {
      await prisma.rateAuditLog.create({
        data: {
          userId,
          oldRate,
          newRate,
          effectiveDate: rateEffectiveDate ? new Date(rateEffectiveDate) : new Date(),
          reason: rateNotes || "Statutory RBI Bank Rate adjustment",
          changedBy: session.user.name || session.user.email,
        },
      });
    }

    const updated = await prisma.companySettings.upsert({
      where: { userId },
      update: {
        ...(typeof enableWhatsApp === "boolean" && { enableWhatsApp }),
        ...(typeof enableEmail === "boolean" && { enableEmail }),
        ...(typeof sendDay1 === "boolean" && { sendDay1 }),
        ...(typeof sendDay30 === "boolean" && { sendDay30 }),
        ...(typeof sendDay45 === "boolean" && { sendDay45 }),
        ...(typeof sendDay60 === "boolean" && { sendDay60 }),
        ...(quietHoursStart && { quietHoursStart }),
        ...(quietHoursEnd && { quietHoursEnd }),
        ...(typeof rbiBaseRate === "number" && { rbiBaseRate }),
        ...(typeof statutoryMultiplier === "number" && { statutoryMultiplier }),
        ...(typeof effectiveAnnualRate === "number" && { effectiveAnnualRate }),
        ...(rateEffectiveDate && { rateEffectiveDate: new Date(rateEffectiveDate) }),
        ...(rateNotes !== undefined && { rateNotes }),
        ...(tallyStatus && { tallyStatus }),
        ...(whatsappStatus && { whatsappStatus }),
        ...(whatsappPhoneNumberId !== undefined && { whatsappPhoneNumberId }),
        ...(whatsappAccountId !== undefined && { whatsappAccountId }),
        ...(whatsappApiKey !== undefined && { whatsappApiKey }),
        ...(gstGspStatus && { gstGspStatus }),
        ...(gstGspUsername !== undefined && { gstGspUsername }),
      },
      create: {
        userId,
        enableWhatsApp: enableWhatsApp ?? true,
        enableEmail: enableEmail ?? true,
        sendDay1: sendDay1 ?? true,
        sendDay30: sendDay30 ?? true,
        sendDay45: sendDay45 ?? true,
        sendDay60: sendDay60 ?? true,
        quietHoursStart: quietHoursStart || "21:00",
        quietHoursEnd: quietHoursEnd || "08:00",
        rbiBaseRate: rbiBaseRate ?? 5.5,
        statutoryMultiplier: statutoryMultiplier ?? 3.0,
        effectiveAnnualRate: effectiveAnnualRate ?? 16.5,
        rateEffectiveDate: rateEffectiveDate ? new Date(rateEffectiveDate) : new Date(),
        rateNotes: rateNotes || "Section 16 Statutory Rate",
      },
    });

    return NextResponse.json({
      success: true,
      settings: updated,
      message: "Company settings updated successfully.",
    });
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
