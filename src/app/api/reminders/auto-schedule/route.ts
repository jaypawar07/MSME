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

    const quiet = result.skipped.filter((s) => s.reason === "QUIET_HOURS").length;
    const noChannel = result.skipped.filter((s) => s.reason === "NO_ENABLED_CHANNEL").length;
    const notes = [
      quiet > 0 && `${quiet} held back for quiet hours (they'll go out after quiet hours end)`,
      noChannel > 0 && `${noChannel} skipped: no buyer email/phone for the channels enabled in Settings`,
    ].filter(Boolean);

    return NextResponse.json({
      success: true,
      message:
        `Evaluated ${result.evaluatedInvoicesCount} invoices. Automatically dispatched ${result.dispatchedRemindersCount} due milestone reminders.` +
        (notes.length > 0 ? ` ${notes.join("; ")}.` : ""),
      result,
    });
  } catch (error: any) {
    console.error("Auto-scheduler error:", error);
    return NextResponse.json({ error: "Failed to run auto-reminder scheduler" }, { status: 500 });
  }
}
