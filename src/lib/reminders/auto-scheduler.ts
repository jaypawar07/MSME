/**
 * Automatic Reminder Scheduler for Settlr MSME Invoices
 * Evaluates overdue invoices against statutory milestones (Day 1, 30, 45, 60 past due)
 * and dispatches escalating notices via NotificationSender without manual clicks.
 */

import { format } from "date-fns";
import { calculateMSMEInterest, type InvoiceCalculations } from "@/lib/msme-calculator";
import { REMINDER_TEMPLATES, type ReminderTemplate } from "@/lib/reminder-templates";
import { getNotificationSender, type NotificationChannel } from "@/lib/notifications/notification-sender";
import { prisma } from "@/lib/prisma";
import { isQuietHours, istTimeHHMM } from "@/lib/settings/policy";

export type MilestoneKey = "DAY_1" | "DAY_30" | "DAY_45" | "DAY_60";

export interface ScheduleMilestone {
  key: MilestoneKey;
  thresholdDays: number;
  templateTone: keyof typeof REMINDER_TEMPLATES;
  label: string;
  badge: string;
}

export const AUTO_REMINDER_MILESTONES: ScheduleMilestone[] = [
  {
    key: "DAY_1",
    thresholdDays: 1,
    templateTone: "FRIENDLY",
    label: "Day 1 Past Due (Courtesy Follow-up)",
    badge: "Milestone: Day 1",
  },
  {
    key: "DAY_30",
    thresholdDays: 30,
    templateTone: "URGENT_MSMED",
    label: "Day 30 Past Due (Section 16 Statutory Demand)",
    badge: "Milestone: Day 30",
  },
  {
    key: "DAY_45",
    thresholdDays: 45,
    templateTone: "LEGAL_SAMADHAAN",
    label: "Day 45 Past Due (MSEFC Pre-Samadhaan Warning)",
    badge: "Milestone: Day 45",
  },
  {
    key: "DAY_60",
    thresholdDays: 60,
    templateTone: "LEGAL_SAMADHAAN",
    label: "Day 60 Past Due (Final Statutory Arbitration Notice)",
    badge: "Milestone: Day 60",
  },
];

/** The CompanySettings fields that control automatic reminders. */
export interface ReminderPreferences {
  enableEmail: boolean;
  enableWhatsApp: boolean;
  sendDay1: boolean;
  sendDay30: boolean;
  sendDay45: boolean;
  sendDay60: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

// Mirrors the CompanySettings defaults in prisma/schema.prisma
export const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  enableEmail: true,
  enableWhatsApp: true,
  sendDay1: true,
  sendDay30: true,
  sendDay45: true,
  sendDay60: true,
  quietHoursStart: "21:00",
  quietHoursEnd: "08:00",
};

/** Users who never opened Settings have no CompanySettings row; they get the defaults. */
export function toReminderPreferences(settings: Partial<ReminderPreferences> | null | undefined): ReminderPreferences {
  const prefs = { ...DEFAULT_REMINDER_PREFERENCES };
  if (!settings) return prefs;
  for (const key of Object.keys(prefs) as Array<keyof ReminderPreferences>) {
    const value = settings[key];
    if (value !== undefined && value !== null) (prefs as any)[key] = value;
  }
  return prefs;
}

function milestoneSwitches(prefs: ReminderPreferences): Partial<Record<MilestoneKey, boolean>> {
  return { DAY_1: prefs.sendDay1, DAY_30: prefs.sendDay30, DAY_45: prefs.sendDay45, DAY_60: prefs.sendDay60 };
}

export function isInQuietHours(prefs: ReminderPreferences, at: Date = new Date()): boolean {
  return isQuietHours(istTimeHHMM(at), prefs.quietHoursStart, prefs.quietHoursEnd);
}

/**
 * Email if enabled and the buyer has an address, otherwise WhatsApp if enabled and
 * the buyer has a phone. Null when neither is possible: never guess a recipient.
 */
export function chooseDeliveryChannel(
  buyer: { buyerEmail?: string | null; buyerPhone?: string | null },
  prefs: ReminderPreferences
): { channel: NotificationChannel; recipient: string } | null {
  const email = buyer.buyerEmail?.trim();
  const phone = buyer.buyerPhone?.trim();
  if (prefs.enableEmail && email) return { channel: "EMAIL", recipient: email };
  if (prefs.enableWhatsApp && phone) return { channel: "WHATSAPP", recipient: phone };
  return null;
}

export interface PlannedMilestoneReminder {
  milestone: MilestoneKey;
  thresholdDays: number;
  templateTone: keyof typeof REMINDER_TEMPLATES;
  recipientContact: string;
  channel: NotificationChannel;
  subject: string;
  body: string;
}

/**
 * Pure function: Calculates which milestones are due for dispatch given days overdue and prior sent history.
 * Ideal for deterministic unit testing.
 */
export function getPendingMilestones(
  daysOverdue: number,
  sentMilestones: string[],
  invoiceStatus: string = "PENDING",
  enabled: Partial<Record<MilestoneKey, boolean>> = {}
): ScheduleMilestone[] {
  if (invoiceStatus === "PAID" || invoiceStatus === "DISPUTED" || daysOverdue < 1) {
    return [];
  }

  const sentSet = new Set(sentMilestones.map((m) => m.toUpperCase()));
  const highestSentThreshold = Math.max(
    0,
    ...AUTO_REMINDER_MILESTONES.filter((m) => sentSet.has(m.key)).map((m) => m.thresholdDays)
  );

  // Only the latest reached milestone is sent. Earlier ones are superseded, so an
  // invoice that is already 65 days overdue gets one Day 60 notice, not four.
  // Milestones switched off in Settings are skipped entirely.
  const reached = AUTO_REMINDER_MILESTONES.filter(
    (m) => enabled[m.key] !== false && daysOverdue >= m.thresholdDays && m.thresholdDays > highestSentThreshold
  );
  return reached.length > 0 ? [reached[reached.length - 1]] : [];
}

const MILESTONE_TAG_PATTERNS: Array<[MilestoneKey, RegExp]> = AUTO_REMINDER_MILESTONES.map((m) => [
  m.key,
  new RegExp(`\\b(${m.key}|Day ${m.thresholdDays})\\b`),
]);

/**
 * Milestones already delivered, read from reminder history. Failed deliveries
 * don't count, so they're retried on the next run.
 */
export function getSentMilestones(
  existingReminders: Array<{ tone: string; subject?: string | null; message?: string; status?: string | null }>
): MilestoneKey[] {
  const sent = new Set<MilestoneKey>();
  for (const r of existingReminders) {
    if (r.status === "FAILED") continue;
    const combined = `${r.tone} ${r.subject || ""} ${r.message || ""}`;
    for (const [key, pattern] of MILESTONE_TAG_PATTERNS) {
      if (pattern.test(combined)) sent.add(key);
    }
  }
  return Array.from(sent);
}

type ReminderHistory = Array<{ tone: string; subject?: string | null; message?: string; status?: string | null }>;

/** The milestone (at most one) this invoice is due for, honouring the Day 1/30/45/60 switches. */
export function getDueMilestones(
  invoice: { invoiceDate: Date | string; amount: number; paymentTermsDays: number; status: string },
  existingReminders: ReminderHistory,
  asOfDate: Date,
  prefs: ReminderPreferences
): ScheduleMilestone[] {
  const { daysOverdue } = calculateMSMEInterest(
    invoice.invoiceDate,
    invoice.amount,
    invoice.paymentTermsDays,
    invoice.status,
    asOfDate
  );
  return getPendingMilestones(daysOverdue, getSentMilestones(existingReminders), invoice.status, milestoneSwitches(prefs));
}

/**
 * Evaluates an individual invoice and prepares any due auto-reminders
 */
export function evaluateInvoiceForAutoReminders(
  invoice: {
    id: string;
    invoiceNumber: string;
    buyerName: string;
    buyerEmail?: string | null;
    buyerPhone?: string | null;
    amount: number;
    invoiceDate: Date | string;
    paymentTermsDays: number;
    status: string;
    user?: { name: string; businessName?: string | null; udyamNumber?: string | null };
  },
  existingReminders: ReminderHistory,
  asOfDate: Date = new Date(),
  prefs: ReminderPreferences = DEFAULT_REMINDER_PREFERENCES,
  interestRateAnnual?: number | null
): PlannedMilestoneReminder[] {
  const calcs = calculateMSMEInterest(
    invoice.invoiceDate,
    invoice.amount,
    invoice.paymentTermsDays,
    invoice.status,
    asOfDate,
    interestRateAnnual
  );

  const dueMilestones = getDueMilestones(invoice, existingReminders, asOfDate, prefs);
  if (dueMilestones.length === 0) return [];

  const delivery = chooseDeliveryChannel(invoice, prefs);
  if (!delivery) return [];

  const supplierName = invoice.user?.businessName || invoice.user?.name || "Our MSME Enterprise";
  const udyamNumber = invoice.user?.udyamNumber || undefined;
  const formattedInvDate = format(new Date(invoice.invoiceDate), "dd MMM yyyy");
  const formattedDueDate = format(new Date(calcs.dueDate), "dd MMM yyyy");

  const planned: PlannedMilestoneReminder[] = [];

  for (const milestone of dueMilestones) {
    const template = REMINDER_TEMPLATES[milestone.templateTone] || REMINDER_TEMPLATES.FORMAL;

    const body = template.generateBody({
      buyerName: invoice.buyerName,
      supplierName,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      invoiceDate: formattedInvDate,
      dueDate: formattedDueDate,
      daysOverdue: calcs.daysOverdue,
      interestOwed: calcs.interestOwed,
      totalClaim: calcs.totalClaimAmount,
      udyamNumber,
      interestRateAnnual: calcs.interestRateAnnual,
    });

    const subject = `[${milestone.key}] ${template.getSubject({
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      interestRateAnnual: calcs.interestRateAnnual,
    })}`;

    planned.push({
      milestone: milestone.key,
      thresholdDays: milestone.thresholdDays,
      templateTone: milestone.templateTone,
      recipientContact: delivery.recipient,
      channel: delivery.channel,
      subject,
      body,
    });
  }

  return planned;
}

/**
 * Runner that scans and executes automatic reminders for a given user or entire system
 */
export async function runAutoReminderScheduler(userId?: string, asOfDate: Date = new Date()) {
  const whereClause = userId
    ? { userId, status: { notIn: ["PAID", "DISPUTED"] } }
    : { status: { notIn: ["PAID", "DISPUTED"] } };

  const invoices = await prisma.invoice.findMany({
    where: whereClause,
    include: {
      user: { include: { settings: true } },
      reminders: {
        select: { tone: true, subject: true, message: true, status: true, sentAt: true },
      },
    },
  });

  const executionLog: Array<{
    invoiceId: string;
    invoiceNumber: string;
    milestone: MilestoneKey;
    status: "SENT" | "FAILED";
    recipient: string;
  }> = [];
  const skipped: Array<{ invoiceId: string; invoiceNumber: string; reason: "QUIET_HOURS" | "NO_ENABLED_CHANNEL" }> = [];

  for (const inv of invoices) {
    const prefs = toReminderPreferences(inv.user.settings);
    const interestRateAnnual = inv.user.settings?.effectiveAnnualRate;
    if (getDueMilestones(inv, inv.reminders, asOfDate, prefs).length === 0) continue;

    // Nothing is recorded while held back, so the reminder goes out on the first run after quiet hours.
    if (isInQuietHours(prefs, asOfDate)) {
      skipped.push({ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, reason: "QUIET_HOURS" });
      continue;
    }
    if (!chooseDeliveryChannel(inv, prefs)) {
      skipped.push({ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, reason: "NO_ENABLED_CHANNEL" });
      continue;
    }

    const plannedList = evaluateInvoiceForAutoReminders(inv, inv.reminders, asOfDate, prefs, interestRateAnnual);

    for (const planned of plannedList) {
      try {
        const calcs = calculateMSMEInterest(inv.invoiceDate, inv.amount, inv.paymentTermsDays, inv.status, asOfDate, interestRateAnnual);
        const sender = getNotificationSender(planned.channel);

        const sendResult = await sender.send({
          to: planned.recipientContact,
          recipientName: inv.buyerName,
          supplierName: inv.user.businessName || inv.user.name,
          udyamNumber: inv.user.udyamNumber,
          subject: planned.subject,
          bodyText: planned.body,
          invoiceNumber: inv.invoiceNumber,
          amount: inv.amount,
          interestOwed: calcs.interestOwed,
          interestRateAnnual: calcs.interestRateAnnual,
          totalClaim: calcs.totalClaimAmount,
          daysOverdue: calcs.daysOverdue,
          metadata: { milestone: planned.milestone },
        });

        await prisma.reminder.create({
          data: {
            invoiceId: inv.id,
            buyerName: inv.buyerName,
            buyerContact: planned.recipientContact,
            channel: planned.channel,
            tone: planned.templateTone,
            subject: planned.subject,
            message: `${planned.body}\n\n[Auto-Scheduled by Settlr on ${planned.milestone}]`,
            status: sendResult.success ? "SENT" : "FAILED",
            sentAt: sendResult.timestamp,
          },
        });

        executionLog.push({
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          milestone: planned.milestone,
          status: sendResult.success ? "SENT" : "FAILED",
          recipient: planned.recipientContact,
        });
      } catch (err) {
        console.error(`Error dispatching auto-reminder for invoice ${inv.invoiceNumber}:`, err);
      }
    }
  }

  return {
    evaluatedInvoicesCount: invoices.length,
    dispatchedRemindersCount: executionLog.length,
    executionLog,
    skipped,
  };
}
