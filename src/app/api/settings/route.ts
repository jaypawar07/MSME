import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { can, computeEffectiveRate, isValidRate, isValidTimeHHMM, normalizeRole, quietHoursWarning, RATE_LIMITS } from "@/lib/settings/policy";

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
      // Settings saved before this rule existed may block every automatic reminder
      quietHoursWarning: quietHoursWarning(settings.quietHoursStart, settings.quietHoursEnd),
      auditLogs,
      teamMembers,
      currentUserRole: normalizeRole((session.user as any).role),
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
    if (!can((session.user as any).role, "editSettings")) {
      return NextResponse.json(
        { error: "Access Denied: Only the Company Owner can modify company settings." },
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

    for (const [field, value] of [["quietHoursStart", quietHoursStart], ["quietHoursEnd", quietHoursEnd]] as const) {
      if (value !== undefined && !isValidTimeHHMM(value)) {
        return NextResponse.json({ error: `${field} must be a time in HH:MM format` }, { status: 400 });
      }
    }
    // Check the window that will actually be saved, including an unchanged end
    const quietWarning = quietHoursWarning(
      quietHoursStart ?? currentSettings?.quietHoursStart ?? "21:00",
      quietHoursEnd ?? currentSettings?.quietHoursEnd ?? "08:00"
    );
    if (quietWarning) {
      return NextResponse.json({ error: quietWarning }, { status: 400 });
    }
    if (rbiBaseRate !== undefined && !isValidRate(rbiBaseRate, RATE_LIMITS.rbiBaseRate)) {
      return NextResponse.json({ error: "RBI Bank Rate must be between 0.01% and 25%" }, { status: 400 });
    }
    if (statutoryMultiplier !== undefined && !isValidRate(statutoryMultiplier, RATE_LIMITS.statutoryMultiplier)) {
      return NextResponse.json({ error: "Statutory multiplier must be between 1 and 5" }, { status: 400 });
    }

    // The effective rate is always derived on the server; a client-sent value is ignored.
    const oldRate = currentSettings?.effectiveAnnualRate ?? 16.5;
    const effectiveAnnualRate =
      rbiBaseRate !== undefined || statutoryMultiplier !== undefined
        ? computeEffectiveRate(
            rbiBaseRate ?? currentSettings?.rbiBaseRate ?? 5.5,
            statutoryMultiplier ?? currentSettings?.statutoryMultiplier ?? 3.0
          )
        : undefined;
    const newRate = effectiveAnnualRate ?? oldRate;

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
