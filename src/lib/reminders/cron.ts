/**
 * Daily automatic reminders for every supplier, triggered by Vercel Cron
 * (see vercel.json). Vercel sends "Authorization: Bearer <CRON_SECRET>".
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runAutoReminderScheduler } from "@/lib/reminders/auto-scheduler";

function sameSecret(a: string, b: string): boolean {
  // Hash first so the comparison is constant-time regardless of length
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(a), digest(b));
}

export async function handleCronReminders(req: Request, now: Date = new Date()) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Fail closed: without a secret anyone could trigger mass reminders.
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }

  if (!sameSecret(req.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runAutoReminderScheduler(undefined, now);

  // Counts only: the execution log contains buyer emails and phone numbers.
  return NextResponse.json({
    success: true,
    ranAt: now.toISOString(),
    evaluated: result.evaluatedInvoicesCount,
    dispatched: result.dispatchedRemindersCount,
    failed: result.executionLog.filter((e) => e.status === "FAILED").length,
    heldForQuietHours: result.skipped.filter((s) => s.reason === "QUIET_HOURS").length,
    skippedNoChannel: result.skipped.filter((s) => s.reason === "NO_ENABLED_CHANNEL").length,
  });
}
