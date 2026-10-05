import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runAutoReminderScheduler, AUTO_REMINDER_MILESTONES } from "@/lib/reminders/auto-scheduler";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : undefined;

    return NextResponse.json({
      milestones: AUTO_REMINDER_MILESTONES,
      description: "Automatic Escalating Statutory Reminders scheduled at Day 1, 30, 45, and 60 past due under MSMED Act 2006",
      status: "ACTIVE",
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to retrieve auto-schedule config" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const result = await runAutoReminderScheduler(userId);

    return NextResponse.json({
      success: true,
      message: `Evaluated ${result.evaluatedInvoicesCount} invoices. Automatically dispatched ${result.dispatchedRemindersCount} due milestone reminders.`,
      result,
    });
  } catch (error: any) {
    console.error("Auto-scheduler error:", error);
    return NextResponse.json({ error: "Failed to run auto-reminder scheduler" }, { status: 500 });
  }
}
