/**
 * Pilot Usage Analytics & Telemetry
 * 
 * Supports:
 * 1. Self-hosted database logging via `/api/analytics/events` and `prisma.analyticsEvent`
 * 2. Optional PostHog client integration if NEXT_PUBLIC_POSTHOG_KEY is supplied
 * 3. Safe no-throw fallback so telemetry failure never breaks user workflows
 */

export type PilotEventName =
  | "user_registered"
  | "user_signed_in"
  | "invoice_created"
  | "invoice_ocr_scanned"
  | "invoice_csv_imported"
  | "invoice_status_updated"
  | "reminder_previewed"
  | "reminder_sent"
  | "auto_scheduler_run"
  | "dispute_package_generated"
  | "gst_recon_uploaded"
  | "financing_lead_submitted"
  | "onboarding_started"
  | "onboarding_completed"
  | "language_switched"
  | "pilot_lead_signup";

export interface EventProperties {
  userId?: string;
  invoiceId?: string;
  amount?: number;
  channel?: string;
  tone?: string;
  count?: number;
  language?: string;
  source?: string;
  step?: number;
  [key: string]: any;
}

export async function trackPilotEvent(
  event: PilotEventName,
  properties: EventProperties = {}
): Promise<void> {
  // 1. PostHog Client-Side Dispatch (if available on window)
  if (typeof window !== "undefined" && (window as any).posthog) {
    try {
      (window as any).posthog.capture(event, properties);
    } catch {
      // ignore
    }
  }

  // 2. Self-Hosted / DB Telemetry
  try {
    if (typeof window !== "undefined") {
      // Browser environment: send Beacon or fetch
      const payload = JSON.stringify({
        event,
        properties,
        timestamp: new Date().toISOString(),
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics/events", payload);
      } else {
        await fetch("/api/analytics/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        });
      }
    }
  } catch {
    // Silently suppress telemetry errors in UI
  }
}
