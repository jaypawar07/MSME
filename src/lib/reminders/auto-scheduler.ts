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
    label: "Day 30 Past Due (Section 16 Statutory Demand @ 16.5%)",
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
  invoiceStatus: string = "PENDING"
): ScheduleMilestone[] {
  if (invoiceStatus === "PAID" || invoiceStatus === "DISPUTED" || daysOverdue < 1) {
    return [];
  }

  const sentSet = new Set(sentMilestones.map((m) => m.toUpperCase()));

  // Filter milestones where overdue threshold has been reached and not yet sent
  return AUTO_REMINDER_MILESTONES.filter(
    (m) => daysOverdue >= m.thresholdDays && !sentSet.has(m.key)
  );
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
  existingReminders: Array<{ tone: string; subject?: string | null; message?: string }>,
  asOfDate: Date = new Date()
): PlannedMilestoneReminder[] {
  const calcs = calculateMSMEInterest(
    invoice.invoiceDate,
    invoice.amount,
    invoice.paymentTermsDays,
    invoice.status,
    asOfDate
  );

  // Extract sent milestones from prior reminder records
  const sentMilestones: string[] = [];
  existingReminders.forEach((r) => {
    const combined = `${r.tone} ${r.subject || ""} ${r.message || ""}`;
    if (combined.includes("DAY_1") || combined.includes("Day 1")) sentMilestones.push("DAY_1");
    if (combined.includes("DAY_30") || combined.includes("Day 30")) sentMilestones.push("DAY_30");
    if (combined.includes("DAY_45") || combined.includes("Day 45")) sentMilestones.push("DAY_45");
    if (combined.includes("DAY_60") || combined.includes("Day 60")) sentMilestones.push("DAY_60");
  });

  const dueMilestones = getPendingMilestones(calcs.daysOverdue, sentMilestones, invoice.status);
  if (dueMilestones.length === 0) return [];

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
    });

    const subject = `[${milestone.key}] ${template.getSubject({
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
    })}`;

    const channel: NotificationChannel = invoice.buyerEmail ? "EMAIL" : "WHATSAPP";
    const recipientContact = invoice.buyerEmail || invoice.buyerPhone || "accounts@buyer.com";

    planned.push({
      milestone: milestone.key,
      thresholdDays: milestone.thresholdDays,
      templateTone: milestone.templateTone,
      recipientContact,
      channel,
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
      user: true,
      reminders: {
        select: { tone: true, subject: true, message: true, sentAt: true },
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

  for (const inv of invoices) {
    const plannedList = evaluateInvoiceForAutoReminders(inv, inv.reminders, asOfDate);

    for (const planned of plannedList) {
      try {
        const calcs = calculateMSMEInterest(inv.invoiceDate, inv.amount, inv.paymentTermsDays, inv.status, asOfDate);
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
  };
}
