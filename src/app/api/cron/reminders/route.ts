import { handleCronReminders } from "@/lib/reminders/cron";

// Runs daily via Vercel Cron (vercel.json). Must never be cached or prerendered.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handleCronReminders(req);
}
