/**
 * Company settings rules shared by the API routes, the reminder scheduler and tests:
 * Section 16 rate derivation, quiet hours, and role permissions.
 */

export type UserRole = "OWNER" | "ACCOUNTANT" | "STAFF" | "ADMIN";

export type Permission = "editSettings" | "manageTeam" | "deleteCompany";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: ["editSettings", "manageTeam", "deleteCompany"],
  ADMIN: ["editSettings", "manageTeam", "deleteCompany"],
  ACCOUNTANT: [],
  STAFF: [],
};

/** Sessions issued before roles were added to the JWT carry no role; they belong to account owners. */
export function normalizeRole(role: unknown): UserRole {
  return typeof role === "string" && role in ROLE_PERMISSIONS ? (role as UserRole) : "OWNER";
}

export function can(role: unknown, permission: Permission): boolean {
  return ROLE_PERMISSIONS[normalizeRole(role)].includes(permission);
}

export const RATE_LIMITS = {
  rbiBaseRate: { min: 0.01, max: 25 },
  statutoryMultiplier: { min: 1, max: 5 },
};

/** Section 16: compound interest at three times the RBI Bank Rate. */
export function computeEffectiveRate(rbiBaseRate: number, statutoryMultiplier: number): number {
  return Number((rbiBaseRate * statutoryMultiplier).toFixed(2));
}

export function isValidRate(value: unknown, limits: { min: number; max: number }): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= limits.min && value <= limits.max;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTimeHHMM(value: unknown): value is string {
  return typeof value === "string" && HHMM.test(value);
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** True when `time` (HH:MM) falls inside the quiet window, which may span midnight. */
export function isQuietHours(time: string, start = "21:00", end = "08:00"): boolean {
  const t = toMinutes(time);
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s === e) return false;
  return s > e ? t >= s || t < e : t >= s && t < e;
}

/** Current wall-clock time in India as HH:MM, independent of the server's timezone. */
export function istTimeHHMM(date: Date = new Date()): string {
  const ist = new Date(date.getTime() + (5 * 60 + 30) * 60 * 1000);
  return `${String(ist.getUTCHours()).padStart(2, "0")}:${String(ist.getUTCMinutes()).padStart(2, "0")}`;
}

/**
 * When the daily automatic-reminder job can run, in IST. vercel.json schedules it at
 * 03:30 UTC (09:00 IST); on Vercel's Hobby plan it may fire anytime in that UTC hour.
 * Kept in sync with vercel.json by tests/cron-reminders.test.mjs.
 */
export const AUTO_SEND_WINDOW_IST = { start: "08:30", end: "09:30" };

/** True if the quiet window overlaps the send window, so automatic reminders could be held back every day. */
export function quietHoursBlockAutoSend(start: string, end: string): boolean {
  const from = toMinutes(AUTO_SEND_WINDOW_IST.start);
  const to = toMinutes(AUTO_SEND_WINDOW_IST.end);
  for (let m = from; m < to; m++) {
    const hhmm = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    if (isQuietHours(hhmm, start, end)) return true;
  }
  return false;
}

export function quietHoursWarning(start: string, end: string): string | null {
  return quietHoursBlockAutoSend(start, end)
    ? `Automatic reminders are sent once a day between ${AUTO_SEND_WINDOW_IST.start} and ${AUTO_SEND_WINDOW_IST.end} IST. ` +
        `Quiet hours ${start}–${end} overlap that window, so automatic reminders may never be sent. ` +
        `End quiet hours by ${AUTO_SEND_WINDOW_IST.start} or start them after ${AUTO_SEND_WINDOW_IST.end}.`
    : null;
}
